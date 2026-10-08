import ResetPasswordForm from './components/reset-password-form'

export const metadata = { title: 'Reset password' }

export default function ResetPasswordPage() {
  return (
    <main id="main" className="flex min-h-full flex-1 flex-col justify-center px-6 py-12 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-sm">
        <h1 className="mt-10 text-center text-2xl font-bold leading-9 tracking-tight text-gray-900">
          Reset your password
        </h1>
        <p className="mt-2 text-center text-sm text-gray-600">Please enter your new password below.</p>
      </div>

      <div className="mt-10 sm:mx-auto sm:w-full sm:max-w-sm">
        <ResetPasswordForm />
      </div>
    </main>
  )
}
