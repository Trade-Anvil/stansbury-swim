import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common'
import { Model, Types } from 'mongoose'
import { InjectModel } from '@nestjs/mongoose'
import { ScheduleEntity } from './entities/schedule.entity'
import { Schedule } from './schedule'
import { CreateRegistrationDto } from './dto/create-registration.dto'
import { Registration } from './registration'
import { TransactionService } from 'payment/transaction.service'
import { LessonTypesEnum } from 'shared/lesson-types.enum'
import { CreditTypesEnum } from 'shared/credit-types.enum'
import { TransactionTypesEnum } from 'shared/transaction-types.enum'
import { UserService } from 'user/user.service'
import { RegistrationCanceledEvent } from './events/registration-canceled.event'
import { EventBus } from '@nestjs/cqrs'
import { differenceInHours } from 'date-fns'
import { StudentService } from 'student/student.service'
import { RegistrationCreatedEvent } from './events/registration-created.event'
import { RegistrationStatusEnum } from 'shared/registration-status-types.enum'
import { HOLD_TTL_MS, hasAvailableSeatExpr } from './registration.util'

const mapper = (entity: ScheduleEntity): Schedule => {
  return {
    id: entity._id.toString(),
    poolId: entity.poolId.toString(),
    instructorId: entity.instructorId.toString(),
    classSize: entity.classSize,
    lessonType: entity.lessonType,
    startDateTime: entity.startDateTime,
    endDateTime: entity.endDateTime,
    registrations: entity.registrations.map(registration => ({
      userId: registration.userId.toString(),
      studentId: registration.studentId.toString(),
      createdAt: registration.createdAt,
      transactionId: registration.transactionId?.toString(),
      status: registration.status ?? RegistrationStatusEnum.CONFIRMED,
      heldUntil: registration.heldUntil,
    })),
  }
}

@Injectable()
export class RegistrationService {
  constructor(
    @InjectModel(ScheduleEntity.name)
    private readonly model: Model<ScheduleEntity>,
    private readonly transactionService: TransactionService,
    private readonly userService: UserService,
    private readonly eventBus: EventBus,
    private readonly studentService: StudentService,
  ) {}

  async create(scheduleId: string, createRegistrationDto: CreateRegistrationDto): Promise<Schedule> {
    const user = await this.userService.findOne(createRegistrationDto.userId)
    if (!user) {
      throw new NotFoundException('User not found')
    }

    if (!user.signedWaiver) {
      throw new BadRequestException('User has not signed waiver')
    }
    // Find schedule
    const schedule = await this.model.findById(new Types.ObjectId(scheduleId))
    if (!schedule) {
      throw new NotFoundException('Schedule not found')
    }

    const student = await this.studentService.findOne(createRegistrationDto.studentId)
    if (!student || student.userId.toString() !== createRegistrationDto.userId) {
      throw new NotFoundException('Student not found')
    }
    if (student.deletedAt) {
      throw new BadRequestException('Student has been removed')
    }

    const creditBalances = await this.transactionService.readCreditBalances(createRegistrationDto.userId)
    const creditBalance = creditBalances.find(creditBalance =>
      schedule.lessonType == LessonTypesEnum.PRIVATE
        ? creditBalance.creditType == 'private'
        : creditBalance.creditType == 'group',
    )

    if (!creditBalance || creditBalance.balance <= 0) {
      throw new BadRequestException('Not enough credits')
    }

    // Prepare registration object (transactionId will be set after transaction creation)
    // Atomically push registration if class is not full
    const registration = {
      userId: new Types.ObjectId(createRegistrationDto.userId),
      studentId: new Types.ObjectId(createRegistrationDto.studentId),
      createdAt: new Date(),
      status: RegistrationStatusEnum.CONFIRMED,
      transactionId: undefined, // placeholder
    }

    // Atomically check and push registration. The capacity guard counts confirmed seats
    // plus unexpired holds, so a seat reserved mid-checkout can't be double-booked here.
    const updated = await this.model.findOneAndUpdate(
      {
        _id: new Types.ObjectId(scheduleId),
        $expr: hasAvailableSeatExpr,
      },
      { $push: { registrations: registration } },
      { new: true },
    )

    if (!updated) {
      throw new BadRequestException('Class is full')
    }

    // Not rolled back: if the transaction below fails after the seat was pushed, the seat stays taken
    // without a credit being spent.
    const transaction = await this.transactionService.create({
      userId: createRegistrationDto.userId,
      credits: -1,
      creditType: schedule.lessonType == LessonTypesEnum.PRIVATE ? CreditTypesEnum.PRIVATE : CreditTypesEnum.GROUP,
      transactionType: TransactionTypesEnum.Register,
      scheduleId,
      studentId: createRegistrationDto.studentId,
    })

    // Update the registration with the transactionId
    await this.model.updateOne(
      {
        _id: new Types.ObjectId(scheduleId),
        'registrations.userId': new Types.ObjectId(createRegistrationDto.userId),
        'registrations.studentId': new Types.ObjectId(createRegistrationDto.studentId),
      },
      {
        $set: {
          'registrations.$.transactionId': transaction.id,
        },
      },
    )

    const entity = await this.model.findById(schedule._id)
    if (!entity) {
      throw new NotFoundException('Schedule not found')
    }
    this.eventBus.publish(new RegistrationCreatedEvent(createRegistrationDto.userId, scheduleId, student.id))
    return mapper(entity)
  }

