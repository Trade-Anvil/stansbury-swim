import Link from 'next/link'
import ForgotPasswordForm from './components/forgot-password-form'

export const metadata = { title: 'Forgot password' }

export default function ForgotPasswordPage() {
  return (
    <main id="main" className="flex min-h-full flex-1 flex-col justify-center px-6 py-12 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-sm">
        <h1 className="mt-10 text-center text-2xl font-bold leading-9 tracking-tight text-gray-900">
          Reset your password
        </h1>
        <p className="mt-2 text-center text-sm text-gray-600">
          Enter your email address and we'll send you a link to reset your password.
        </p>
      </div>

      <div className="mt-10 sm:mx-auto sm:w-full sm:max-w-sm">
        <ForgotPasswordForm />
        <p className="mt-10 text-center text-sm text-gray-500">
          Remember your password?{' '}
          <Link href="/sign-in" className="font-semibold leading-6 text-indigo-600 hover:text-indigo-500">
            Sign in
          </Link>
        </p>
      </div>
    </main>
  )
}
