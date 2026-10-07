'use client'
import { useEffect, useRef, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { AuthService } from '@/services/api/shared/authService'

type Status = 'working' | 'done' | 'failed'

export function VerifyEmailClient() {
  const searchParams = useSearchParams()
  const token = searchParams.get('token')
  const [requestStatus, setRequestStatus] = useState<Status>('working')
  const [email, setEmail] = useState<string | null>(null)
  // React runs effects twice in development. The token burns on first use, so without this
  // the second run reports a failure on a link that actually worked.
  const attempted = useRef(false)
  // A link with no token can only fail, so there is nothing to wait for.
  const status: Status = token ? requestStatus : 'failed'

  useEffect(() => {
    if (!token || attempted.current) return
    attempted.current = true

    AuthService.verifyEmail(token)
      .then(response => {
        setEmail(response?.email ?? null)
        setRequestStatus('done')
      })
      .catch(() => setRequestStatus('failed'))
  }, [token])

  return (
    <div className="flex min-h-full flex-col justify-center px-6 py-12 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-sm text-center">
        {status === 'working' && <p className="text-sm text-gray-600">Confirming your email address...</p>}

        {status === 'done' && (
          <>
            <h2 className="text-2xl font-bold tracking-tight text-gray-900">Email confirmed</h2>
            <p className="mt-2 text-sm text-gray-600">
              {email ? `${email} is now the address on your account.` : 'Your address is confirmed.'} Lesson
              confirmations and reminders will go here.
            </p>
          </>
        )}

        {status === 'failed' && (
          <>
            <h2 className="text-2xl font-bold tracking-tight text-gray-900">That link didn&apos;t work</h2>
            <p className="mt-2 text-sm text-gray-600">
              It may have expired or already been used. Sign in and use the banner on your dashboard to send a new one.
            </p>
          </>
        )}

        <Link
          href="/dashboard"
          className="mt-6 inline-block rounded-md bg-indigo-600 px-3 py-1.5 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500"
        >
          Go to dashboard
        </Link>
      </div>
    </div>
  )
}
