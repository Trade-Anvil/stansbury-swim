'use client'
import { Fragment, useEffect, useState, useSyncExternalStore } from 'react'
import { CalendarIcon, EllipsisHorizontalIcon, MapPinIcon, XCircleIcon, XMarkIcon } from '@heroicons/react/20/solid'
import { Menu, MenuButton, MenuItem, MenuItems, Transition } from '@headlessui/react'
import { StudentService } from '@/services/api/shared/studentService'
import { ScheduleService } from '@/services/api/shared/scheduleService'
import { RegistrationService } from '@/services/api/shared/registrationService'
import { Student } from '@lib/index'
import { useCredits } from '@contexts/index'
import { ScheduleResponseDto, InstructorResponseDto, PoolDto, StudentResponseDto } from '@/api'
import { ORG_TIMEZONE } from '@/app/utils/dates'

function classNames(...classes: (string | boolean | undefined)[]) {
  return classes.filter(Boolean).join(' ')
}

// The device timezone never changes while the page is open, so there is nothing to subscribe to.
const subscribeToTimeZone = () => () => {
  // nothing to unsubscribe from
}
const getViewerTimeZone = () => Intl.DateTimeFormat().resolvedOptions().timeZone
const getServerTimeZone = () => null

const isWithin24Hours = (date: string) => {
  const lessonTime = new Date(date)
  const now = new Date()
  const hoursUntilLesson = (lessonTime.getTime() - now.getTime()) / (1000 * 60 * 60)
  return hoursUntilLesson <= 24
}

