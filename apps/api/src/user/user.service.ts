import { Injectable, NotFoundException, ConflictException } from '@nestjs/common'
import { CreateUserDto } from './dto/create-user.dto'
import { UpdateUserDto } from './dto/update-user.dto'
import { InjectModel } from '@nestjs/mongoose'
import { UserEntity } from './entities/user.entity'
import { Model, Types } from 'mongoose'
import { User } from './user'
import { SignUpDto } from '../iam/authentication/dto/sign-up.dto'
import { UserForAuth } from './user-for-auth'
import { EventBus } from '@nestjs/cqrs'
import { UserRegisterEvent } from './events/user-register.event'
import { EmailVerificationRequestedEvent } from './events/email-verification-requested.event'
import { Role } from '@lesson-scheduler/shared'
import { TransactionService } from 'payment/transaction.service'
import { sameInboxQuery } from './same-inbox'
const mapper = (entity: UserEntity): User => {
  return {
    id: entity._id.toString(),
    email: entity.email,
    // A missing flag means the account predates verification, so treat it as verified.
    emailVerified: entity.emailVerified !== false,
    pendingEmail: entity.pendingEmail || null,
    firstName: entity.firstName,
    lastName: entity.lastName,
    address1: entity.address1 || '',
    address2: entity.address2 || '',
    city: entity.city || '',
    state: entity.state || '',
    zip: entity.zip || '',
    phone: entity.phone || '',
    privateRegistration: entity.privateRegistration || false,
    role: entity.role,
    failedLoginAttempts: entity.failedLoginAttempts || 0,
    lastFailedLogin: entity.lastFailedLogin || null,
    signedWaiver: entity.signedWaiver || false,
    waiverSignature: entity.waiverSignature || null,
    waiverSignatureDate: entity.waiverSignatureDate || null,
    instructorId: entity.instructorId || null,
  }
}
@Injectable()
export class UserService {
  constructor(
    @InjectModel(UserEntity.name)
    private readonly model: Model<UserEntity>,
    private readonly eventBus: EventBus,
    private readonly transactionService: TransactionService,
  ) {}
  async create(createUserDto: CreateUserDto): Promise<User> {
    const _id = new Types.ObjectId()
    await this.model.create({
      _id,
      email: createUserDto.email,
      password: createUserDto.password,
      firstName: createUserDto.firstName,
      lastName: createUserDto.lastName,
      address1: createUserDto.address1,
      address2: createUserDto.address2,
      city: createUserDto.city,
      state: createUserDto.state,
      zip: createUserDto.zip,
      phone: createUserDto.phone.replace(/\D/g, ''),
      privateRegistration: createUserDto.privateRegistration,
    })
    const entity = await this.model.findById(_id)
    if (!entity) {
      throw new Error('User not found')
    }
    return mapper(entity)
  }
  async signUp(signUpDto: SignUpDto, hashedPassword: string, salt: string): Promise<User> {
    const _id = new Types.ObjectId()

    const existingUser = await this.model.findOne(sameInboxQuery(signUpDto.email))
    if (existingUser) {
      throw new ConflictException('User already exists')
    }

    await this.model.create({
      _id,
      email: signUpDto.email.toLowerCase(),
      password: hashedPassword,
      firstName: signUpDto.firstName.trim(),
      lastName: signUpDto.lastName.trim(),
      phone: signUpDto.phoneNumber.trim(),
      salt,
      failedLoginAttempts: 0,
      lastFailedLogin: null,
      emailVerified: false,
      verificationEmailSentAt: new Date(),
    })
    const entity = await this.model.findById(_id)
    if (!entity) {
      throw new Error('User not found')
    }
    const user = mapper(entity)
    // The welcome email waits until the address is confirmed (see confirmEmailVerification), so a
    // sign-up made with a stranger's address sends them one message instead of two.
    await this.eventBus.publish(new EmailVerificationRequestedEvent(user, user.email))
    return user
  }

