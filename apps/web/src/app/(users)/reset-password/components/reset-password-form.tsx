'use client'
import React, { useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { AuthService } from '@/services/api/shared/authService'
import { ExclamationCircleIcon } from '@heroicons/react/20/solid'

export default function ResetPasswordForm() {
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const router = useRouter()
  const searchParams = useSearchParams()
  const token = searchParams.get('token')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setSuccess(false)

    if (!token) {
      setError('Invalid or expired reset link')
      return
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match')
      return
    }

    try {
      const response = await AuthService.resetPassword(token, password)

      if (!response) {
        throw new Error('Failed to reset password')
      }

      setSuccess(true)
      // Redirect to login page after a short delay
      setTimeout(() => {
        router.push('/sign-in')
      }, 2000)
    } catch (err: any) {
      setError(err?.body?.message || err?.message || 'Failed to reset password')
    }
  }

  if (!token) {
    return (
      <div className="text-center">
        <ExclamationCircleIcon className="mx-auto h-12 w-12 text-red-500" aria-hidden="true" />
        <h2 className="mt-2 text-sm font-semibold text-gray-900">Invalid Link</h2>
        <p className="mt-1 text-sm text-gray-500">This password reset link is invalid or has expired.</p>
        <div className="mt-6">
          <a href="/forgot-password" className="text-sm font-semibold text-indigo-600 hover:text-indigo-500">
            Request a new reset link
          </a>
        </div>
      </div>
    )
  }

  return (
    <form className="space-y-6" onSubmit={handleSubmit}>
      <div>
        <label htmlFor="password" className="block text-sm font-medium leading-6 text-gray-900">
          New Password
        </label>
        <div className="mt-2">
          <input
            value={password}
            id="password"
            name="password"
            type="password"
            autoComplete="new-password"
            required
            className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
            onChange={e => setPassword(e.target.value)}
          />
        </div>
      </div>

      <div>
        <label htmlFor="confirmPassword" className="block text-sm font-medium leading-6 text-gray-900">
          Confirm New Password
        </label>
        <div className="mt-2">
          <input
            value={confirmPassword}
            id="confirmPassword"
            name="confirmPassword"
            type="password"
            autoComplete="new-password"
            required
            className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
            onChange={e => setConfirmPassword(e.target.value)}
          />
        </div>
      </div>

      <div>
        <button
          type="submit"
          className="flex w-full justify-center rounded-md bg-indigo-600 px-3 py-1.5 text-sm font-semibold leading-6 text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
        >
          Reset Password
        </button>
        {error && (
          <div role="alert" className="mt-2 flex items-center gap-1">
            <ExclamationCircleIcon className="h-5 w-5 text-red-500" aria-hidden="true" />
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}
        {success && (
          <div role="status" className="mt-2 text-sm text-green-700">
            Password has been reset successfully. Redirecting to login...
          </div>
        )}
      </div>
    </form>
  )
}
