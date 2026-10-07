import { ConflictException, NotFoundException } from '@nestjs/common'
import { EventBus } from '@nestjs/cqrs'
import { UserService } from './user.service'
import { EmailVerificationRequestedEvent } from './events/email-verification-requested.event'
import { UserRegisterEvent } from './events/user-register.event'

// Valid 24-char hex so `new Types.ObjectId(...)` doesn't throw.
const USER_ID = '507f1f77bcf86cd799439021'
const OTHER_USER_ID = '507f1f77bcf86cd799439022'

const OLD_EMAIL = 'old@example.com'
const NEW_EMAIL = 'new@example.com'

const userEntity = (overrides: Record<string, unknown> = {}) => ({
  _id: USER_ID,
  email: OLD_EMAIL,
  firstName: 'Test',
  lastName: 'User',
  role: 'user',
  ...overrides,
})

describe('UserService email verification', () => {
  let service: UserService
  let model: { findOne: jest.Mock; findById: jest.Mock; updateOne: jest.Mock; create: jest.Mock }
  let eventBus: { publish: jest.Mock }
  let transactionService: Record<string, jest.Mock>

  beforeEach(() => {
    model = {
      findOne: jest.fn().mockResolvedValue(null),
      findById: jest.fn().mockResolvedValue(userEntity()),
      updateOne: jest.fn().mockResolvedValue({}),
      create: jest.fn(),
    }
    eventBus = { publish: jest.fn() }
    transactionService = {}

    service = new UserService(model as any, eventBus as unknown as EventBus, transactionService as any)
  })

  const lastUpdateWrite = () => model.updateOne.mock.calls[model.updateOne.mock.calls.length - 1][1]

  describe('update, self-service path', () => {
    it('stages a new address in pendingEmail and leaves the live address alone', async () => {
      model.findById
        .mockResolvedValueOnce(userEntity()) // current record, read to compare addresses
        .mockResolvedValueOnce(userEntity({ pendingEmail: NEW_EMAIL })) // reload after write

      await service.update(USER_ID, { email: NEW_EMAIL } as any, { requireEmailConfirmation: true })

      const write = lastUpdateWrite()
      expect(write.$set.pendingEmail).toBe(NEW_EMAIL)
      expect(write.$set).not.toHaveProperty('email')
      expect(write.$set).not.toHaveProperty('emailVerified')
    })

    it('sends the confirmation to the new address, not the address on file', async () => {
      model.findById
        .mockResolvedValueOnce(userEntity())
        .mockResolvedValueOnce(userEntity({ pendingEmail: NEW_EMAIL }))

      await service.update(USER_ID, { email: NEW_EMAIL } as any, { requireEmailConfirmation: true })

      expect(eventBus.publish).toHaveBeenCalledTimes(1)
      const event = eventBus.publish.mock.calls[0][0] as EmailVerificationRequestedEvent
      expect(event).toBeInstanceOf(EmailVerificationRequestedEvent)
      expect(event.address).toBe(NEW_EMAIL)
      expect(event.user.email).toBe(OLD_EMAIL)
    })

    it('normalizes case before comparing, so a case-only edit is not a change', async () => {
      model.findById.mockResolvedValue(userEntity())

      await service.update(USER_ID, { email: 'OLD@Example.com' } as any, { requireEmailConfirmation: true })

      const write = lastUpdateWrite()
      expect(write.$set).not.toHaveProperty('email')
      expect(write.$set).not.toHaveProperty('pendingEmail')
      expect(eventBus.publish).not.toHaveBeenCalled()
    })

    it('stores the address lowercased and trimmed', async () => {
      model.findById.mockResolvedValue(userEntity())

      await service.update(USER_ID, { email: '  NEW@Example.COM  ' } as any, { requireEmailConfirmation: true })

      expect(lastUpdateWrite().$set.pendingEmail).toBe(NEW_EMAIL)
    })
  })

  describe('update, admin path', () => {
    it('applies the address immediately and clears any pending change', async () => {
      model.findById.mockResolvedValue(userEntity({ pendingEmail: 'stale@example.com' }))

      await service.update(USER_ID, { email: NEW_EMAIL } as any)

      const write = lastUpdateWrite()
      expect(write.$set.email).toBe(NEW_EMAIL)
      expect(write.$set.emailVerified).toBe(true)
      expect(write.$unset).toEqual({ pendingEmail: '', emailVerificationToken: '' })
      expect(eventBus.publish).not.toHaveBeenCalled()
    })
  })

  describe('update, duplicate addresses', () => {
    it('rejects an address already used by another account and writes nothing', async () => {
      model.findOne.mockResolvedValue(userEntity({ _id: OTHER_USER_ID, email: NEW_EMAIL }))

      await expect(service.update(USER_ID, { email: NEW_EMAIL } as any)).rejects.toThrow(ConflictException)
      expect(model.updateOne).not.toHaveBeenCalled()
    })

    it('excludes the account being edited from the duplicate check', async () => {
      model.findById.mockResolvedValue(userEntity())

      await service.update(USER_ID, { email: NEW_EMAIL } as any)

      expect(model.findOne).toHaveBeenCalledWith(expect.objectContaining({ _id: { $ne: expect.anything() } }))
    })
  })

  describe('confirmEmailVerification', () => {
    it('promotes the staged address and burns the token', async () => {
      model.findOne
        .mockResolvedValueOnce(userEntity({ pendingEmail: NEW_EMAIL, emailVerificationToken: 'tok' })) // by token
        .mockResolvedValueOnce(null) // nobody else claimed the address
      model.findById.mockResolvedValue(userEntity({ email: NEW_EMAIL, emailVerified: true }))

      const result = await service.confirmEmailVerification('tok')

      const write = lastUpdateWrite()
      expect(write.$set).toEqual({ emailVerified: true, email: NEW_EMAIL })
      expect(write.$unset).toEqual({ pendingEmail: '', emailVerificationToken: '' })
      expect(result.email).toBe(NEW_EMAIL)
    })

    it('marks a sign-up verified without touching the address when nothing is staged', async () => {
      model.findOne.mockResolvedValueOnce(userEntity({ emailVerificationToken: 'tok', emailVerified: false }))
      model.findById.mockResolvedValue(userEntity({ emailVerified: true }))

      await service.confirmEmailVerification('tok')

      const write = lastUpdateWrite()
      expect(write.$set).toEqual({ emailVerified: true })
      expect(write.$set).not.toHaveProperty('email')
    })

    it('sends the welcome email when a sign-up confirms for the first time', async () => {
      model.findOne.mockResolvedValueOnce(userEntity({ emailVerificationToken: 'tok', emailVerified: false }))
      model.findById.mockResolvedValue(userEntity({ emailVerified: true }))

      await service.confirmEmailVerification('tok')

      expect(eventBus.publish).toHaveBeenCalledTimes(1)
      expect(eventBus.publish.mock.calls[0][0]).toBeInstanceOf(UserRegisterEvent)
    })

    it('does not re-send the welcome when a verified user confirms a changed address', async () => {
      model.findOne
        .mockResolvedValueOnce(userEntity({ pendingEmail: NEW_EMAIL, emailVerificationToken: 'tok', emailVerified: true }))
        .mockResolvedValueOnce(null)
      model.findById.mockResolvedValue(userEntity({ email: NEW_EMAIL, emailVerified: true }))

      await service.confirmEmailVerification('tok')

      expect(eventBus.publish).not.toHaveBeenCalled()
    })

    it('rejects an unknown or already-redeemed token', async () => {
      model.findOne.mockResolvedValue(null)

      await expect(service.confirmEmailVerification('tok')).rejects.toThrow(NotFoundException)
      expect(model.updateOne).not.toHaveBeenCalled()
    })

    it('rejects when the staged address was claimed between request and click', async () => {
      model.findOne
        .mockResolvedValueOnce(userEntity({ pendingEmail: NEW_EMAIL, emailVerificationToken: 'tok' }))
        .mockResolvedValueOnce(userEntity({ _id: OTHER_USER_ID, email: NEW_EMAIL }))

      await expect(service.confirmEmailVerification('tok')).rejects.toThrow(ConflictException)
      expect(model.updateOne).not.toHaveBeenCalled()
    })
  })

  describe('signUp', () => {
    const signUpDto = {
      email: 'j.a.ne.doe@gmail.com',
      password: 'irrelevant',
      firstName: 'Jane',
      lastName: 'Doe',
      phoneNumber: '5555555555',
    }

    it('sends only the confirmation email, holding the welcome until the address is confirmed', async () => {
      model.findById.mockResolvedValue(userEntity({ email: signUpDto.email, emailVerified: false }))

      await service.signUp(signUpDto as any, 'hash', 'salt')

      expect(eventBus.publish).toHaveBeenCalledTimes(1)
      expect(eventBus.publish.mock.calls[0][0]).toBeInstanceOf(EmailVerificationRequestedEvent)
      expect(model.create.mock.calls[0][0].verificationEmailSentAt).toBeInstanceOf(Date)
    })

    it('rejects a dotted variant of a Gmail address that is already registered', async () => {
      model.findOne.mockResolvedValue(userEntity({ email: 'janedoe@gmail.com' }))

      await expect(service.signUp(signUpDto as any, 'hash', 'salt')).rejects.toThrow(ConflictException)

      const filter = model.findOne.mock.calls[0][0]
      expect(new RegExp(filter.email.$regex, filter.email.$options).test('janedoe@gmail.com')).toBe(true)
      expect(model.create).not.toHaveBeenCalled()
    })
  })

  describe('email cooldowns', () => {
    it('grants the slot when the atomic update matched', async () => {
      model.updateOne.mockResolvedValue({ modifiedCount: 1 })

      await expect(service.claimPasswordResetSlot(USER_ID, 60_000)).resolves.toBe(true)

      const [filter, update] = model.updateOne.mock.calls[0]
      expect(filter.$or).toEqual(
        expect.arrayContaining([{ resetRequestedAt: { $lt: expect.any(Date) } }]),
      )
      expect(update.$set.resetRequestedAt).toBeInstanceOf(Date)
    })

    it('refuses the slot inside the cooldown', async () => {
      model.updateOne.mockResolvedValue({ modifiedCount: 0 })

      await expect(service.claimVerificationEmailSlot(USER_ID, 60_000)).resolves.toBe(false)
      expect(model.updateOne.mock.calls[0][1].$set).toHaveProperty('verificationEmailSentAt')
    })
  })

  describe('grandfathering', () => {
    it('reports an account with no flag as verified', async () => {
      model.findById.mockResolvedValue(userEntity())

      const user = await service.findOne(USER_ID)

      expect(user.emailVerified).toBe(true)
    })

    it('reports a new sign-up as unverified', async () => {
      model.findById.mockResolvedValue(userEntity({ emailVerified: false }))

      const user = await service.findOne(USER_ID)

      expect(user.emailVerified).toBe(false)
    })
  })
})
