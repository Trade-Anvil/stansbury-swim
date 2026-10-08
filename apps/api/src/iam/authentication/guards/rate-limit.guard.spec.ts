import { HttpException, HttpStatus } from '@nestjs/common'
import { Reflector } from '@nestjs/core'
import { RATE_LIMIT_KEY, RateLimitGuard, RateLimitOptions, resetRateLimits } from './rate-limit.guard'

class FakeController {}
// Stand-in route handlers. The guard only reads their names and metadata, so they have no body.
function register() {
  // intentionally empty
}
function login() {
  // intentionally empty
}

const contextFor = (handler: () => void, headers: Record<string, string>, options?: RateLimitOptions) => {
  if (options) {
    Reflect.defineMetadata(RATE_LIMIT_KEY, options, handler)
  }
  return {
    getHandler: () => handler,
    getClass: () => FakeController,
    switchToHttp: () => ({ getRequest: () => ({ headers, ip: '10.0.0.1' }) }),
  } as any
}

describe('RateLimitGuard', () => {
  const guard = new RateLimitGuard(new Reflector())

  beforeEach(() => {
    resetRateLimits()
    jest.useFakeTimers()
  })

  afterEach(() => {
    jest.useRealTimers()
  })

  it('allows requests up to the limit, then answers 429', () => {
    const options = { limit: 2, windowMs: 60_000 }
    const ctx = contextFor(register, { 'x-real-ip': '1.1.1.1' }, options)

    expect(guard.canActivate(ctx)).toBe(true)
    expect(guard.canActivate(ctx)).toBe(true)
    try {
      guard.canActivate(ctx)
      fail('expected a 429')
    } catch (error) {
      expect(error).toBeInstanceOf(HttpException)
      expect((error as HttpException).getStatus()).toBe(HttpStatus.TOO_MANY_REQUESTS)
    }
  })

  it('counts each visitor IP separately', () => {
    const options = { limit: 1, windowMs: 60_000 }

    expect(guard.canActivate(contextFor(register, { 'x-real-ip': '1.1.1.1' }, options))).toBe(true)
    expect(guard.canActivate(contextFor(register, { 'x-real-ip': '2.2.2.2' }, options))).toBe(true)
  })

  it('counts each route separately', () => {
    const options = { limit: 1, windowMs: 60_000 }

    expect(guard.canActivate(contextFor(register, { 'x-real-ip': '1.1.1.1' }, options))).toBe(true)
    expect(guard.canActivate(contextFor(login, { 'x-real-ip': '1.1.1.1' }, options))).toBe(true)
  })

  it('opens again once the window passes', () => {
    const options = { limit: 1, windowMs: 60_000 }
    const ctx = contextFor(register, { 'x-real-ip': '1.1.1.1' }, options)

    guard.canActivate(ctx)
    expect(() => guard.canActivate(ctx)).toThrow(HttpException)

    jest.advanceTimersByTime(60_001)
    expect(guard.canActivate(ctx)).toBe(true)
  })

  it('ignores routes with no limit declared', () => {
    function unlimited() {
      // intentionally empty
    }
    const ctx = contextFor(unlimited, {})

    for (let i = 0; i < 50; i++) {
      expect(guard.canActivate(ctx)).toBe(true)
    }
  })
})
