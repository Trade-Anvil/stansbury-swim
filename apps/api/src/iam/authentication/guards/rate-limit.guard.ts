import { CanActivate, ExecutionContext, HttpException, HttpStatus, Injectable, SetMetadata } from '@nestjs/common'
import { Reflector } from '@nestjs/core'
import { Request } from 'express'
import { clientIp } from '../client-ip'

export const RATE_LIMIT_KEY = 'rateLimit'

export type RateLimitOptions = {
  /** Requests allowed per window, per visitor IP. */
  limit: number
  windowMs: number
}

/** Caps how often one IP can call a route. Pair with `@UseGuards(RateLimitGuard)`. */
export const RateLimit = (options: RateLimitOptions) => SetMetadata(RATE_LIMIT_KEY, options)

type Bucket = { count: number; resetAt: number }

// Shared across guard instances. Counts live in this process only, so with several API replicas
// each one counts separately and the effective limit is multiplied. It is a backstop behind the
// per-account cooldowns and Turnstile, not the only line.
const buckets = new Map<string, Bucket>()
const SWEEP_THRESHOLD = 10_000

@Injectable()
export class RateLimitGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const options = this.reflector.get<RateLimitOptions | undefined>(RATE_LIMIT_KEY, context.getHandler())
    if (!options) {
      return true
    }

    const req = context.switchToHttp().getRequest<Request>()
    const now = Date.now()
    const key = `${context.getClass().name}.${context.getHandler().name}:${clientIp(req)}`

    if (buckets.size > SWEEP_THRESHOLD) {
      for (const [bucketKey, bucket] of buckets) {
        if (bucket.resetAt <= now) {
          buckets.delete(bucketKey)
        }
      }
    }

    const bucket = buckets.get(key)
    if (!bucket || bucket.resetAt <= now) {
      buckets.set(key, { count: 1, resetAt: now + options.windowMs })
      return true
    }

    bucket.count += 1
    if (bucket.count > options.limit) {
      throw new HttpException('Too many requests. Please wait a few minutes and try again.', HttpStatus.TOO_MANY_REQUESTS)
    }
    return true
  }
}

/** Test hook: forget every counter. */
export const resetRateLimits = () => buckets.clear()
