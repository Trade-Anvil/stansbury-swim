'use client'

import { useState, useEffect, useMemo } from 'react'
import SchedulesList from './schedules-list'
import Filter from './filter'
import TimezoneNotice from '@/app/components/timezone-notice'
import { ScheduleService } from '@/services/api/shared/scheduleService'
import { Button } from '@components/button'
import { formatInTimeZone } from 'date-fns-tz'
import { ORG_TIMEZONE } from '@/app/utils/dates'
import { useUser } from '@contexts/user-context'
import { ScheduleResponseDto } from '@/api'
const ITEMS_PER_PAGE = 150

export default function ClientWrapper() {
  const [selectedPool, setSelectedPool] = useState('')
  const [selectedDate, setSelectedDate] = useState(formatInTimeZone(new Date(), ORG_TIMEZONE, 'yyyy-MM-dd'))
  const [schedules, setSchedules] = useState<ScheduleResponseDto[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [currentPage, setCurrentPage] = useState(1)
  const { user } = useUser()
  const [showMySchedule, setShowMySchedule] = useState(true)

  const fetchSchedules = () =>
    ScheduleService.findAll()
      .then(setSchedules)
      .catch(error => console.error('Failed to fetch schedules:', error))
      .finally(() => setIsLoading(false))

  useEffect(() => {
    fetchSchedules()
  }, [])

  // Changing a filter, or the signed-in user, goes back to the first page.
  const changePool = (pool: string) => {
    setSelectedPool(pool)
    setCurrentPage(1)
  }
  const changeDate = (date: string) => {
    setSelectedDate(date)
    setCurrentPage(1)
  }
  const changeShowMySchedule = (show: boolean) => {
    setShowMySchedule(show)
    setCurrentPage(1)
  }
  const [pagedForUser, setPagedForUser] = useState(user)
  if (pagedForUser !== user) {
    setPagedForUser(user)
    setCurrentPage(1)
  }

  // Filter schedules based on selected filters
  const filteredSchedules = useMemo(() => {
    return schedules.filter(schedule => {
      // Filter by pool
      if (selectedPool && schedule.poolId !== selectedPool) {
        return false
      }

      // Filter by instructor only if showMySchedule is true
      if (showMySchedule && schedule.instructorId !== user?.instructorId) {
        return false
      }

      // Filter by date - only apply if a date is selected.
      // Compare calendar dates in the pool's timezone so the day a lesson falls on
      // does not shift with the viewer's device timezone.
      if (selectedDate) {
        const scheduleDate = formatInTimeZone(new Date(schedule.startDateTime), ORG_TIMEZONE, 'yyyy-MM-dd')

        if (scheduleDate !== selectedDate) {
          return false
        }
      }

      return true
    })
  }, [schedules, selectedPool, selectedDate, user, showMySchedule])

  // Calculate pagination
  const totalPages = Math.ceil(filteredSchedules.length / ITEMS_PER_PAGE)
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE
  const endIndex = startIndex + ITEMS_PER_PAGE

  const paginatedSchedules = filteredSchedules.slice(startIndex, endIndex)

  if (isLoading) {
    return <div>Loading...</div>
  }

  return (
    <>
      <div className="mt-6">
        <TimezoneNotice />
        <Filter
          onPoolChange={changePool}
          onDateChange={changeDate}
          selectedPool={selectedPool}
          selectedDate={selectedDate}
          showMySchedule={showMySchedule}
          onShowMyScheduleChange={changeShowMySchedule}
        />
      </div>

      <SchedulesList schedules={paginatedSchedules} onDelete={fetchSchedules} />

      {/* Pagination controls */}
      {totalPages > 1 && (
        <div className="mt-4 flex items-center justify-between">
          <div className="text-sm text-gray-700">
            Showing {startIndex + 1} to {Math.min(endIndex, filteredSchedules.length)} of {filteredSchedules.length}{' '}
            results
          </div>
          <div className="flex gap-2">
            <Button onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))} disabled={currentPage === 1}>
              Previous
            </Button>
            <Button
              onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
              disabled={currentPage === totalPages}
            >
              Next
            </Button>
          </div>
        </div>
      )}
    </>
  )
}
