import ClientSignIn from './components/client-sign-in'

export const metadata = { title: 'Sign in' }

export default function SignInPage() {
  return (
    <main id="main" className="flex min-h-full flex-1 flex-col justify-center px-6 py-36 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-sm">
        <a href="/">
          <img className="mx-auto h-10 w-auto" src="/images/logo.png" alt="Stansbury Swim" />
        </a>
        <h1 className="mt-10 text-center text-2xl font-bold leading-9 tracking-tight text-gray-900">
          Sign in to your account
        </h1>
      </div>
      <div className="mt-10 sm:mx-auto sm:w-full sm:max-w-sm">
        <ClientSignIn />
      </div>
    </main>
  )
}
