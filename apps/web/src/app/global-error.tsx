'use client'

import * as Sentry from '@sentry/nextjs'
import Error from 'next/error'
import { useEffect } from 'react'

export default function GlobalError({ error }: { error: Error & { digest?: string } }) {
  useEffect(() => {
    Sentry.captureException(error)
  }, [error])

  return (
    <html lang="en">
      <body>
        <div className="flex min-h-screen flex-col items-center justify-center">
          <h1 className="text-2xl font-bold text-gray-900">Something went wrong!</h1>
          <p className="mt-2 text-gray-600">We apologize for the inconvenience. Our team has been notified.</p>
          <button
            onClick={() => window.location.reload()}
            className="mt-4 rounded-md bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
          >
            Try again
          </button>
        </div>
      </body>
    </html>
  )
}
