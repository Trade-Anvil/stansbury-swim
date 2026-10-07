import { AuthenticationService } from './authentication.service'

const USER_ID = '507f1f77bcf86cd799439021'

describe('AuthenticationService email links', () => {
  let service: AuthenticationService
  let userService: Record<string, jest.Mock>
  let emailService: Record<string, jest.Mock>

  beforeEach(() => {
    userService = {
      findOneForAuth: jest.fn().mockResolvedValue({ id: USER_ID, email: 'parent@example.com' }),
      findOne: jest.fn().mockResolvedValue({ id: USER_ID, email: 'parent@example.com', emailVerified: false, pendingEmail: null }),
      claimPasswordResetSlot: jest.fn().mockResolvedValue(true),
      claimVerificationEmailSlot: jest.fn().mockResolvedValue(true),
    }
    emailService = {
      sendResetPasswordLink: jest.fn().mockResolvedValue(undefined),
      sendVerifyEmailLink: jest.fn().mockResolvedValue(undefined),
    }
    service = new AuthenticationService(userService as any, {} as any, {} as any, emailService as any)
  })

  describe('forgotPassword', () => {
    it('sends a reset link when the cooldown allows it', async () => {
      await service.forgotPassword('parent@example.com')

      expect(userService.claimPasswordResetSlot).toHaveBeenCalledWith(USER_ID, expect.any(Number))
      expect(emailService.sendResetPasswordLink).toHaveBeenCalledTimes(1)
    })

    it('sends nothing, and still resolves, inside the cooldown', async () => {
      userService.claimPasswordResetSlot.mockResolvedValue(false)

      await expect(service.forgotPassword('parent@example.com')).resolves.toBeUndefined()
      expect(emailService.sendResetPasswordLink).not.toHaveBeenCalled()
    })

    it('does not touch the cooldown for an unknown address', async () => {
      userService.findOneForAuth.mockResolvedValue(null)

      await service.forgotPassword('nobody@example.com')

      expect(userService.claimPasswordResetSlot).not.toHaveBeenCalled()
      expect(emailService.sendResetPasswordLink).not.toHaveBeenCalled()
    })
  })

  describe('resendVerification', () => {
    it('resends when the cooldown allows it', async () => {
      await service.resendVerification(USER_ID)

      expect(emailService.sendVerifyEmailLink).toHaveBeenCalledTimes(1)
    })

    it('skips the send without an error inside the cooldown', async () => {
      userService.claimVerificationEmailSlot.mockResolvedValue(false)

      await expect(service.resendVerification(USER_ID)).resolves.toBeUndefined()
      expect(emailService.sendVerifyEmailLink).not.toHaveBeenCalled()
    })
  })
})
