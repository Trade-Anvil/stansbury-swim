'use client'
import { useEffect, useState } from 'react'
import { Fragment } from 'react'
import {
  CheckIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  ChevronUpDownIcon,
  ExclamationTriangleIcon,
  XCircleIcon,
  XMarkIcon,
} from '@heroicons/react/20/solid'
import { Listbox, ListboxOption, ListboxOptions, Transition, ListboxButton } from '@headlessui/react'
import Filter from './components/filter'
import { StudentService } from '@/services/api/shared/studentService'
import { ScheduleService } from '@/services/api/shared/scheduleService'
import { RegistrationService } from '@/services/api/shared/registrationService'
import React from 'react'
import { Student } from '@lib/student'
import { useUser } from '@contexts/user-context'
import { useCredits } from '@contexts/credits-context'
import { SignWaiverButton } from './sign-waiver-button'
import { SearchScheduleResponseDto } from '@/api/models/SearchScheduleResponseDto'
import { InstructorResponseDto } from '@/api'
import { PoolDto } from '@/api'
import { PoolService } from '@/services/api/shared/poolService'
import { InstructorService } from '@/services/api/shared/instructorService'
import Header from '../components/Header'
import Time from '@/app/components/time'
import { ORG_TIMEZONE as TIMEZONE } from '@/app/utils/dates'
import { isStoredImage } from '@/app/utils/images'
import Image from 'next/image'

export interface Option {
  value: string
  label: string
  checked: boolean
}

export interface Schedule {
  lessonType: 'private' | 'group'
  id: string
  instructorId: string
  poolId: string
  name: string
  imageUrl: string
  start: string
  startDateTime: string
  end: string
  endDateTime: string
}

interface PendingSchedules {
  scheduleId: string
  studentId: string
}

function classNames(...classes: (string | boolean | undefined)[]) {
  return classes.filter(Boolean).join(' ')
}

