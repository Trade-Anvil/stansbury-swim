import { BadRequestException, ServiceUnavailableException } from '@nestjs/common'
import { TurnstileService } from './turnstile.service'

const serviceWithSecret = (secret: string | undefined) =>
  new TurnstileService({ get: jest.fn().mockReturnValue(secret) } as any)

describe('TurnstileService', () => {
  const realFetch = global.fetch
  let fetchMock: jest.Mock

  beforeEach(() => {
    fetchMock = jest.fn()
    global.fetch = fetchMock as any
  })

  afterAll(() => {
    global.fetch = realFetch
  })

  it('lets everything through while no secret is configured', async () => {
    await expect(serviceWithSecret(undefined).assertHuman(undefined, '1.2.3.4')).resolves.toBeUndefined()
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('rejects a missing token once a secret is configured', async () => {
    await expect(serviceWithSecret('secret').assertHuman(undefined, '1.2.3.4')).rejects.toThrow(BadRequestException)
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('accepts a token Cloudflare confirms, sending the secret, token and visitor IP', async () => {
    fetchMock.mockResolvedValue({ json: async () => ({ success: true }) })

    await expect(serviceWithSecret('secret').assertHuman('tok', '1.2.3.4')).resolves.toBeUndefined()

    const [url, init] = fetchMock.mock.calls[0]
    expect(url).toBe('https://challenges.cloudflare.com/turnstile/v0/siteverify')
    expect(JSON.parse(init.body)).toEqual({ secret: 'secret', response: 'tok', remoteip: '1.2.3.4' })
  })

  it('rejects a token Cloudflare turns down', async () => {
    fetchMock.mockResolvedValue({ json: async () => ({ success: false, 'error-codes': ['timeout-or-duplicate'] }) })

    await expect(serviceWithSecret('secret').assertHuman('tok', '1.2.3.4')).rejects.toThrow(BadRequestException)
  })

  it('fails closed when Cloudflare cannot be reached', async () => {
    fetchMock.mockRejectedValue(new Error('network down'))

    await expect(serviceWithSecret('secret').assertHuman('tok', '1.2.3.4')).rejects.toThrow(
      ServiceUnavailableException,
    )
  })
})