  async findAll(
    page = 1,
    limit = 1000,
    search?: string,
    phone?: string,
    sortBy?: string,
  ): Promise<{ users: User[]; total: number }> {
    const skip = (page - 1) * limit
    const match: any = {}
    if (search) {
      match.$or = [{ firstName: { $regex: search, $options: 'i' } }, { lastName: { $regex: search, $options: 'i' } }]
    }
    if (phone) {
      match.phone = { $regex: phone, $options: 'i' }
    }

    // Build the aggregation pipeline
    const pipeline: any[] = [
      { $match: match },
      {
        $lookup: {
          from: 'transactions',
          let: { userId: '$_id' },
          pipeline: [
            { $match: { $expr: { $and: [{ $eq: ['$userId', '$$userId'] }, { $eq: ['$creditType', 'private'] }] } } },
            { $group: { _id: null, balance: { $sum: '$credits' } } },
          ],
          as: 'unusedCreditsAgg',
        },
      },
      {
        $addFields: {
          unusedCredits: { $ifNull: [{ $arrayElemAt: ['$unusedCreditsAgg.balance', 0] }, 0] },
        },
      },
      { $project: { unusedCreditsAgg: 0 } },
    ]

    // Sorting
    if (sortBy === 'name') {
      pipeline.push({ $addFields: { fullName: { $concat: ['$firstName', ' ', '$lastName'] } } })
      pipeline.push({ $sort: { fullName: 1 } })
    } else if (sortBy === 'email') {
      pipeline.push({ $sort: { email: 1 } })
    } else if (sortBy === 'unusedCredits') {
      pipeline.push({ $sort: { unusedCredits: -1 } })
    }

    // Pagination
    pipeline.push({ $skip: skip })
    pipeline.push({ $limit: limit })

    // Get total count (without pagination)
    const countPipeline = [...pipeline]
    countPipeline.splice(
      countPipeline.findIndex(stage => Object.keys(stage)[0] === '$skip'),
      2,
    ) // remove $skip and $limit
    countPipeline.push({ $count: 'total' })

    // Run both pipelines
    const [users, totalResult] = await Promise.all([
      this.model.aggregate(pipeline),
      this.model.aggregate(countPipeline),
    ])
    const total = totalResult[0]?.total ?? 0

    // Map to User type
    const mappedUsers = users.map(user => ({
      ...mapper(user),
      unusedCredits: user.unusedCredits || 0,
    }))

    return {
      users: mappedUsers,
      total,
    }
  }

  async findOne(id: string): Promise<User> {
    const entity = await this.model.findById(new Types.ObjectId(id))
    if (!entity) {
      throw new NotFoundException()
    }
    return mapper(entity)
  }

  async findOneForAuth(email: string): Promise<UserForAuth | null> {
    const entity = await this.model.findOne(
      { email: email.toLowerCase() },
      {
        _id: 1,
        email: 1,
        password: 1,
        salt: 1,
        firstName: 1,
        lastName: 1,
        role: 1,
        failedLoginAttempts: 1,
        lastFailedLogin: 1,
        resetToken: 1,
      },
    )
    if (!entity) {
      return null
    }
    const user = mapper(entity)

    return {
      ...user,
      password: entity.password || null,
      resetToken: entity.resetToken || null,
      salt: entity.salt,
    }
  }

