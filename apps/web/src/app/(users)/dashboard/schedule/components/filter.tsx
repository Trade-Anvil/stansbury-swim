'use client'
import { ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/20/solid'
import { Fragment, useMemo, useState, useSyncExternalStore } from 'react'
import {
  Dialog,
  DialogPanel,
  Disclosure,
  DisclosureButton,
  DisclosurePanel,
  Menu,
  Popover,
  PopoverButton,
  PopoverGroup,
  PopoverPanel,
  Transition,
  TransitionChild,
} from '@headlessui/react'
import { XMarkIcon } from '@heroicons/react/24/outline'
import { ChevronDownIcon } from '@heroicons/react/20/solid'
import { Option } from '../page'

interface CalendarDay {
  date: string
  monthIndex: number
  isCurrentMonth: boolean
  isToday: boolean
  isSelected: boolean
  isDisabled: boolean
  isEmpty: boolean
}

// next four month names in an array starting from today
const monthNames = Array.from({ length: 4 }, (_, i) => {
  const date = new Date()
  date.setMonth(new Date().getMonth() + i)
  return date.toLocaleString('default', { month: 'long' })
})

// Nothing to subscribe to: these only tell the server render apart from the browser.
const subscribeToNothing = () => () => {
  // nothing to unsubscribe from
}
const getIsClient = () => true
const getIsServer = () => false

function classNames(...classes: string[]) {
  return classes.filter(Boolean).join(' ')
}

interface FilterProps {
  onPoolsChange: (pools: Option[]) => void
  onInstructorsChange: (instructors: Option[]) => void
  onDaysChange: (days: Option[]) => void
  onTimesChange: (times: Option[]) => void
  onDateChange: (date: string) => void
  selectedDate: string
  pools: Option[]
  instructors: Option[]
  days: Option[]
  times: Option[]
  availableDates: string[]
}

export default function Filter({
  onPoolsChange,
  onInstructorsChange,
  onDaysChange,
  onTimesChange,
  onDateChange,
  selectedDate,
  pools,
  instructors,
  days,
  times,
  availableDates,
}: FilterProps) {
  const [open, setOpen] = useState(false)
  const [selectedMonth, setSelectedMonth] = useState(0)
  // The calendar is built from the browser's clock and timezone, so it stays empty for the server
  // render and hydration and fills in on the client, which avoids a hydration mismatch.
  const isClient = useSyncExternalStore(subscribeToNothing, getIsClient, getIsServer)

  const poolSection = { id: 'pool', name: 'Pool', options: pools }
  const instructorSection = { id: 'instructor', name: 'Instructor', options: instructors }
  const daySection = {
    id: 'day',
    name: 'Days',
    options: days,
  }
  const timeSection = {
    id: 'time',
    name: 'Time of day',
    options: times,
  }

  const filters = [poolSection, instructorSection, daySection, timeSection]

  function handleFilterChange(
    section: { id: string; name: string; options: Array<Option> },
    option: Option,
    checked: boolean,
  ): void {
    let func = onPoolsChange
    if (section.id === 'pool') {
      func = onPoolsChange
    } else if (section.id === 'instructor') {
      func = onInstructorsChange
    } else if (section.id === 'day') {
      func = onDaysChange
    } else if (section.id === 'time') {
      func = onTimesChange
    }
    func(
      section.options.map(o => ({
        ...o,
        checked: o.value === option.value ? checked : o.checked,
      })),
    )
  }

  const calendar = useMemo((): Array<CalendarDay> => {
    if (!isClient) {
      return []
    }
    // TODO get this from the backend API and populate the days with a field indicating if the day has a lesson available.
    // populate the next 4 months in the calendar starting from today
    let cal = Array.from({ length: 4 }, (_, i) => {
      const baseDate = new Date()
      baseDate.setMonth(baseDate.getMonth() + i)
      baseDate.setDate(1) // Set to the first day of the month

      const daysInMonth = new Date(baseDate.getFullYear(), baseDate.getMonth() + 1, 0).getDate() // Get correct number of days
      const firstDayOfMonth = baseDate.getDay() // Get the day of week (0-6) for the first day of the month, where 0 is Sunday

      // Create an array that includes empty slots for days before the first of the month
      const days = Array.from({ length: 42 }, (_, j) => {
        const dayNumber = j - firstDayOfMonth + 1
        if (dayNumber < 1 || dayNumber > daysInMonth) {
          return {
            date: '',
            monthIndex: i,
            isCurrentMonth: false,
            isToday: false,
            isSelected: false,
            isDisabled: true,
            isEmpty: true,
          }
        }

        const date = new Date(baseDate.getFullYear(), baseDate.getMonth(), dayNumber)
        const formattedDate = date.toISOString().split('T')[0]

        return {
          date: formattedDate,
          monthIndex: i,
          isCurrentMonth: i === 0,
          isToday: i === 0 && date.toDateString() === new Date().toDateString(),
          isSelected: formattedDate === selectedDate,
          isDisabled: date < new Date(),
          isEmpty: false,
        }
      })

      return days
    }).flat()
    return cal
  }, [isClient, selectedDate])

  return (
    <div className="bg-gray-50">
      {/* Mobile filter dialog */}
      <Transition show={open} as={Fragment}>
        <Dialog as="div" className="relative z-40 sm:hidden" onClose={setOpen}>
          <TransitionChild
            as={Fragment}
            enter="transition-opacity ease-linear duration-300"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="transition-opacity ease-linear duration-300"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <div className="fixed inset-0 bg-black bg-opacity-25" />
          </TransitionChild>

          <div className="fixed inset-0 z-40 flex">
            <TransitionChild
              as={Fragment}
              enter="transition ease-in-out duration-300 transform"
              enterFrom="translate-x-full"
              enterTo="translate-x-0"
              leave="transition ease-in-out duration-300 transform"
              leaveFrom="translate-x-0"
              leaveTo="translate-x-full"
            >
              <DialogPanel className="relative ml-auto flex h-full w-full max-w-xs flex-col overflow-y-auto bg-white py-4 pb-6 shadow-xl">
                <div className="flex items-center justify-between px-4">
                  <h2 className="text-lg font-medium text-gray-900">Filters</h2>
                  <button
                    type="button"
                    className="-mr-2 flex h-10 w-10 items-center justify-center rounded-md bg-white p-2 text-gray-400 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    onClick={() => setOpen(false)}
                  >
                    <span className="sr-only">Close menu</span>
                    <XMarkIcon className="h-6 w-6" aria-hidden="true" />
                  </button>
                </div>

                {/* Filters */}
                <form className="mt-4">
                  {filters.map(section => (
                    <Disclosure
                      as="div"
                      key={section.name}
                      className="border-t border-gray-200 px-4 py-6"
                      defaultOpen={true}
                    >
                      {({ open }) => (
                        <>
                          <h3 className="-mx-2 -my-3 flow-root">
                            <DisclosureButton className="flex w-full items-center justify-between bg-white px-2 py-3 text-sm text-gray-400">
                              <span className="font-medium text-gray-900">{section.name}</span>
                              <span className="ml-6 flex items-center">
                                <ChevronDownIcon
                                  className={classNames(open ? '-rotate-180' : 'rotate-0', 'h-5 w-5 transform')}
                                  aria-hidden="true"
                                />
                              </span>
                            </DisclosureButton>
                          </h3>
                          <DisclosurePanel className="pt-6">
                            <div className="space-y-6">
                              {section.options.map((option, optionIdx) => (
                                <div key={option.value} className="flex items-center">
                                  <input
                                    id={`filter-mobile-${section.id}-${optionIdx}`}
                                    name={`${section.id}[]`}
                                    defaultValue={option.value}
                                    type="checkbox"
                                    checked={option.checked}
                                    className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                                    onChange={e => handleFilterChange(section, option, e.target.checked)}
                                  />
                                  <label
                                    htmlFor={`filter-mobile-${section.id}-${optionIdx}`}
                                    className="ml-3 text-sm text-gray-500"
                                  >
                                    {option.label}
                                  </label>
                                </div>
                              ))}
                            </div>
                          </DisclosurePanel>
                        </>
                      )}
                    </Disclosure>
                  ))}
                  <Disclosure as="div" className="border-t border-gray-200 px-4 py-6">
                    {({ open }) => (
                      <>
                        <h3 className="-mx-2 -my-3 flow-root">
                          <DisclosureButton className="flex w-full items-center justify-between bg-white px-2 py-3 text-sm text-gray-400">
                            <span className="font-medium text-gray-900">Date</span>
                            <span className="ml-6 flex items-center">
                              <ChevronDownIcon
                                className={classNames(open ? '-rotate-180' : 'rotate-0', 'h-5 w-5 transform')}
                                aria-hidden="true"
                              />
                            </span>
                          </DisclosureButton>
                        </h3>
                        <DisclosurePanel className="pt-6">
                          <div className="space-y-6">
                            <div>
                              <div className="flex items-center">
                                <h2 className="flex-auto text-sm font-semibold text-gray-900">
                                  {monthNames[selectedMonth]}
                                </h2>
                                <button
                                  type="button"
                                  className="-my-1.5 flex flex-none items-center justify-center p-1.5 text-gray-400 hover:text-gray-500"
                                  disabled={selectedMonth === 0}
                                  onClick={() => setSelectedMonth(selectedMonth - 1)}
                                >
                                  <span className="sr-only">Previous month</span>
                                  <ChevronLeftIcon className="h-5 w-5" aria-hidden="true" />
                                </button>
                                <button
                                  type="button"
                                  className="-my-1.5 -mr-1.5 ml-2 flex flex-none items-center justify-center p-1.5 text-gray-400 hover:text-gray-500"
                                  disabled={selectedMonth === 3}
                                  onClick={() => setSelectedMonth(selectedMonth + 1)}
                                >
                                  <span className="sr-only">Next month</span>
                                  <ChevronRightIcon className="h-5 w-5" aria-hidden="true" />
                                </button>
                              </div>
                              <div className="mt-10 grid grid-cols-7 text-center text-xs leading-6 text-gray-500">
                                <div>S</div>
                                <div>M</div>
                                <div>T</div>
                                <div>W</div>
                                <div>T</div>
                                <div>F</div>
                                <div>S</div>
                              </div>
                              <div className="mt-2 grid grid-cols-7 text-sm">
                                {calendar
                                  .filter(day => day.monthIndex === selectedMonth)
                                  .map((day, dayIdx) => (
                                    <div
                                      key={day.date || `empty-${dayIdx}`}
                                      className={classNames(dayIdx > 6 ? 'border-t border-gray-200' : '', 'py-2')}
                                    >
                                      {!day.isEmpty && (
                                        <button
                                          type="button"
                                          className={classNames(
                                            // Selected day styling
                                            day.isSelected && day.isToday ? 'bg-indigo-600 text-white' : '', // Selected and today
                                            day.isSelected && !day.isToday ? 'bg-gray-900 text-white' : '', // Selected but not today

                                            // Today but not selected
                                            !day.isSelected && day.isToday ? 'text-indigo-600 font-semibold' : '',

                                            // Available day styling
                                            !day.isSelected && !day.isToday && availableDates.includes(day.date)
                                              ? 'bg-blue-100 hover:bg-blue-200'
                                              : '',

                                            // Hover effect when not selected and not available
                                            !day.isSelected && !availableDates.includes(day.date)
                                              ? 'hover:bg-gray-200'
                                              : '',

                                            // Font weight adjustments for selected or today
                                            day.isSelected || day.isToday ? 'font-semibold' : '',

                                            day.isDisabled ? 'text-gray-400' : '',

                                            // Common styling for the button
                                            'mx-auto flex h-8 w-8 items-center justify-center rounded-full',
                                          )}
                                          onClick={() => onDateChange(day.date)}
                                        >
                                          <time dateTime={day.date}>
                                            {day.date.split('-').pop()?.replace(/^0/, '')}
                                          </time>
                                        </button>
                                      )}
                                    </div>
                                  ))}
                              </div>
                            </div>
                          </div>
                        </DisclosurePanel>
                      </>
                    )}
                  </Disclosure>
                </form>
              </DialogPanel>
            </TransitionChild>
          </div>
        </Dialog>
      </Transition>

      <div className="mx-auto max-w-3xl px-4 text-center sm:px-6 lg:max-w-7xl lg:px-8">
        <section aria-labelledby="filter-heading" className="py-6 my-6">
          <h2 id="filter-heading" className="sr-only">
            Schedule filters
          </h2>
          <div className="flex items-center justify-between">
            <button
              type="button"
              className="inline-block text-sm font-medium text-gray-700 hover:text-gray-900 sm:hidden"
              onClick={() => setOpen(true)}
            >
              Filters
            </button>

            <PopoverGroup className="hidden sm:flex sm:items-baseline sm:space-x-8">
              {filters.map((section, sectionIdx) => (
                <Popover
                  as="div"
                  key={section.name}
                  id={`desktop-menu-${sectionIdx}`}
                  className="relative inline-block text-left"
                >
                  <div>
                    <PopoverButton className="group inline-flex items-center justify-center text-sm font-medium text-gray-700 hover:text-gray-900">
                      <span>{section.name}</span>
                      {sectionIdx === 0 ? (
                        <span className="ml-1.5 rounded bg-gray-200 px-1.5 py-0.5 text-xs font-semibold tabular-nums text-gray-700">
                          1
                        </span>
                      ) : null}
                      <ChevronDownIcon
                        className="-mr-1 ml-1 h-5 w-5 flex-shrink-0 text-gray-400 group-hover:text-gray-500"
                        aria-hidden="true"
                      />
                    </PopoverButton>
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
                    <PopoverPanel className="absolute right-0 z-10 mt-2 origin-top-right rounded-md bg-white p-4 shadow-2xl ring-1 ring-black ring-opacity-5 focus:outline-none">
                      <form className="space-y-4">
                        {section.options.map((option, optionIdx) => (
                          <div key={option.value} className="flex items-center">
                            <input
                              id={`filter-${section.id}-${optionIdx}`}
                              name={`${section.id}[]`}
                              defaultValue={option.value}
                              checked={option.checked}
                              type="checkbox"
                              className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                              onChange={e => handleFilterChange(section, option, e.target.checked)}
                            />
                            <label
                              htmlFor={`filter-${section.id}-${optionIdx}`}
                              className="ml-3 whitespace-nowrap pr-6 text-sm font-medium text-gray-900"
                            >
                              {option.label}
                            </label>
                          </div>
                        ))}
                      </form>
                    </PopoverPanel>
                  </Transition>
                </Popover>
              ))}
              <Popover as="div" className="relative inline-block text-left">
                <div>
                  <PopoverButton className="group inline-flex items-center justify-center text-sm font-medium text-gray-700 hover:text-gray-900">
                    <span>Date</span>
                    {
                      <span className="ml-1.5 rounded bg-gray-200 px-1.5 py-0.5 text-xs font-semibold tabular-nums text-gray-700">
                        {selectedDate}
                      </span>
                    }
                    <ChevronDownIcon
                      className="-mr-1 ml-1 h-5 w-5 flex-shrink-0 text-gray-400 group-hover:text-gray-500"
                      aria-hidden="true"
                    />
                  </PopoverButton>
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
                  <PopoverPanel className="absolute right-0 z-10 mt-2 origin-top-right rounded-md bg-white p-4 shadow-2xl ring-1 ring-black ring-opacity-5 focus:outline-none">
                    <div className="space-y-6" style={{ width: '400px' }}>
                      <div>
                        <div className="flex items-center">
                          <h2 className="flex-auto text-sm font-semibold text-gray-900">{monthNames[selectedMonth]}</h2>
                          <button
                            type="button"
                            className="-my-1.5 flex flex-none items-center justify-center p-1.5 text-gray-400 hover:text-gray-500"
                            disabled={selectedMonth === 0}
                            onClick={() => setSelectedMonth(selectedMonth - 1)}
                          >
                            <span className="sr-only">Previous month</span>
                            <ChevronLeftIcon className="h-5 w-5" aria-hidden="true" />
                          </button>
                          <button
                            type="button"
                            className="-my-1.5 -mr-1.5 ml-2 flex flex-none items-center justify-center p-1.5 text-gray-400 hover:text-gray-500"
                            disabled={selectedMonth === 3}
                            onClick={() => setSelectedMonth(selectedMonth + 1)}
                          >
                            <span className="sr-only">Next month</span>
                            <ChevronRightIcon className="h-5 w-5" aria-hidden="true" />
                          </button>
                        </div>
                        <div className="mt-10 grid grid-cols-7 text-center text-xs leading-6 text-gray-500">
                          <div>S</div>
                          <div>M</div>
                          <div>T</div>
                          <div>W</div>
                          <div>T</div>
                          <div>F</div>
                          <div>S</div>
                        </div>
                        <div className="mt-2 grid grid-cols-7 text-sm">
                          {calendar
                            .filter(day => day.monthIndex === selectedMonth)
                            .map((day, dayIdx) => (
                              <div
                                key={day.date || `empty-${dayIdx}`}
                                className={classNames(dayIdx > 6 ? 'border-t border-gray-200' : '', 'py-2')}
                              >
                                {!day.isEmpty && (
                                  <button
                                    type="button"
                                    className={classNames(
                                      // Selected day styling
                                      day.isSelected && day.isToday ? 'bg-indigo-600 text-white' : '', // Selected and today
                                      day.isSelected && !day.isToday ? 'bg-gray-900 text-white' : '', // Selected but not today

                                      // Today but not selected
                                      !day.isSelected && day.isToday ? 'text-indigo-600 font-semibold' : '',

                                      // Available day styling
                                      !day.isSelected && !day.isToday && availableDates.includes(day.date)
                                        ? 'bg-blue-100 hover:bg-blue-200'
                                        : '',

                                      // Hover effect when not selected and not available
                                      !day.isSelected && !availableDates.includes(day.date) ? 'hover:bg-gray-200' : '',

                                      // Font weight adjustments for selected or today
                                      day.isSelected || day.isToday ? 'font-semibold' : '',

                                      day.isDisabled ? 'text-gray-400' : '',

                                      // Common styling for the button
                                      'mx-auto flex h-8 w-8 items-center justify-center rounded-full',
                                    )}
                                    onClick={() => onDateChange(day.date)}
                                  >
                                    <time dateTime={day.date}>{day.date.split('-').pop()?.replace(/^0/, '')}</time>
                                  </button>
                                )}
                              </div>
                            ))}
                        </div>
                      </div>
                    </div>
                  </PopoverPanel>
                </Transition>
              </Popover>
            </PopoverGroup>
          </div>
        </section>
      </div>
    </div>
  )
}
