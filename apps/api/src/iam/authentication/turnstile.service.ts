import { BadRequestException, Injectable, Logger, ServiceUnavailableException } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { ConfigEnum } from '../../shared/config.enum'

// https://developers.cloudflare.com/turnstile/get-started/server-side-validation/
const SITEVERIFY_URL = 'https://challenges.cloudflare.com/turnstile/v0/siteverify'

type SiteverifyResponse = {
  success: boolean
  'error-codes'?: string[]
  hostname?: string
}

/**
 * Checks the Cloudflare Turnstile token sent with public forms (sign-up, forgot password) so bots
 * can't drive them. Does nothing until TURNSTILE_SECRET_KEY is set, which lets this ship before
 * the Cloudflare widget and site key exist.
 */
@Injectable()
export class TurnstileService {
  private readonly logger = new Logger(TurnstileService.name)

  constructor(private readonly configService: ConfigService) {}

  async assertHuman(token: string | undefined, remoteIp: string | undefined): Promise<void> {
    const secret = this.configService.get<string>(ConfigEnum.TurnstileSecretKey)
    if (!secret) {
      return
    }

    if (!token) {
      throw new BadRequestException('Please complete the verification check and try again.')
    }

    let outcome: SiteverifyResponse
    try {
      const response = await fetch(SITEVERIFY_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ secret, response: token, ...(remoteIp ? { remoteip: remoteIp } : {}) }),
        signal: AbortSignal.timeout(10_000),
      })
      outcome = (await response.json()) as SiteverifyResponse
    } catch (error: any) {
      // Fail closed. If Cloudflare can't be reached, letting the request through would reopen the
      // exact hole this check exists to close.
      this.logger.error(`Turnstile verification request failed: ${error?.message}`, error?.stack)
      throw new ServiceUnavailableException('Verification is unavailable right now. Please try again shortly.')
    }

    if (!outcome.success) {
      this.logger.warn(`Turnstile rejected a token: ${(outcome['error-codes'] ?? []).join(', ') || 'no error codes'}`)
      throw new BadRequestException('Verification failed. Please try again.')
    }
  }
}
