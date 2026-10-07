'use client'
import React, { useState } from 'react'
import { ExclamationCircleIcon } from '@heroicons/react/20/solid'
import { AuthService } from '@/services/api/shared/authService'
import { Turnstile, turnstileEnabled } from '@/app/components/turnstile'

export default function ForgotPasswordForm() {
  const [email, setEmail] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null)
  const [turnstileResetKey, setTurnstileResetKey] = useState(0)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setSuccess(false)

    if (turnstileEnabled && !turnstileToken) {
      setError('Please complete the verification check.')
      return
    }

    try {
      const response = await AuthService.forgotPassword(email, turnstileToken ?? undefined)

      if (!response) {
        throw new Error('Failed to send reset password email')
      }

      setSuccess(true)
    } catch (err: any) {
      setError(err.body?.message || err.message)
    } finally {
      // Tokens work once, so any further submit needs a fresh check.
      setTurnstileResetKey(key => key + 1)
    }
  }

  return (
    <form className="space-y-6" onSubmit={handleSubmit}>
      <div>
        <label htmlFor="email" className="block text-sm font-medium leading-6 text-gray-900">
          Email address
        </label>
        <div className="mt-2">
          <input
            value={email}
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            required
            className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
            onChange={e => setEmail(e.target.value)}
          />
        </div>
      </div>

      <Turnstile onToken={setTurnstileToken} resetKey={turnstileResetKey} />

      <div>
        <button
          type="submit"
          className="flex w-full justify-center rounded-md bg-indigo-600 px-3 py-1.5 text-sm font-semibold leading-6 text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
        >
          Send Reset Link
        </button>
        {error && (
          <div className="mt-2 flex items-center gap-1">
            <ExclamationCircleIcon className="h-5 w-5 text-red-500" />
            <p className="text-sm text-red-500">{error}</p>
          </div>
        )}
        {success && (
          <div className="mt-2 text-sm text-green-600">
            If an account exists with that email, you will receive a password reset link.
          </div>
        )}
      </div>
    </form>
  )
}
