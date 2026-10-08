'use client'
import { Disclosure, DisclosureButton, DisclosurePanel } from '@headlessui/react'
import { Bars3Icon, XMarkIcon } from '@heroicons/react/24/outline'
import ProfileDropdown from './ProfileDropdown'
import SignOutButton from './SignOutButton'
import { AvatarComponent } from 'avatar-initials'
import { usePathname } from 'next/navigation'
import React from 'react'
import { useUser } from '@contexts/index'

const navigation = [
  { name: 'Dashboard', href: '/dashboard' },
  { name: 'Purchase', href: '/dashboard/purchase' },
  { name: 'Schedule', href: '/dashboard/schedule' },
  { name: 'My Students', href: '/dashboard/students' },
  { name: 'History', href: '/dashboard/history' },
  { name: 'Instructors', href: '/dashboard/instructors' },
  { name: 'Pools', href: '/dashboard/pools' },
]

const userNavigation = [{ name: 'Your Profile', href: '/dashboard/profile' }]

function classNames(...classes: string[]) {
  return classes.filter(Boolean).join(' ')
}

export default function Nav() {
  const { user } = useUser()
  const pathname = usePathname()
  const isAdmin = user?.role === 'admin' || user?.role === 'instructor'

  if (isAdmin) {
    if (!navigation.some(item => item.name === 'Admin')) {
      navigation.push({ name: 'Admin', href: '/admin' })
    }
  }

  return (
    <Disclosure as="nav" className="border-b border-gray-200">
      {({ open }) => (
        <>
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="flex h-16 justify-between">
              <div className="flex">
                <div className="flex flex-shrink-0 items-center">
                  <img className="block h-8 w-auto lg:hidden" src="/images/logo.png" alt="Stansbury Swim" />
                  <img className="hidden h-8 w-auto lg:block" src="/images/logo.png" alt="Stansbury Swim" />
                </div>
                <div className="hidden sm:-my-px sm:ml-6 sm:flex sm:space-x-8">
                  {navigation.map(item => {
                    const isCurrent = pathname === item.href // Check if the current route matches the navigation item
                    return (
                      <a
                        key={item.name}
                        href={item.href}
                        className={classNames(
                          // Brand blue is 3.6:1 on white, enough for the underline but not for 14px text.
                          isCurrent
                            ? 'border-[rgb(66,139,202)] text-gray-900'
                            : 'border-transparent text-gray-600 hover:border-gray-300 hover:text-gray-900',
                          'inline-flex items-center border-b-2 px-1 pt-1 text-sm font-medium',
                        )}
                        aria-current={isCurrent ? 'page' : undefined}
                      >
                        {item.name}
                      </a>
                    )
                  })}
                </div>
              </div>
              <div className="hidden sm:ml-6 sm:flex sm:items-center">
                <ProfileDropdown />
              </div>
              <div className="-mr-2 flex items-center sm:hidden">
                {/* Mobile menu button */}
                <DisclosureButton className="relative inline-flex items-center justify-center rounded-md bg-white p-2 text-gray-500 hover:bg-gray-100 hover:text-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2">
                  <span className="absolute -inset-0.5" />
                  <span className="sr-only">Open main menu</span>
                  {open ? (
                    <XMarkIcon className="block h-6 w-6" aria-hidden="true" />
                  ) : (
                    <Bars3Icon className="block h-6 w-6" aria-hidden="true" />
                  )}
                </DisclosureButton>
              </div>
            </div>
          </div>

          <DisclosurePanel className="sm:hidden">
            <div className="space-y-1 pb-3 pt-2">
              {navigation.map(item => {
                const isCurrent = pathname === item.href // Check if the current route matches the navigation item
                return (
                  <DisclosureButton
                    key={item.name}
                    as="a"
                    href={item.href}
                    className={classNames(
                      isCurrent
                        ? 'border-indigo-500 bg-indigo-50 text-indigo-700'
                        : 'border-transparent text-gray-600 hover:border-gray-300 hover:bg-gray-50 hover:text-gray-800',
                      'block border-l-4 py-2 pl-3 pr-4 text-base font-medium',
                    )}
                    aria-current={isCurrent ? 'page' : undefined}
                  >
                    {item.name}
                  </DisclosureButton>
                )
              })}
              <SignOutButton />
            </div>
            <div className="border-t border-gray-200 pb-3 pt-4">
              <div className="flex items-center px-4">
                <div className="flex-shrink-0">
                  <AvatarComponent
                    classes="rounded-full"
                    useGravatar={false}
                    size={44}
                    color="#000000"
                    background="#f1f1f1"
                    fontSize={16}
                    fontWeight={400}
                    offsetY={24}
                    initials={`${user?.firstName ? user?.firstName[0] : ''}${user?.lastName ? user?.lastName[0] : ''}`}
                  />
                </div>
                <div className="ml-3">
                  <div className="text-base font-medium text-gray-800">{user?.firstName}</div>
                </div>
              </div>
              <div className="mt-3 space-y-1">
                {userNavigation.map(item => (
                  <DisclosureButton
                    key={item.name}
                    as="a"
                    href={item.href}
                    className="block px-4 py-2 text-base font-medium text-gray-500 hover:bg-gray-100 hover:text-gray-800"
                  >
                    {item.name}
                  </DisclosureButton>
                ))}
              </div>
            </div>
          </DisclosurePanel>
        </>
      )}
    </Disclosure>
  )
}
