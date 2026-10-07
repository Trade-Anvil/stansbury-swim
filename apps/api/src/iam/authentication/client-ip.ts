import { Request } from 'express'

/**
 * The visitor's IP address. Railway's edge proxy sits in front of the API, so `req.ip` is the
 * proxy. Railway documents `X-Real-IP` as the header carrying the client's address
 * (https://docs.railway.com/networking/public-networking/specs-and-limits). Locally there is no
 * proxy and the header is absent, so it falls back to the socket address.
 */
export const clientIp = (req: Request): string => {
  const realIp = req.headers['x-real-ip']
  const value = Array.isArray(realIp) ? realIp[0] : realIp
  return value?.trim() || req.ip || 'unknown'
}
