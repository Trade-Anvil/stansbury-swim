import { INestApplication, ValidationPipe } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { Test } from '@nestjs/testing'
import { AuthenticationController } from './authentication.controller'
import { AuthenticationService } from './authentication.service'
import { TurnstileService } from './turnstile.service'
import { resetRateLimits } from './guards/rate-limit.guard'

// Boots the real controller over HTTP with the same ValidationPipe settings as main.ts, so the
// guard wiring, DTO whitelisting and status codes are exercised the way production sees them.
describe('AuthenticationController abuse protections (HTTP)', () => {
  let app: INestApplication
  let baseUrl: string
  const authService = { forgotPassword: jest.fn().mockResolvedValue(undefined) }
  const turnstileService = { assertHuman: jest.fn().mockResolvedValue(undefined) }

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      controllers: [AuthenticationController],
      providers: [
        { provide: AuthenticationService, useValue: authService },
        { provide: ConfigService, useValue: { get: jest.fn() } },
        { provide: TurnstileService, useValue: turnstileService },
      ],
    }).compile()

    app = moduleRef.createNestApplication()
    app.useGlobalPipes(new ValidationPipe({ transform: true, whitelist: true, forbidNonWhitelisted: false }))
    await app.listen(0)
    baseUrl = await app.getUrl()
  })

  afterAll(async () => {
    await app.close()
  })

  beforeEach(() => {
    resetRateLimits()
    jest.clearAllMocks()
  })

  const forgot = (ip: string, body: Record<string, unknown> = { email: 'parent@example.com' }) =>
    fetch(`${baseUrl.replace('[::1]', 'localhost')}/auth/forgot-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-Real-IP': ip },
      body: JSON.stringify(body),
    })

  it('passes the Turnstile token and visitor IP through validation to the check', async () => {
    const response = await forgot('203.0.113.7', { email: 'parent@example.com', turnstileToken: 'tok' })

    expect(response.status).toBe(201)
    expect(turnstileService.assertHuman).toHaveBeenCalledWith('tok', '203.0.113.7')
    expect(authService.forgotPassword).toHaveBeenCalledWith('parent@example.com')
  })

  it('answers 429 after five forgot-password requests from one IP, without sending more', async () => {
    for (let i = 0; i < 5; i++) {
      expect((await forgot('203.0.113.8')).status).toBe(201)
    }

    const blocked = await forgot('203.0.113.8')

    expect(blocked.status).toBe(429)
    expect(authService.forgotPassword).toHaveBeenCalledTimes(5)
    expect((await forgot('198.51.100.1')).status).toBe(201)
  })
})
