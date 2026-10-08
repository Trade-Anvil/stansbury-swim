import Image from 'next/image'
import { cookies } from 'next/headers'
import { NavClient } from './nav-client'

const navigation = [
  { name: 'About', href: '#about' },
  { name: 'Team', href: '#team' },
  { name: 'Pricing', href: '#pricing' },
  { name: 'Pools', href: '#pools' },
]

export default async function Nav() {
  const cookieStore = await cookies()
  const authCookie = cookieStore.get('authToken')
  const isLoggedIn = !!authCookie

  return (
    <header className="fixed inset-x-0 top-0 z-50" style={{ backgroundColor: 'rgba(255,255,255,.7)' }}>
      <nav className="flex items-center justify-between p-6 lg:px-8" aria-label="Global">
        <div className="flex lg:flex-1">
          <a href="/" className="-m-1.5 p-1.5">
            <span className="sr-only">Stansbury Swim</span>
            <Image src="/images/logo.png" className="h-8 w-auto" alt="" width={50} height={35} />
          </a>
        </div>
        <NavClient navigation={navigation} isLoggedIn={isLoggedIn} />
      </nav>
    </header>
  )
}