export default function UpcomingLessons({
  instructors,
  pools,
}: {
  instructors: InstructorResponseDto[]
  pools: PoolDto[]
}) {
  const [error, setError] = useState('')
  const [students, setStudents] = useState([] as StudentResponseDto[])
  const [schedules, setSchedules] = useState([] as ScheduleResponseDto[])
  const { refreshCredits } = useCredits()

  // The viewer's timezone is only knowable after hydration, so this stays null
  // for the server render and the first client render.
  const viewerTimeZone = useSyncExternalStore<string | null>(
    subscribeToTimeZone,
    getViewerTimeZone,
    getServerTimeZone,
  )
  const timeOptions: Intl.DateTimeFormatOptions = {
    hour: '2-digit',
    minute: '2-digit',
    timeZone: ORG_TIMEZONE,
    // Viewers whose device is set outside the pool's timezone get an explicit
    // label so they don't read the time as local. 'shortGeneric' renders 'MT'
    // rather than 'MDT'/'MST', matching the Time component.
    ...(viewerTimeZone !== null && viewerTimeZone !== ORG_TIMEZONE ? { timeZoneName: 'shortGeneric' } : {}),
  }

  // Track loading for both students and schedules
  const [studentsLoading, setStudentsLoading] = useState(true)
  const [schedulesLoading, setSchedulesLoading] = useState(true)
  const loading = studentsLoading || schedulesLoading

  // Both start out loading, so these only clear the flag when the request settles.
  const loadStudents = () =>
    StudentService.findMyStudents()
      .then(setStudents)
      .catch((err: any) => setError(err.message))
      .finally(() => setStudentsLoading(false))

  const loadSchedules = () =>
    ScheduleService.findMySchedule()
      .then(setSchedules)
      .catch((err: any) => setError(err.message))
      .finally(() => setSchedulesLoading(false))

  // For refreshes after the first load, which show the loading state again.
  const fetchSchedules = () => {
    setSchedulesLoading(true)
    return loadSchedules()
  }

  useEffect(() => {
    loadSchedules()
    loadStudents()
  }, [])

  const handleCancel = async (e: React.MouseEvent, schedule: ScheduleResponseDto, student: Student) => {
    e.preventDefault()
    try {
      await RegistrationService.remove(schedule.id, student.id)
      fetchSchedules()
      refreshCredits()
    } catch (err: any) {
      setError(err.message)
    }
  }

  const futureLessons = schedules
    .filter(schedule => {
      const start = new Date(schedule.startDateTime)
      return start > new Date()
    })
    .sort((a, b) => new Date(a.startDateTime).getTime() - new Date(b.startDateTime).getTime())

  const pastLessons = schedules
    .filter(schedule => {
      const start = new Date(schedule.startDateTime)
      return start < new Date()
    })
    .sort((a, b) => new Date(b.startDateTime).getTime() - new Date(a.startDateTime).getTime())

  return (
    <div className="py-5">
      <h3 className="text-base font-semibold leading-6 text-gray-900">Upcoming lessons</h3>
      {loading ? (
        <p className="text-center text-sm text-gray-500">Loading upcoming lessons...</p>
      ) : error ? (
        <div className="mt-4 rounded-md bg-red-50 p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <XCircleIcon className="h-5 w-5 text-red-400" aria-hidden="true" />
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">{error}</h3>
            </div>
            <div className="ml-auto pl-3">
              <div className="-mx-1.5 -my-1.5">
                <button
                  type="button"
                  className="inline-flex rounded-md bg-red-50 p-1.5 text-red-500 hover:bg-red-100 focus:outline-none focus:ring-2 focus:ring-red-600 focus:ring-offset-2 focus:ring-offset-red-50"
                  onClick={() => setError('')}
                >
                  <span className="sr-only">Dismiss</span>
                  <XMarkIcon className="h-5 w-5" aria-hidden="true" />
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="lg:grid lg:grid-cols-12 lg:gap-x-16">
          <ol className="mt-4 divide-y divide-gray-100 text-sm leading-6 lg:col-span-7 xl:col-span-8">
            {futureLessons.length > 0 ? (
              futureLessons.map(schedule => {
                const instructor = instructors.find(i => i.id === schedule.instructorId)
                const pool = pools.find(p => p.id === schedule.poolId)
                const student = students.find(
                  s => s.id === schedule.registrations.find(r => r.studentId === s.id)?.studentId,
                )
                if (!instructor || !pool || !student) return null

                // format time in the pool's timezone
                const time = new Date(schedule.startDateTime)
                const timeOfDay = time.toLocaleTimeString('en-US', timeOptions)
                const day = time.toLocaleDateString('en-US', {
                  weekday: 'long',
                  month: 'long',
                  day: 'numeric',
                  timeZone: ORG_TIMEZONE,
                })
                // subtract start and end times
                const start = new Date(schedule.startDateTime)
                const end = new Date(schedule.endDateTime)
                // duration in minutes
                const duration = Math.round((end.getTime() - start.getTime()) / 1000 / 60)

                const studentName = student.deletedAt ? `${student.name} (Deleted)` : student.name

                return (
                  <li key={schedule.id} className="relative flex space-x-6 py-6 xl:static">
                    <img src={instructor.imageUrl} alt="" className="h-14 w-14 flex-none rounded-full" />
                    <div className="flex-auto">
                      <h3 className="pr-10 font-semibold text-gray-900 xl:pr-0">
                        {studentName} with {instructor.name} (
                        {schedule.lessonType === 'private' ? 'Private' : 'Parent and Tot'})
                      </h3>
                      <dl className="mt-2 flex flex-col text-gray-500 xl:flex-row">
                        <div className="flex items-start space-x-3">
                          <dt className="mt-0.5">
                            <span className="sr-only">Date</span>
                            <CalendarIcon className="h-5 w-5 text-gray-400" aria-hidden="true" />
                          </dt>
                          <dd>
                            <time dateTime={schedule.startDateTime}>
                              {day} at {timeOfDay} for {duration} minutes
                            </time>
                          </dd>
                        </div>
                        <div className="mt-2 flex items-start space-x-3 xl:ml-3.5 xl:mt-0 xl:border-l xl:border-gray-400 xl:border-opacity-50 xl:pl-3.5">
                          <dt className="mt-0.5">
                            <span className="sr-only">Location</span>
                            <MapPinIcon className="h-5 w-5 text-gray-400" aria-hidden="true" />
                          </dt>
                          <dd>{pool.name}</dd>
                        </div>
                      </dl>
                    </div>
                    <Menu
                      as="div"
                      className="absolute right-0 top-6 xl:relative xl:right-auto xl:top-auto xl:self-center"
                    >
                      <div>
                        <MenuButton className="-m-2 flex items-center rounded-full p-2 text-gray-500 hover:text-gray-600">
                          <span className="sr-only">Open options</span>
                          <EllipsisHorizontalIcon className="h-5 w-5" aria-hidden="true" />
                        </MenuButton>
                      </div>

                      <Transition
                        as={Fragment}
                        enter="transition ease-out duration-100"
                        enterFrom="transform opacity-0 scale-95"
                        enterTo="transform opacity-100 scale-100"
                        leave="transition ease-in duration-75"
                        leaveFrom="transform opacity-100 scale-100"
                        leaveTo="transform opacity-0 scale-95"
                      >
                        <MenuItems className="absolute right-0 z-10 mt-2 w-36 origin-top-right rounded-md bg-white shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
                          <div className="py-1">
                            {/* <MenuItem>
                              {({ active }) => (
                                <a
                                  href="#"
                                  className={classNames(
                                    active ? 'bg-gray-100 text-gray-900' : 'text-gray-700',
                                    'block px-4 py-2 text-sm',
                                  )}
                                >
                                  Edit
                                </a>
                              )}
                            </MenuItem> */}
                            <MenuItem>
                              {({ active }) => {
                                const isDisabled = isWithin24Hours(schedule.startDateTime)
                                return (
                                  <button
                                    className={classNames(
                                      active ? 'bg-gray-100 text-gray-900' : 'text-gray-700',
                                      'block px-4 py-2 text-sm',
                                      'w-full text-left',
                                      isDisabled && 'opacity-50 cursor-not-allowed',
                                    )}
                                    onClick={e => !isDisabled && handleCancel(e, schedule, student)}
                                    disabled={isDisabled}
                                    title={isDisabled ? 'Cannot cancel lessons within 24 hours' : 'Cancel lesson'}
                                  >
                                    Cancel
                                  </button>
                                )
                              }}
                            </MenuItem>
                          </div>
                        </MenuItems>
                      </Transition>
                    </Menu>
                  </li>
                )
              })
            ) : (
              <p>
                No upcoming lessons. <a href="/dashboard/schedule">Schedule one now</a>
              </p>
            )}
          </ol>
        </div>
      )}
      <h3 className="text-base font-semibold leading-6 text-gray-900">Past lessons</h3>
      {loading ? (
        <p className="text-center text-sm text-gray-500">Loading past lessons...</p>
      ) : (
        <div className="lg:grid lg:grid-cols-12 lg:gap-x-16">
          <ol className="mt-4 divide-y divide-gray-100 text-sm leading-6 lg:col-span-7 xl:col-span-8">
            {pastLessons.length > 0 ? (
              pastLessons.map(schedule => {
                const instructor = instructors.find(i => i.id === schedule.instructorId)
                const pool = pools.find(p => p.id === schedule.poolId)
                const student = students.find(
                  s => s.id === schedule.registrations.find(r => r.studentId === s.id)?.studentId,
                )
                if (!instructor || !pool || !student) return null

                // format time in the pool's timezone
                const time = new Date(schedule.startDateTime)
                const timeOfDay = time.toLocaleTimeString('en-US', timeOptions)
                const day = time.toLocaleDateString('en-US', {
                  weekday: 'long',
                  month: 'long',
                  day: 'numeric',
                  timeZone: ORG_TIMEZONE,
                })
                // subtract start and end times
                const start = new Date(schedule.startDateTime)
                const end = new Date(schedule.endDateTime)
                // duration in minutes
                const duration = Math.round((end.getTime() - start.getTime()) / 1000 / 60)

                return (
                  <li key={schedule.id} className="relative flex space-x-6 py-6 xl:static">
                    <img src={instructor.imageUrl} alt="" className="h-14 w-14 flex-none rounded-full" />
                    <div className="flex-auto">
                      <h3 className="pr-10 font-semibold text-gray-900 xl:pr-0">
                        {student.name} with {instructor.name} (
                        {schedule.lessonType === 'private' ? 'Private' : 'Parent and Tot'})
                      </h3>
                      <dl className="mt-2 flex flex-col text-gray-500 xl:flex-row">
                        <div className="flex items-start space-x-3">
                          <dt className="mt-0.5">
                            <span className="sr-only">Date</span>
                            <CalendarIcon className="h-5 w-5 text-gray-400" aria-hidden="true" />
                          </dt>
                          <dd>
                            <time dateTime={schedule.startDateTime}>
                              {day} at {timeOfDay} for {duration} minutes
                            </time>
                          </dd>
                        </div>
                        <div className="mt-2 flex items-start space-x-3 xl:ml-3.5 xl:mt-0 xl:border-l xl:border-gray-400 xl:border-opacity-50 xl:pl-3.5">
                          <dt className="mt-0.5">
                            <span className="sr-only">Location</span>
                            <MapPinIcon className="h-5 w-5 text-gray-400" aria-hidden="true" />
                          </dt>
                          <dd>{pool.name}</dd>
                        </div>
                      </dl>
                    </div>
                  </li>
                )
              })
            ) : (
              <p>No past lessons.</p>
            )}
          </ol>
        </div>
      )}
    </div>
  )
}