export default function Schedule() {
  const [schedules, setSchedules] = useState([] as SearchScheduleResponseDto[])
  const [students, setStudents] = useState([] as Student[])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const { credits, refreshCredits } = useCredits()
  const [selectedDate, setSelectedDate] = useState('')
  const [pendingSchedules, setPendingSchedules] = useState([] as PendingSchedules[])
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 10
  const [availableDates, setAvailableDates] = useState([] as string[])

  const [pools, setPools] = useState([] as PoolDto[])
  const [instructors, setInstructors] = useState([] as InstructorResponseDto[])

  useEffect(() => {
    const fetchAvailableDates = async () => {
      const dates = await ScheduleService.findAvailableDates(TIMEZONE)
      setAvailableDates(dates)
    }
    fetchAvailableDates()
  }, [])

  const { user, refreshUser } = useUser()
  const days = [
    { value: 'monday', label: 'Monday', checked: true },
    { value: 'tuesday', label: 'Tuesday', checked: true },
    { value: 'wednesday', label: 'Wednesday', checked: true },
    { value: 'thursday', label: 'Thursday', checked: true },
    { value: 'friday', label: 'Friday', checked: true },
    { value: 'saturday', label: 'Saturday', checked: true },
    { value: 'sunday', label: 'Sunday', checked: false },
  ]

  const times = [
    { value: 'morning', label: 'Morning (before 12 PM)', checked: true },
    { value: 'afternoon', label: 'Afternoon (12 – 5 PM)', checked: true },
    { value: 'evening', label: 'Evening (5 PM and later)', checked: true },
  ]

  const [selectedPools, setSelectedPools] = useState([] as Option[])
  const [selectedInstructors, setSelectedInstructors] = useState([] as Option[])
  const [selectedDays, setSelectedDays] = useState(days)
  const [selectedTimes, setSelectedTimes] = useState(times)

  // Every pool and instructor starts out selected in the filter once the lists arrive.
  useEffect(() => {
    PoolService.findAll().then(pools => {
      setPools(pools)
      if (pools.length > 0) {
        setSelectedPools(pools.map(pool => ({ value: pool.id, label: pool.name, checked: true })))
      }
    })
    InstructorService.findAll().then(instructors => {
      setInstructors(instructors)
      if (instructors.length > 0) {
        setSelectedInstructors(
          instructors.map(instructor => ({ value: instructor.id, label: instructor.name, checked: true })),
        )
      }
    })
  }, [])

  // Reset the error whenever the user changes: the waiver message until it is signed, otherwise nothing.
  // Done during render rather than in an effect, per https://react.dev/learn/you-might-not-need-an-effect
  const [waiverCheckedFor, setWaiverCheckedFor] = useState<typeof user | 'unchecked'>('unchecked')
  if (waiverCheckedFor !== user) {
    setWaiverCheckedFor(user)
    setError(user?.signedWaiver ? '' : 'You must sign the waiver before scheduling lessons')
  }

  const handlePoolsChange = (pools: Option[]) => {
    setSelectedPools(pools)
  }

  const handleInstructorsChange = (instructors: Option[]) => {
    setSelectedInstructors(instructors)
  }

  const handleDaysChange = (days: Option[]) => {
    setSelectedDays(days)
  }

  const handleTimesChange = (times: Option[]) => {
    setSelectedTimes(times)
    setCurrentPage(1)
  }

  const getTimeBucket = (iso: string): 'morning' | 'afternoon' | 'evening' => {
    const hour = parseInt(
      new Intl.DateTimeFormat('en-US', { timeZone: TIMEZONE, hour: 'numeric', hour12: false }).format(new Date(iso)),
      10,
    )
    if (hour < 12) return 'morning'
    if (hour < 17) return 'afternoon'
    return 'evening'
  }

  const handleDateChange = (date: string) => {
    if (date === selectedDate) {
      setSelectedDate('')
      return
    }
    setSelectedDate(date)
  }

  const handleReserve = async () => {
    Promise.all(
      pendingSchedules.map(async pendingSchedule => {
        try {
          await RegistrationService.create(pendingSchedule.scheduleId, {
            userId: user?.id,
            studentId: pendingSchedule.studentId,
          })
          setPendingSchedules([])
        } catch (err: any) {
          setError(err.message)
        }
      }),
    )
  }

  const handlePendingScheduleChange = (scheduleId: string, studentId: string) => {
    // check if they have enough credits
    if (credits < pendingSchedules.length + 1) {
      setError('CREDITS')
      return
    }
    const index = pendingSchedules.findIndex(pendingSchedule => pendingSchedule.scheduleId === scheduleId)
    if (index === -1) {
      setPendingSchedules([...pendingSchedules, { scheduleId, studentId }])
    } else {
      const newPendingSchedules = [...pendingSchedules]
      newPendingSchedules.splice(index, 1)
      setPendingSchedules(newPendingSchedules)
    }
  }

  useEffect(() => {
    ScheduleService.search({
      pools: selectedPools.filter(o => o.checked).map(o => o.value),
      instructors: selectedInstructors.filter(o => o.checked).map(o => o.value),
      daysOfWeek: selectedDays.filter(o => o.checked).map(o => o.value),
      date: selectedDate,
      timezone: TIMEZONE,
    })
      .catch(() => ScheduleService.findAll().then(all => all as unknown as SearchScheduleResponseDto[]))
      .then(schedules => setSchedules(schedules.filter(s => s.lessonType == 'private')))
  }, [selectedPools, selectedInstructors, selectedDays, selectedDate, pendingSchedules])

  useEffect(() => {
    StudentService.findMyStudents()
      // Removed students stay readable elsewhere so past bookings still render a name,
      // but they must never be selectable for a new booking.
      .then(students => setStudents(students.filter(student => !student.deletedAt)))
      .catch((err: any) => setError(err.message))
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    refreshCredits()
  }, [pendingSchedules])

  const handleWaiverClose = () => {
    setError('')
    refreshUser()
  }

  const checkedTimeBuckets = selectedTimes.filter(t => t.checked).map(t => t.value)
  const filteredSchedules =
    checkedTimeBuckets.length === selectedTimes.length
      ? schedules
      : schedules.filter(s => checkedTimeBuckets.includes(getTimeBucket(s.startDateTime)))

  const paginatedSchedules = filteredSchedules.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)

  const totalPages = Math.ceil(filteredSchedules.length / itemsPerPage)

  const handleNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1)
    }
  }

  const handlePrevPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1)
    }
  }

  return (
    <div>
      <Header title="Schedule" />
      <main className="px-6">
        <div className="mx-auto max-w-7xl sm:px-6 lg:px-8 py-5">
          {!user?.signedWaiver && (
            <div className="mt-2 border-l-4 border-yellow-400 bg-yellow-50 p-4 mb-4">
              <div className="flex">
                <div className="shrink-0">
                  <ExclamationTriangleIcon aria-hidden="true" className="size-5 text-yellow-400" />
                </div>
                <div className="ml-3">
                  <p className="text-sm text-yellow-700">You must sign the waiver before scheduling lessons.</p>
                  <div className="ml-auto pl-3 mt-2">
                    <SignWaiverButton onClose={() => handleWaiverClose()} />
                  </div>
                </div>
              </div>
            </div>
          )}
          <span className="inline-flex items-center rounded-md bg-gray-50 px-2 py-1 text-xs font-medium text-gray-600 ring-1 ring-inset ring-gray-500/10">
            {credits} available credit{credits > 1 ? 's' : ''}{' '}
            {pendingSchedules.length > 0 ? `(${pendingSchedules.length} pending)` : ''}
          </span>
          <div className=" py-5">
            <div>
              <Filter
                onPoolsChange={handlePoolsChange}
                onInstructorsChange={handleInstructorsChange}
                onDaysChange={handleDaysChange}
                onTimesChange={handleTimesChange}
                pools={selectedPools}
                instructors={selectedInstructors}
                days={selectedDays}
                times={selectedTimes}
                selectedDate={selectedDate}
                onDateChange={handleDateChange}
                availableDates={availableDates}
              />
            </div>
            <h2 className="text-base font-semibold leading-6 text-gray-900">
              Available Classes ({filteredSchedules.length})
            </h2>
            <ol className="mt-4 space-y-1 text-sm leading-6 text-gray-500">
              {paginatedSchedules
                ? paginatedSchedules.map(schedule => {
                    const instructor = instructors.find(instructor => instructor.id === schedule.instructorId)
                    const pool = pools.find(pool => pool.id === schedule.poolId)
                    const name = `${instructor?.name ?? 'Private instructor'} at ${pool?.name}`

                    const selectedStudent = pendingSchedules.find(
                      pendingSchedule => pendingSchedule.scheduleId === schedule.id,
                    )
                    const student = students.find(student => student.id === selectedStudent?.studentId)
                    return (
                      <li
                        key={schedule.id}
                        className="group flex items-center space-x-4 rounded-xl px-4 py-2 focus-within:bg-gray-100 hover:bg-gray-100"
                      >
                        {isStoredImage(instructor?.imageUrl) ? (
                          <Image
                            src={instructor.imageUrl}
                            alt=""
                            width={40}
                            height={40}
                            className="h-10 w-10 flex-none rounded-full object-cover"
                          />
                        ) : (
                          <div className="h-10 w-10 flex-none rounded-full bg-gray-100" />
                        )}
                        <div className="flex-auto">
                          <p className="text-gray-900">{name}</p>
                          <p className="mt-0.5">
                            <Time dateTime={schedule.startDateTime} />
                          </p>
                        </div>
                        <div className="flex-auto">
                          <Listbox
                            value={selectedStudent?.studentId ?? ''}
                            onChange={e => handlePendingScheduleChange(schedule.id, e)}
                          >
                            {({ open }) => (
                              <div className="relative mt-2">
                                <ListboxButton className="relative w-full cursor-default rounded-md bg-white py-1.5 pl-3 pr-10 text-left text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 sm:text-sm sm:leading-6">
                                  <span className="flex items-center">
                                    <span className="ml-3 block truncate">{student?.name ?? 'Available'}</span>
                                  </span>
                                  <span className="pointer-events-none absolute inset-y-0 right-0 ml-3 flex items-center pr-2">
                                    <ChevronUpDownIcon className="h-5 w-5 text-gray-400" aria-hidden="true" />
                                  </span>
                                </ListboxButton>

                                <Transition
                                  show={open}
                                  as={Fragment}
                                  leave="transition ease-in duration-100"
                                  leaveFrom="opacity-100"
                                  leaveTo="opacity-0"
                                >
                                  <ListboxOptions className="absolute z-10 mt-1 max-h-56 w-full overflow-auto rounded-md bg-white py-1 text-base shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none sm:text-sm">
                                    {students
                                      ? students.map(student => (
                                          <ListboxOption
                                            key={student.id}
                                            className={({ active }) =>
                                              classNames(
                                                active ? 'bg-indigo-600 text-white' : 'text-gray-900',
                                                'relative cursor-default select-none py-2 pl-3 pr-9',
                                              )
                                            }
                                            value={student.id}
                                          >
                                            {({ selected, active }) => (
                                              <>
                                                <div className="flex items-center">
                                                  <span
                                                    className={classNames(
                                                      selected ? 'font-semibold' : 'font-normal',
                                                      'ml-3 block truncate',
                                                    )}
                                                  >
                                                    {student.name}
                                                  </span>
                                                </div>

                                                {selected ? (
                                                  <span
                                                    className={classNames(
                                                      active ? 'text-white' : 'text-indigo-600',
                                                      'absolute inset-y-0 right-0 flex items-center pr-4',
                                                    )}
                                                  >
                                                    <CheckIcon className="h-5 w-5" aria-hidden="true" />
                                                  </span>
                                                ) : null}
                                              </>
                                            )}
                                          </ListboxOption>
                                        ))
                                      : null}
                                  </ListboxOptions>
                                </Transition>
                              </div>
                            )}
                          </Listbox>
                        </div>
                      </li>
                    )
                  })
                : null}
            </ol>
            {filteredSchedules.length > itemsPerPage && (
              <div className="mt-4 flex items-center justify-between border-t border-gray-200 px-4 py-3 sm:px-6">
                <div className="flex flex-1 justify-between sm:hidden">
                  <button
                    onClick={handlePrevPage}
                    disabled={currentPage === 1}
                    className="relative inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                  >
                    Previous
                  </button>
                  <button
                    onClick={handleNextPage}
                    disabled={currentPage === totalPages}
                    className="relative ml-3 inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                  >
                    Next
                  </button>
                </div>
                <div className="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between">
                  <div>
                    <p className="text-sm text-gray-700">
                      Showing <span className="font-medium">{(currentPage - 1) * itemsPerPage + 1}</span> to{' '}
                      <span className="font-medium">
                        {Math.min(currentPage * itemsPerPage, filteredSchedules.length)}
                      </span>{' '}
                      of <span className="font-medium">{filteredSchedules.length}</span> results
                    </p>
                  </div>
                  <div>
                    <nav className="isolate inline-flex -space-x-px rounded-md shadow-sm" aria-label="Pagination">
                      <button
                        onClick={handlePrevPage}
                        disabled={currentPage === 1}
                        className="relative inline-flex items-center rounded-l-md px-2 py-2 text-gray-400 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0 disabled:opacity-50"
                      >
                        <span className="sr-only">Previous</span>
                        <ChevronLeftIcon className="h-5 w-5" aria-hidden="true" />
                      </button>
                      <button
                        onClick={handleNextPage}
                        disabled={currentPage === totalPages}
                        className="relative inline-flex items-center rounded-r-md px-2 py-2 text-gray-400 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0 disabled:opacity-50"
                      >
                        <span className="sr-only">Next</span>
                        <ChevronRightIcon className="h-5 w-5" aria-hidden="true" />
                      </button>
                    </nav>
                  </div>
                </div>
              </div>
            )}
            {error == 'CREDITS' ? (
              <div className="mt-10 border-l-4 border-yellow-400 bg-yellow-50 p-4">
                <div className="flex">
                  <div className="shrink-0">
                    <ExclamationTriangleIcon aria-hidden="true" className="size-5 text-yellow-400" />
                  </div>
                  <div className="ml-3">
                    <p className="text-sm text-yellow-700">
                      You have no credits left.{' '}
                      <a href="/purchase" className="font-medium text-yellow-700 underline hover:text-yellow-600">
                        Purchase more credits to schedule more lessons.
                      </a>
                    </p>
                  </div>
                  <div className="ml-auto pl-3">
                    <div className="-mx-1.5 -my-1.5">
                      <button
                        type="button"
                        className="inline-flex rounded-md bg-yellow-50 p-1.5 text-yellow-500 hover:bg-yellow-100 focus:outline-none focus:ring-2 focus:ring-yellow-600 focus:ring-offset-2 focus:ring-offset-yellow-50"
                        onClick={() => setError('')}
                      >
                        <span className="sr-only">Dismiss</span>
                        <XMarkIcon aria-hidden="true" className="size-5" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ) : error ? (
              <div className="mt-10 rounded-md bg-red-50 p-4">
                <div className="flex">
                  <div className="shrink-0">
                    <XCircleIcon aria-hidden="true" className="size-5 text-red-400" />
                  </div>
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-red-800">
                      {error == 'Internal server error' ? 'Something went wrong. Please try again' : error}
                    </h3>
                  </div>
                  <div className="ml-auto pl-3">
                    <div className="-mx-1.5 -my-1.5">
                      <button
                        type="button"
                        className="inline-flex rounded-md bg-red-50 p-1.5 text-red-500 hover:bg-red-100 focus:outline-none focus:ring-2 focus:ring-red-600 focus:ring-offset-2 focus:ring-offset-red-50"
                        onClick={() => setError('')}
                      >
                        <span className="sr-only">Dismiss</span>
                        <XMarkIcon aria-hidden="true" className="size-5" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ) : null}
            <div className="py-20">
              <div className="sm:flex sm:items-center">
                <div className="sm:flex-auto">
                  <h1 className="text-base font-semibold text-gray-900">Pending Reservations</h1>
                  <p className="mt-2 text-sm text-gray-700">
                    When you're ready press <strong className="font-semibold text-gray-900">Reserve</strong> to finish
                    scheduling your lessons.
                  </p>
                </div>
                <div className="mt-4 sm:ml-16 sm:mt-0 sm:flex-none">
                  <button
                    type="button"
                    className="block rounded-md bg-indigo-600 px-3 py-2 text-center text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
                    onClick={handleReserve}
                  >
                    Reserve
                  </button>
                </div>
              </div>

              <div className="mt-10 ring-1 ring-gray-300 sm:mx-0 sm:rounded-lg">
                {pendingSchedules.length ? (
                  <table className="min-w-full divide-y divide-gray-300">
                    <thead>
                      <tr>
                        <th
                          scope="col"
                          className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 sm:pl-6"
                        >
                          Schedule
                        </th>
                        <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                          Credits
                        </th>
                        <th scope="col" className="relative py-3.5 pl-3 pr-4 sm:pr-6">
                          <span className="sr-only">Remove</span>
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {pendingSchedules.map((pendingSchedule, index) => {
                        // find schedule
                        // find student
                        const schedule = schedules.find(schedule => schedule.id === pendingSchedule.scheduleId)
                        const student = students.find(student => student.id === pendingSchedule.studentId)
                        const instructor = instructors.find(instructor => instructor.id === schedule?.instructorId)
                        const pool = pools.find(pool => pool.id === schedule?.poolId)
                        if (!schedule || !student || !pool || !instructor) return null
                        return (
                          <tr key={schedule.id + student.id}>
                            <td
                              className={classNames(
                                index === 0 ? '' : 'border-t border-transparent',
                                'relative py-4 pl-4 pr-3 text-sm sm:pl-6',
                              )}
                            >
                              <div className="font-medium text-gray-900">
                                <span className="ml-1 text-indigo-600">{student.name}</span> with {instructor.name} at
                                <span className="ml-1 text-indigo-600">{pool.name}</span>
                              </div>
                              {index !== 0 ? (
                                <div className="absolute -top-px left-6 right-0 h-px bg-gray-200" />
                              ) : null}
                            </td>
                            <td
                              className={classNames(
                                index === 0 ? '' : 'border-t border-gray-200',
                                'px-3 py-3.5 text-sm text-gray-500 lg:table-cell',
                              )}
                            >
                              1
                            </td>
                            <td
                              className={classNames(
                                index === 0 ? '' : 'border-t border-transparent',
                                'relative py-3.5 pl-3 pr-4 text-right text-sm font-medium sm:pr-6',
                              )}
                            >
                              <button
                                type="button"
                                className="inline-flex items-center rounded-md bg-white px-2.5 py-1.5 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-30 disabled:hover:bg-white"
                                onClick={() => {
                                  const newPendingSchedules = [...pendingSchedules]
                                  newPendingSchedules.splice(index, 1)
                                  setPendingSchedules(newPendingSchedules)
                                }}
                              >
                                Remove
                              </button>
                              {index !== 0 ? (
                                <div className="absolute -top-px left-0 right-6 h-px bg-gray-200" />
                              ) : null}
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                ) : (
                  <div className="p-4 text-center text-gray-500">No pending reservations</div>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
