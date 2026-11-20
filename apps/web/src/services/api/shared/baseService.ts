import { OpenAPI } from '@/api/core/OpenAPI'

export type ApiConfig = {
  headers?: Record<string, string>
  credentials?: 'include' | 'omit' | 'same-origin'
}

// Decorator to automatically configure the service before method execution
export function WithConfig() {
  return function (target: any) {
    // Get all static methods of the class
    const staticMethods = Object.getOwnPropertyNames(target).filter(
      prop => typeof target[prop] === 'function' && prop !== 'constructor',
    )

    // Wrap each static method
    staticMethods.forEach(methodName => {
      const originalMethod = target[methodName]
      target[methodName] = async function (...args: any[]) {
        await BaseService.configure()
        return originalMethod.apply(this, args)
      }
    })

    return target
  }
}

export class BaseService {
  public static async configure(config: ApiConfig = {}) {
    // Set base URL for all environments
    OpenAPI.BASE = process.env.NEXT_PUBLIC_API_URL || ''

    if (typeof window === 'undefined') {
      // OpenAPI is one object shared by every request on the server. A cookie string stored on it is safe only while
      // no I/O wait sits between the write and the generated client's read, or another request can overwrite it.
      // The generated client calls this resolver per request instead, and cookies() reads that request's cookies.
      OpenAPI.HEADERS = serverRequestCookies
    } else {
      // Client-side configuration
      OpenAPI.HEADERS = config.headers
      OpenAPI.CREDENTIALS = config.credentials || 'include'
      OpenAPI.WITH_CREDENTIALS = true
    }
  }
}

async function serverRequestCookies(): Promise<Record<string, string>> {
  try {
    const { cookies } = await import('next/headers')
    return { Cookie: (await cookies()).toString() }
  } catch {
    // No request to read from (for example inside unstable_cache), so send no cookies.
    return {}
  }
}

// Export the proxied OpenAPI instance
export { OpenAPI }
