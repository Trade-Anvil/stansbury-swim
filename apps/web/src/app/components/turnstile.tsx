'use client'
import { useEffect, useRef } from 'react'

// https://developers.cloudflare.com/turnstile/get-started/client-side-rendering/
const SCRIPT_URL = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit'
const SITE_KEY = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY

/** False until the site key is set. Forms skip the check entirely while it is off. */
export const turnstileEnabled = Boolean(SITE_KEY)

type TurnstileApi = {
  render: (container: HTMLElement, options: Record<string, unknown>) => string
  reset: (widgetId: string) => void
  remove: (widgetId: string) => void
}

declare global {
  interface Window {
    turnstile?: TurnstileApi
  }
}

let scriptPromise: Promise<TurnstileApi> | null = null

const loadTurnstile = (): Promise<TurnstileApi> => {
  if (window.turnstile) {
    return Promise.resolve(window.turnstile)
  }
  if (!scriptPromise) {
    scriptPromise = new Promise((resolve, reject) => {
      const script = document.createElement('script')
      script.src = SCRIPT_URL
      script.async = true
      script.onload = () => (window.turnstile ? resolve(window.turnstile) : reject(new Error('Turnstile missing')))
      script.onerror = () => {
        scriptPromise = null
        reject(new Error('Turnstile failed to load'))
      }
      document.head.appendChild(script)
    })
  }
  return scriptPromise
}

/**
 * Cloudflare's bot check for public forms. Reports a token through `onToken`, or null when the
 * token expires or the check errors. Tokens work once, so bump `resetKey` after every submit
 * attempt to get a fresh one.
 */
export const Turnstile = ({ onToken, resetKey }: { onToken: (token: string | null) => void; resetKey: number }) => {
  const containerRef = useRef<HTMLDivElement>(null)
  const widgetIdRef = useRef<string | null>(null)
  const onTokenRef = useRef(onToken)
  onTokenRef.current = onToken

  useEffect(() => {
    if (!SITE_KEY) {
      return
    }
    let cancelled = false

    loadTurnstile()
      .then(turnstile => {
        if (cancelled || !containerRef.current) {
          return
        }
        widgetIdRef.current = turnstile.render(containerRef.current, {
          sitekey: SITE_KEY,
          callback: (token: string) => onTokenRef.current(token),
          'expired-callback': () => onTokenRef.current(null),
          'error-callback': () => onTokenRef.current(null),
        })
      })
      .catch(() => onTokenRef.current(null))

    return () => {
      cancelled = true
      if (widgetIdRef.current && window.turnstile) {
        window.turnstile.remove(widgetIdRef.current)
      }
      widgetIdRef.current = null
    }
  }, [])

  useEffect(() => {
    if (resetKey > 0 && widgetIdRef.current && window.turnstile) {
      onTokenRef.current(null)
      window.turnstile.reset(widgetIdRef.current)
    }
  }, [resetKey])

  if (!SITE_KEY) {
    return null
  }
  return <div ref={containerRef} className="flex justify-center" />
}