  async update(
    userId: string,
    updateUserDto: UpdateUserDto,
    options: { requireEmailConfirmation?: boolean } = {},
  ): Promise<User> {
    const update: Partial<UserEntity> = {}
    const unset: Record<string, ''> = {}
    let addressToVerify: string | null = null
    if (updateUserDto.email) {
      // Sign-in looks the address up lowercased, so storing a different casing here
      // locks the account out.
      const email = updateUserDto.email.trim().toLowerCase()
      const existingUser = await this.model.findOne({ email, _id: { $ne: new Types.ObjectId(userId) } })
      if (existingUser) {
        throw new ConflictException('Email already in use')
      }
      const current = await this.model.findById(new Types.ObjectId(userId))
      if (!current) {
        throw new NotFoundException('User not found')
      }
      if (email !== current.email) {
        if (options.requireEmailConfirmation) {
          // Stage the address instead of moving the live one. A mistyped address never
          // receives its link, so the account keeps working on the address that does.
          update.pendingEmail = email
          addressToVerify = email
        } else {
          // Admin repair path. Someone whose address is already wrong cannot receive a
          // confirmation at it, so this applies immediately.
          update.email = email
          update.emailVerified = true
          unset['pendingEmail'] = ''
          unset['emailVerificationToken'] = ''
        }
      }
    }
    if (updateUserDto.firstName) {
      update.firstName = updateUserDto.firstName.trim()
    }
    if (updateUserDto.lastName) {
      update.lastName = updateUserDto.lastName.trim()
    }
    if (updateUserDto.address1) {
      update.address1 = updateUserDto.address1.trim()
    }
    if (updateUserDto.address2) {
      update.address2 = updateUserDto.address2.trim()
    }
    if (updateUserDto.city) {
      update.city = updateUserDto.city.trim()
    }
    if (updateUserDto.state) {
      update.state = updateUserDto.state.trim()
    }
    if (updateUserDto.zip) {
      update.zip = updateUserDto.zip.trim()
    }
    if (updateUserDto.phone) {
      update.phone = updateUserDto.phone.trim()
    }
    if (updateUserDto.privateRegistration) {
      update.privateRegistration = updateUserDto.privateRegistration
    }
    if (updateUserDto.instructorId) {
      update.instructorId = updateUserDto.instructorId
    }
    if (updateUserDto.role) {
      update.role = updateUserDto.role

      if (updateUserDto.role === Role.User) {
        await this.model.updateOne(
          { _id: new Types.ObjectId(userId) },
          {
            $unset: { instructorId: '' },
          },
        )
      }
    }
    const write: Record<string, unknown> = { $set: update }
    if (Object.keys(unset).length > 0) {
      write['$unset'] = unset
    }
    await this.model.updateOne({ _id: new Types.ObjectId(userId) }, write)
    const entity = await this.model.findById(new Types.ObjectId(userId))
    if (!entity) {
      throw new Error('User not found')
    }
    const user = mapper(entity)
    if (addressToVerify) {
      await this.eventBus.publish(new EmailVerificationRequestedEvent(user, addressToVerify))
    }
    return user
  }

  /** Stores the signed link token so a confirmation can only be redeemed once. */
  async updateEmailVerificationToken(userId: string, token: string): Promise<void> {
    await this.model.updateOne({ _id: new Types.ObjectId(userId) }, { $set: { emailVerificationToken: token } })
  }

  /**
   * Redeems a confirmation link. Promotes a staged address to the live one when the user was
   * confirming a change, and marks the account verified either way.
   */
  async confirmEmailVerification(token: string): Promise<User> {
    const entity = await this.model.findOne({ emailVerificationToken: token })
    if (!entity) {
      throw new NotFoundException('Invalid or expired verification token')
    }

    const update: Partial<UserEntity> = { emailVerified: true }
    if (entity.pendingEmail) {
      // Re-check at redemption time. The address could have been claimed by someone else
      // between the request and the click.
      const existingUser = await this.model.findOne({
        email: entity.pendingEmail,
        _id: { $ne: entity._id },
      })
      if (existingUser) {
        throw new ConflictException('Email already in use')
      }
      update.email = entity.pendingEmail
    }

    await this.model.updateOne(
      { _id: entity._id },
      { $set: update, $unset: { pendingEmail: '', emailVerificationToken: '' } },
    )

    const updated = await this.model.findById(entity._id)
    if (!updated) {
      throw new NotFoundException('User not found')
    }
    const user = mapper(updated)
    // Only a sign-up confirming for the first time gets the welcome. Grandfathered accounts have no
    // flag, and a verified user confirming a changed address already got theirs.
    if (entity.emailVerified === false) {
      await this.eventBus.publish(new UserRegisterEvent(user))
    }
    return user
  }

  async remove(id: string): Promise<void> {
    this.model.deleteOne({ _id: new Types.ObjectId(id) })
  }

  async findOneByGoogleId({ googleId }: { googleId: string }) {
    const entity = await this.model.findOne({ googleId })
    return entity && mapper(entity)
  }