  /**
   * Reserve a seat during checkout, BEFORE the customer is charged. Pushes a HELD
   * registration (no transaction yet) guarded by the capacity check so the seat can't be
   * oversold. Expired holds are pulled in the same write so they never permanently block a
   * class. Confirmed later by {@link confirmHold} once payment succeeds.
   */
  async hold(scheduleId: string, createRegistrationDto: CreateRegistrationDto): Promise<void> {
    const user = await this.userService.findOne(createRegistrationDto.userId)
    if (!user) {
      throw new NotFoundException('User not found')
    }
    if (!user.signedWaiver) {
      throw new BadRequestException('User has not signed waiver')
    }

    const student = await this.studentService.findOne(createRegistrationDto.studentId)
    if (!student || student.userId.toString() !== createRegistrationDto.userId) {
      throw new NotFoundException('Student not found')
    }
    if (student.deletedAt) {
      throw new BadRequestException('Student has been removed')
    }

    const now = new Date()

    // First, drop any expired holds so they don't count against capacity for this push.
    await this.model.updateOne(
      { _id: new Types.ObjectId(scheduleId) },
      {
        $pull: {
          registrations: { status: RegistrationStatusEnum.HELD, heldUntil: { $lte: now } },
        },
      },
    )

    const registration = {
      userId: new Types.ObjectId(createRegistrationDto.userId),
      studentId: new Types.ObjectId(createRegistrationDto.studentId),
      createdAt: now,
      status: RegistrationStatusEnum.HELD,
      heldUntil: new Date(now.getTime() + HOLD_TTL_MS),
      transactionId: undefined,
    }

    const updated = await this.model.findOneAndUpdate(
      {
        _id: new Types.ObjectId(scheduleId),
        $expr: hasAvailableSeatExpr,
      },
      { $push: { registrations: registration } },
      { new: true },
    )

    if (!updated) {
      throw new BadRequestException('Schedule is full')
    }
  }

