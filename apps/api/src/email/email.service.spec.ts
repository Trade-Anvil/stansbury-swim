const send = jest.fn()
jest.mock('resend', () => ({
  Resend: jest.fn().mockImplementation(() => ({ emails: { send } })),
}))

import { EmailService } from './email.service'

const HOSTILE_NAME = '<a href="https://evil.example">Claim your refund</a>'

const user = (overrides: Record<string, unknown> = {}) =>
  ({
    id: '507f1f77bcf86cd799439021',
    email: 'parent@example.com',
    firstName: HOSTILE_NAME,
    lastName: 'Doe',
    ...overrides,
  }) as any

describe('EmailService', () => {
  let service: EmailService

  beforeEach(() => {
    send.mockReset().mockResolvedValue({ data: { id: 'msg' }, error: null })
    const jwtService = { sign: jest.fn().mockReturnValue('token') }
    const configService = { get: jest.fn().mockReturnValue('value') }
    const userService = {
      findOneForAuth: jest.fn().mockResolvedValue(user()),
      updateResetToken: jest.fn(),
      updateEmailVerificationToken: jest.fn(),
    }
    const logger = { log: jest.fn(), error: jest.fn() }
    service = new EmailService(
      jwtService as any,
      configService as any,
      userService as any,
      logger as any,
      {} as any,
      {} as any,
    )
  })

  const lastSent = () => send.mock.calls[send.mock.calls.length - 1][0]

  it('does not copy the office inbox on password reset links', async () => {
    await service.sendResetPasswordLink('parent@example.com')

    expect(lastSent()).not.toHaveProperty('bcc')
  })

  it('does not copy the office inbox on confirmation links, and leaves the name out', async () => {
    await service.sendVerifyEmailLink(user(), 'parent@example.com')

    const message = lastSent()
    expect(message).not.toHaveProperty('bcc')
    expect(message.html).not.toContain('evil.example')
    expect(message.html).toContain('Hi,')
  })

  it('still copies the office inbox on ordinary mail', async () => {
    await service.sendWelcomeEmail(user())

    expect(lastSent().bcc).toBe('info@stansburyswim.com')
  })

  it('escapes names typed at sign-up before putting them in HTML', async () => {
    await service.sendWaitlistAllowedEmail(user())

    const { html } = lastSent()
    expect(html).not.toContain(HOSTILE_NAME)
    expect(html).toContain('&lt;a href=&quot;https://evil.example&quot;&gt;')
  })
})
