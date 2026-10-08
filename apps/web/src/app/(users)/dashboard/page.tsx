export const dynamic = 'force-dynamic'

export const metadata = { title: 'Dashboard' }

import { TransactionsService } from '@/services/api/shared/transactionsService'
import Credits from './components/Credits'
import UpcomingLessons from './components/UpcomingLessons'
import styles from './page.module.css'
import { ScheduleService } from '@/services/api/shared/scheduleService'
import { PoolService } from '@/services/api/shared/poolService'
import { InstructorService } from '@/services/api/shared/instructorService'
import Header from './components/Header'
import { ApiError } from '@/api/core/ApiError'
import { redirect } from 'next/navigation'
import { PoolDto, ScheduleResponseDto, InstructorResponseDto } from '@/api'

export default async function Index() {
  // catch errors and redirect to sign-in if they are 401
  let credits = 0
  let schedules: ScheduleResponseDto[] = []
  let pools: PoolDto[] = []
  let instructors: InstructorResponseDto[] = []
  try {
    const response = await TransactionsService.getMyCreditBalance()
    credits = response.balances.find((b: any) => b.creditType === 'private')?.balance ?? 0
    schedules = await ScheduleService.findMySchedule()
    pools = await PoolService.findAll()
    instructors = await InstructorService.findAll()
  } catch (error) {
    if (error instanceof ApiError && error.status === 401) {
      redirect('/sign-in')
    } else {
      throw error
    }
  }

  const stats = [
    {
      name: 'Available lesson credits',
      stat: credits,
    },
    { name: 'Lessons scheduled', stat: schedules.length },
  ]

  return (
    <div>
      <Header title="Dashboard" />
      <div className="px-6">
        <div className="mx-auto max-w-7xl sm:px-6 lg:px-8">
          <div className={styles.page}>
            <Credits stats={stats} />
            <UpcomingLessons instructors={instructors} pools={pools} />
          </div>
        </div>
      </div>
    </div>
  )
}