  /**
   * Finalize a held seat once payment has cleared. Flips the HELD registration to CONFIRMED
   * and books the -1 Register credit transaction. If the hold already expired (slow checkout)
   * but a seat is still open, claim one atomically instead. If neither is possible the caller
   * (post-payment handler) surfaces a ReservationFailedEvent so the customer can be refunded.
   */
  async confirmHold(scheduleId: string, createRegistrationDto: CreateRegistrationDto): Promise<Schedule> {
    const schedule = await this.model.findById(new Types.ObjectId(scheduleId))
    if (!schedule) {
      throw new NotFoundException('Schedule not found')
    }

    const student = await this.studentService.findOne(createRegistrationDto.studentId)
    if (!student || student.userId.toString() !== createRegistrationDto.userId) {
      throw new NotFoundException('Student not found')
    }

    const userObjectId = new Types.ObjectId(createRegistrationDto.userId)
    const studentObjectId = new Types.ObjectId(createRegistrationDto.studentId)
    const now = new Date()

    // The purchase already booked +N credits; record the -1 Register debit to keep the
    // ledger balanced, exactly as the direct-registration path does.
    const transaction = await this.transactionService.create({
      userId: createRegistrationDto.userId,
      credits: -1,
      creditType: schedule.lessonType == LessonTypesEnum.PRIVATE ? CreditTypesEnum.PRIVATE : CreditTypesEnum.GROUP,
      transactionType: TransactionTypesEnum.Register,
      scheduleId,
      studentId: createRegistrationDto.studentId,
    })

    // Confirm the existing unexpired hold for this user+student in place.
    const confirmed = await this.model.findOneAndUpdate(
      {
        _id: new Types.ObjectId(scheduleId),
        registrations: {
          $elemMatch: {
            userId: userObjectId,
            studentId: studentObjectId,
            status: RegistrationStatusEnum.HELD,
            heldUntil: { $gt: now },
          },
        },
      },
      {
        $set: {
          'registrations.$.status': RegistrationStatusEnum.CONFIRMED,
          'registrations.$.transactionId': transaction.id,
        },
        $unset: { 'registrations.$.heldUntil': '' },
      },
      { new: true },
    )

    let entity = confirmed

    if (!entity) {
      // Hold expired before payment cleared. Reclaim a seat atomically if one is still free.
      entity = await this.model.findOneAndUpdate(
        {
          _id: new Types.ObjectId(scheduleId),
          $expr: hasAvailableSeatExpr,
        },
        {
          $push: {
            registrations: {
              userId: userObjectId,
              studentId: studentObjectId,
              createdAt: now,
              status: RegistrationStatusEnum.CONFIRMED,
              transactionId: new Types.ObjectId(transaction.id),
            },
          },
        },
        { new: true },
      )
    }

    if (!entity) {
      // Seat is gone and the class is full — undo the debit and signal the caller to refund.
      await this.transactionService.create({
        userId: createRegistrationDto.userId,
        credits: 1,
        creditType: schedule.lessonType == LessonTypesEnum.PRIVATE ? CreditTypesEnum.PRIVATE : CreditTypesEnum.GROUP,
        transactionType: TransactionTypesEnum.CancelRegistration,
        scheduleId,
        studentId: createRegistrationDto.studentId,
      })
      throw new BadRequestException('Class is full')
    }

    this.eventBus.publish(new RegistrationCreatedEvent(createRegistrationDto.userId, scheduleId, student.id))
    return mapper(entity)
  }

  async findAll(scheduleId: string): Promise<Registration[]> {
    const schedule = await this.model.findById(new Types.ObjectId(scheduleId))
    if (!schedule) {
      throw new NotFoundException('Schedule not found')
    }
    return schedule.registrations.map(registration => ({
      userId: registration.userId.toString(),
      studentId: registration.studentId.toString(),
      createdAt: registration.createdAt,
      transactionId: registration.transactionId?.toString(),
      status: registration.status ?? RegistrationStatusEnum.CONFIRMED,
      heldUntil: registration.heldUntil,
    }))
  }

  async remove(scheduleId: string, studentId: string, allowWithin24Hours = false): Promise<void> {
    const schedule = await this.model.findById(new Types.ObjectId(scheduleId))
    if (!schedule) {
      throw new NotFoundException('Schedule not found')
    }

    const registrationIndex = schedule.registrations.findIndex(
      registration => registration.studentId.toString() === studentId,
    )
    if (registrationIndex === -1) {
      throw new NotFoundException('Registration not found')
    }

    // If the registration is within 24 hours, do not cancel
    const startDateTime = new Date(schedule.startDateTime)
    const now = new Date()
    const diffInHours = differenceInHours(startDateTime, now)
    if (!allowWithin24Hours && diffInHours < 24) {
      throw new BadRequestException('Registration is within 24 hours')
    }
    const userId = schedule.registrations[registrationIndex].userId.toString()

    schedule.registrations.splice(registrationIndex, 1)

    await this.model.updateOne(
      { _id: new Types.ObjectId(scheduleId) },
      {
        $set: {
          registrations: schedule.registrations,
        },
      },
    )

    // Create the counter transaction
    await this.transactionService.create({
      userId,
      credits: 1,
      creditType: schedule.lessonType == LessonTypesEnum.PRIVATE ? CreditTypesEnum.PRIVATE : CreditTypesEnum.GROUP,
      transactionType: TransactionTypesEnum.CancelRegistration,
      scheduleId,
      studentId,
    })

    this.eventBus.publish(new RegistrationCanceledEvent(userId, scheduleId, studentId))
  }
}
