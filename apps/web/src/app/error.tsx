'use client'

import * as Sentry from '@sentry/nextjs'
import { useEffect } from 'react'

export default function Error({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    Sentry.captureException(error)
  }, [error])

  return (
    <div className="flex min-h-[400px] flex-col items-center justify-center">
      <h2 className="text-2xl font-bold text-gray-900">This page could not load</h2>
      <p className="mt-2 max-w-md text-center text-gray-600">
        Our booking system may be down for a few minutes. Our team has been notified. You can still see our lessons,
        prices, and pools on the{' '}
        <a href="/" className="font-semibold text-indigo-600 hover:text-indigo-500">
          home page
        </a>
        .
      </p>
      <button
        onClick={() => reset()}
        className="mt-4 rounded-md bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
      >
        Try again
      </button>
      <button
        onClick={() => window.location.reload()}
        className="mt-4 rounded-md bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
      >
        Refresh
      </button>
    </div>
  )
}