  async addGoogleId(
    email: string,
    googleId: string,
    given_name: string | undefined,
    family_name: string | undefined,
  ): Promise<User> {
    await this.model.updateOne(
      { email },
      {
        $set: {
          googleId,
          // Signing in through Google proves the address, so linking clears any pending
          // verification on an older password account.
          emailVerified: true,
        },
        $unset: { pendingEmail: '', emailVerificationToken: '' },
      },
    )
    const entity = await this.model.findOne({ email })
    if (!entity) {
      throw new Error('User not found')
    }
    const user = mapper(entity)
    await this.eventBus.publish(new UserRegisterEvent(user))
    return user
  }
  async saveGoogleId(
    email: string,
    googleId: string,
    given_name: string | undefined,
    family_name: string | undefined,
  ): Promise<User> {
    const _id = new Types.ObjectId()
    await this.model.create({
      _id,
      email,
      googleId,
      firstName: given_name,
      lastName: family_name,
      // Google already proved the address belongs to them, so there is nothing to confirm.
      emailVerified: true,
    })
    const entity = await this.model.findById(_id)
    if (!entity) {
      throw new Error('User not found')
    }
    const user = mapper(entity)
    await this.eventBus.publish(new UserRegisterEvent(user))
    return user
  }

  async updateWaiver(
    userId: string,
    signedWaiver: boolean,
    waiverSignature: string,
    waiverSignatureDate: Date,
  ): Promise<User> {
    await this.model.updateOne(
      { _id: new Types.ObjectId(userId) },
      {
        $set: {
          signedWaiver,
          waiverSignature,
          waiverSignatureDate,
        },
      },
    )
    return this.findOne(userId)
  }

  public async updateResetToken(user: UserForAuth, token: string) {
    return await this.model.updateOne(
      { _id: new Types.ObjectId(user.id) },
      {
        $set: {
          resetToken: token,
        },
      },
    )
  }

  /**
   * Stamps the reset-request time unless a link already went out within `cooldownMs`. Returns
   * false inside the cooldown. The check and the stamp are one atomic update, so a burst of
   * simultaneous requests sends one email, not one per request.
   */
  public async claimPasswordResetSlot(userId: string, cooldownMs: number): Promise<boolean> {
    return this.claimCooldown(userId, 'resetRequestedAt', cooldownMs)
  }

  /** Same as claimPasswordResetSlot, for resending the confirm-your-address link. */
  public async claimVerificationEmailSlot(userId: string, cooldownMs: number): Promise<boolean> {
    return this.claimCooldown(userId, 'verificationEmailSentAt', cooldownMs)
  }

  private async claimCooldown(
    userId: string,
    field: 'resetRequestedAt' | 'verificationEmailSentAt',
    cooldownMs: number,
  ): Promise<boolean> {
    const now = new Date()
    const result = await this.model.updateOne(
      {
        _id: new Types.ObjectId(userId),
        $or: [{ [field]: { $exists: false } }, { [field]: null }, { [field]: { $lt: new Date(now.getTime() - cooldownMs) } }],
      },
      { $set: { [field]: now } },
    )
    return result.modifiedCount === 1
  }

  public async updatePassword(user: UserForAuth, password: string, salt: string) {
    await this.model.updateOne(
      { _id: new Types.ObjectId(user.id) },
      {
        $set: {
          password,
          salt,
          resetToken: null,
          failedLoginAttempts: 0,
          lastFailedLogin: null,
        },
      },
    )
  }

  async incrementFailedAttempts(userId: string): Promise<void> {
    await this.model.updateOne(
      { _id: new Types.ObjectId(userId) },
      {
        $inc: { failedLoginAttempts: 1 },
        $set: { lastFailedLogin: new Date() },
      },
    )
  }

  async resetLoginAttempts(userId: string): Promise<void> {
    await this.model.updateOne(
      { _id: new Types.ObjectId(userId) },
      {
        $set: {
          failedLoginAttempts: 0,
          lastFailedLogin: null,
        },
      },
    )
  }

  async findMany(ids: string[]): Promise<User[]> {
    const entities = await this.model.find({ _id: { $in: ids.map(id => new Types.ObjectId(id)) } })
    return entities.map(mapper)
  }

  async countActiveUsers(range?: { from?: Date; to?: Date }): Promise<number> {
    const filter: any = { role: Role.User }
    if (range?.from || range?.to) {
      filter.createdAt = {}
      if (range.from) filter.createdAt.$gte = range.from
      if (range.to) filter.createdAt.$lt = range.to
    }
    return await this.model.countDocuments(filter)
  }
}
