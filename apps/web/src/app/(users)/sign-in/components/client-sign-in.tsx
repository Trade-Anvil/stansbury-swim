'use client'

import { GoogleLogin } from '@react-oauth/google'
import LoginForm from './login-form'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { setUser } from '@/app/utils/api'
import { useState } from 'react'
import { GoogleAuthService } from '@/services/api/shared/googleAuthService'
import { ApiError } from '@/api'

export default function ClientSignIn() {
  const router = useRouter()
  const [error, setError] = useState<string | null>(null)

  return (
    <>
      <LoginForm />
      <div className="mt-10 text-center text-sm text-gray-500">
        <p className="mb-4">
          Don't have an account?{' '}
          <Link href="/register" className="font-semibold leading-6 text-indigo-600 hover:text-indigo-500">
            Register here
          </Link>
        </p>
        <GoogleLogin
          onSuccess={async response => {
            try {
              const data = await GoogleAuthService.authenticate(response.credential ?? '')
              setUser(data)
              router.push('/dashboard')
            } catch (err) {
              console.log('Google login failed', err)
              if (err instanceof ApiError) {
                setError(err.body?.message || 'Google sign-in failed')
              } else {
                setError(err instanceof Error ? err.message : 'An unknown error occurred')
              }
            }
          }}
          onError={() => {
            console.log('Login Failed')
            setError('Login Failed')
          }}
        />
        <p className="mt-4 text-xs text-gray-500">
          By signing in, you agree to our{' '}
          <Link href="/terms-of-service" className="font-semibold text-indigo-600 hover:text-indigo-500">
            Terms of Service
          </Link>{' '}
          and{' '}
          <Link href="/privacy-policy" className="font-semibold text-indigo-600 hover:text-indigo-500">
            Privacy Policy
          </Link>
          .
        </p>
      </div>
      {error && (
        <div role="alert" className="mt-4 text-red-600">
          {error}
        </div>
      )}
    </>
  )
}
