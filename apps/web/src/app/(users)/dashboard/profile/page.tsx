'use client'
import { useState } from 'react'
import { MeService } from '@/services/api/shared/meService'
import { useUser } from '@contexts/user-context'
import { CheckCircleIcon } from '@heroicons/react/20/solid'
import Header from '../components/Header'
import DeleteAccountSection from './DeleteAccountSection'

export default function Profile() {
  const { user, refreshUser } = useUser()

  const [error, setError] = useState('')
  const [showSuccess, setShowSuccess] = useState(false)

  const [firstName, setFirstName] = useState(user?.firstName || '')
  const [lastName, setLastName] = useState(user?.lastName || '')
  const [email, setEmail] = useState(user?.email || '')
  const [address1, setStreetAddress] = useState(user?.address1 || '')
  const [address2, setStreetAddress2] = useState(user?.address2 || '')
  const [city, setCity] = useState(user?.city || '')
  const [state, setState] = useState(user?.state || '')
  const [zip, setPostalCode] = useState(user?.zip || '')
  const [phone, setPhone] = useState(user?.phone || '')

  const isFormValid = firstName && lastName && email && address1 && city && state && zip && phone

  // Refill the form whenever the user from context changes (first load, and after a save refreshes it).
  // Done during render rather than in an effect, per https://react.dev/learn/you-might-not-need-an-effect
  const [syncedUser, setSyncedUser] = useState(user)
  if (user !== syncedUser) {
    setSyncedUser(user)
    if (user) {
      setFirstName(user.firstName || '')
      setLastName(user.lastName || '')
      setEmail(user.email || '')
      setStreetAddress(user.address1 || '')
      setStreetAddress2(user.address2 || '')
      setCity(user.city || '')
      setState(user.state || '')
      setPostalCode(user.zip || '')
      setPhone(user.phone || '')
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    const updatedUser = {
      firstName,
      lastName,
      email,
      address1,
      address2,
      city,
      state,
      zip,
      phone,
    }

    try {
      await MeService.update(updatedUser)
      refreshUser()
      setShowSuccess(true)
    } catch (err) {
      console.error(err)
      setError('Failed to update profile')
    }
  }

  const handleCancel = () => {
    setShowSuccess(false)
    setFirstName(user?.firstName || '')
    setLastName(user?.lastName || '')
    setEmail(user?.email || '')
    setStreetAddress(user?.address1 || '')
    setStreetAddress2(user?.address2 || '')
    setCity(user?.city || '')
    setState(user?.state || '')
    setPostalCode(user?.zip || '')
    setPhone(user?.phone || '')
  }

  return (
    <>
      <Header title="My Profile" />
      <div className="py-10">
        <main className="px-6">
          <div className="mx-auto max-w-7xl sm:px-6 lg:px-8 py-10">
            <div className="px-4 sm:px-6 lg:px-8">
              <form
                onSubmit={e => {
                  handleSubmit(e)
                  setShowSuccess(false)
                }}
              >
                <div className="space-y-12">
                  <div className="border-b border-gray-900/10 pb-12">
                    <h2 className="text-base/7 font-semibold text-gray-900">Personal Information</h2>
                    <div className="mt-10 grid grid-cols-1 gap-x-6 gap-y-8 sm:grid-cols-6">
                      <div className="sm:col-span-3">
                        <label htmlFor="first-name" className="block text-sm/6 font-medium text-gray-900">
                          First name
                        </label>
                        <div className="mt-2">
                          <input
                            id="first-name"
                            name="first-name"
                            type="text"
                            autoComplete="given-name"
                            className="block w-full rounded-md bg-white px-3 py-1.5 text-base text-gray-900 outline outline-1 -outline-offset-1 outline-gray-300 placeholder:text-gray-400 focus:outline focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-600 sm:text-sm/6"
                            value={firstName}
                            onChange={e => setFirstName(e.target.value)}
                          />
                        </div>
                      </div>

                      <div className="sm:col-span-3">
                        <label htmlFor="last-name" className="block text-sm/6 font-medium text-gray-900">
                          Last name
                        </label>
                        <div className="mt-2">
                          <input
                            id="last-name"
                            name="last-name"
                            type="text"
                            autoComplete="family-name"
                            className="block w-full rounded-md bg-white px-3 py-1.5 text-base text-gray-900 outline outline-1 -outline-offset-1 outline-gray-300 placeholder:text-gray-400 focus:outline focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-600 sm:text-sm/6"
                            value={lastName}
                            onChange={e => setLastName(e.target.value)}
                          />
                        </div>
                      </div>

                      <div className="sm:col-span-4">
                        <label htmlFor="email" className="block text-sm/6 font-medium text-gray-900">
                          Email address
                        </label>
                        <div className="mt-2">
                          <input
                            id="email"
                            name="email"
                            type="email"
                            autoComplete="email"
                            className="block w-full rounded-md bg-white px-3 py-1.5 text-base text-gray-900 outline outline-1 -outline-offset-1 outline-gray-300 placeholder:text-gray-400 focus:outline focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-600 sm:text-sm/6"
                            value={email}
                            onChange={e => setEmail(e.target.value)}
                          />
                        </div>
                      </div>

                      <div className="col-span-full">
                        <label htmlFor="street-address" className="block text-sm/6 font-medium text-gray-900">
                          Street address <span className="text-red-500">*</span>
                        </label>
                        <div className="mt-2">
                          <input
                            id="street-address"
                            name="street-address"
                            type="text"
                            autoComplete="address-line1"
                            required
                            className="block w-full rounded-md bg-white px-3 py-1.5 text-base text-gray-900 outline outline-1 -outline-offset-1 outline-gray-300 placeholder:text-gray-400 focus:outline focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-600 sm:text-sm/6"
                            value={address1}
                            onChange={e => setStreetAddress(e.target.value)}
                          />
                        </div>
                      </div>

                      <div className="col-span-full">
                        <label htmlFor="street-address" className="block text-sm/6 font-medium text-gray-900">
                          Street address 2
                        </label>
                        <div className="mt-2">
                          <input
                            id="street-address-2"
                            name="street-address-2"
                            type="text"
                            autoComplete="address-line2"
                            className="block w-full rounded-md bg-white px-3 py-1.5 text-base text-gray-900 outline outline-1 -outline-offset-1 outline-gray-300 placeholder:text-gray-400 focus:outline focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-600 sm:text-sm/6"
                            value={address2}
                            onChange={e => setStreetAddress2(e.target.value)}
                          />
                        </div>
                      </div>

                      <div className="sm:col-span-2 sm:col-start-1">
                        <label htmlFor="city" className="block text-sm/6 font-medium text-gray-900">
                          City <span className="text-red-500">*</span>
                        </label>
                        <div className="mt-2">
                          <input
                            id="city"
                            name="city"
                            type="text"
                            autoComplete="address-level2"
                            required
                            className="block w-full rounded-md bg-white px-3 py-1.5 text-base text-gray-900 outline outline-1 -outline-offset-1 outline-gray-300 placeholder:text-gray-400 focus:outline focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-600 sm:text-sm/6"
                            value={city}
                            onChange={e => setCity(e.target.value)}
                          />
                        </div>
                      </div>

                      <div className="sm:col-span-2">
                        <label htmlFor="state" className="block text-sm/6 font-medium text-gray-900">
                          State / Province <span className="text-red-500">*</span>
                        </label>
                        <div className="mt-2">
                          <input
                            id="state"
                            name="state"
                            type="text"
                            autoComplete="address-level1"
                            required
                            className="block w-full rounded-md bg-white px-3 py-1.5 text-base text-gray-900 outline outline-1 -outline-offset-1 outline-gray-300 placeholder:text-gray-400 focus:outline focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-600 sm:text-sm/6"
                            value={state}
                            onChange={e => setState(e.target.value)}
                          />
                        </div>
                      </div>

                      <div className="sm:col-span-2">
                        <label htmlFor="postal-code" className="block text-sm/6 font-medium text-gray-900">
                          ZIP / Postal code <span className="text-red-500">*</span>
                        </label>
                        <div className="mt-2">
                          <input
                            id="postal-code"
                            name="postal-code"
                            type="text"
                            autoComplete="postal-code"
                            required
                            className="block w-full rounded-md bg-white px-3 py-1.5 text-base text-gray-900 outline outline-1 -outline-offset-1 outline-gray-300 placeholder:text-gray-400 focus:outline focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-600 sm:text-sm/6"
                            value={zip}
                            onChange={e => setPostalCode(e.target.value)}
                          />
                        </div>
                      </div>

                      <div className="sm:col-span-2">
                        <label htmlFor="phone" className="block text-sm/6 font-medium text-gray-900">
                          Phone <span className="text-red-500">*</span>
                        </label>
                        <div className="mt-2">
                          <input
                            id="phone"
                            name="phone"
                            type="phone"
                            autoComplete="phone"
                            required
                            className="block w-full rounded-md bg-white px-3 py-1.5 text-base text-gray-900 outline outline-1 -outline-offset-1 outline-gray-300 placeholder:text-gray-400 focus:outline focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-600 sm:text-sm/6"
                            value={phone}
                            onChange={e => setPhone(e.target.value)}
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* <div className="border-b border-gray-900/10 pb-12">
                    <h2 className="text-base/7 font-semibold text-gray-900">Notifications</h2>
                    <p className="mt-1 text-sm/6 text-gray-600">
                      We'll always let you know about important changes, but you pick what else you want to hear about.
                    </p>

                    <div className="mt-10 space-y-10">
                      <fieldset>
                        <legend className="text-sm/6 font-semibold text-gray-900">By email</legend>
                        <div className="mt-6 space-y-6">
                          <div className="flex gap-3">
                            <div className="flex h-6 shrink-0 items-center">
                              <div className="group grid size-4 grid-cols-1">
                                <input
                                  defaultChecked
                                  id="comments"
                                  name="comments"
                                  type="checkbox"
                                  aria-describedby="comments-description"
                                  className="col-start-1 row-start-1 appearance-none rounded border border-gray-300 bg-white checked:border-indigo-600 checked:bg-indigo-600 indeterminate:border-indigo-600 indeterminate:bg-indigo-600 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 disabled:border-gray-300 disabled:bg-gray-100 disabled:checked:bg-gray-100 forced-colors:appearance-auto"
                                />
                                <svg
                                  fill="none"
                                  viewBox="0 0 14 14"
                                  className="pointer-events-none col-start-1 row-start-1 size-3.5 self-center justify-self-center stroke-white group-has-[:disabled]:stroke-gray-950/25"
                                >
                                  <path
                                    d="M3 8L6 11L11 3.5"
                                    strokeWidth={2}
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    className="opacity-0 group-has-[:checked]:opacity-100"
                                  />
                                  <path
                                    d="M3 7H11"
                                    strokeWidth={2}
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    className="opacity-0 group-has-[:indeterminate]:opacity-100"
                                  />
                                </svg>
                              </div>
                            </div>
                            <div className="text-sm/6">
                              <label htmlFor="comments" className="font-medium text-gray-900">
                                Lesson Reminders
                              </label>
                              <p id="comments-description" className="text-gray-500">
                                Get lesson reminders a day before your lesson.
                              </p>
                            </div>
                          </div>
                        </div>
                      </fieldset>

                      <fieldset>
                        <legend className="text-sm/6 font-semibold text-gray-900">Push notifications</legend>
                        <p className="mt-1 text-sm/6 text-gray-600">
                          These are delivered via push notifications to your mobile phone if using our app or SMS if
                          not.
                        </p>
                        <div className="mt-6 space-y-6">
                          <div className="flex gap-3">
                            <div className="flex h-6 shrink-0 items-center">
                              <div className="group grid size-4 grid-cols-1">
                                <input
                                  defaultChecked
                                  id="comments"
                                  name="comments"
                                  type="checkbox"
                                  aria-describedby="comments-description"
                                  className="col-start-1 row-start-1 appearance-none rounded border border-gray-300 bg-white checked:border-indigo-600 checked:bg-indigo-600 indeterminate:border-indigo-600 indeterminate:bg-indigo-600 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 disabled:border-gray-300 disabled:bg-gray-100 disabled:checked:bg-gray-100 forced-colors:appearance-auto"
                                />
                                <svg
                                  fill="none"
                                  viewBox="0 0 14 14"
                                  className="pointer-events-none col-start-1 row-start-1 size-3.5 self-center justify-self-center stroke-white group-has-[:disabled]:stroke-gray-950/25"
                                >
                                  <path
                                    d="M3 8L6 11L11 3.5"
                                    strokeWidth={2}
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    className="opacity-0 group-has-[:checked]:opacity-100"
                                  />
                                  <path
                                    d="M3 7H11"
                                    strokeWidth={2}
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    className="opacity-0 group-has-[:indeterminate]:opacity-100"
                                  />
                                </svg>
                              </div>
                            </div>
                            <div className="text-sm/6">
                              <label htmlFor="comments" className="font-medium text-gray-900">
                                Lesson Reminders
                              </label>
                              <p id="comments-description" className="text-gray-500">
                                Get lesson reminders the day of your lesson.
                              </p>
                            </div>
                          </div>
                        </div>
                      </fieldset>
                    </div>
                  </div> */}
                </div>

                <div className="mt-6 flex items-center justify-end gap-x-6">
                  <button
                    type="button"
                    className="text-sm font-semibold leading-6 text-gray-900"
                    onClick={handleCancel}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={!isFormValid}
                    className="rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 disabled:bg-gray-400 disabled:cursor-not-allowed"
                  >
                    Save
                  </button>
                </div>
              </form>
              {showSuccess && (
                <div className="mt-10 rounded-md bg-green-50 p-4">
                  <div className="flex">
                    <div className="shrink-0">
                      <CheckCircleIcon aria-hidden="true" className="size-5 text-green-400" />
                    </div>
                    <div className="ml-3">
                      <h3 className="text-sm font-medium text-green-800">Profile Saved</h3>
                    </div>
                  </div>
                </div>
              )}
              <DeleteAccountSection />
            </div>
          </div>
        </main>
      </div>
    </>
  )
}
