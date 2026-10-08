import RegisterForm from './components/register-form'

export const metadata = { title: 'Create your account' }

export default function Register() {
  return (
    <main id="main" className="flex min-h-full flex-1 flex-col justify-center px-6 py-36 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-sm">
        <a href="/">
          <img className="mx-auto h-10 w-auto" src="/images/logo.png" alt="Stansbury Swim" />
        </a>
        <h1 className="mt-10 text-center text-2xl font-bold leading-9 tracking-tight text-gray-900">
          Create your account
        </h1>
      </div>

      <RegisterForm />
    </main>
  )
}
