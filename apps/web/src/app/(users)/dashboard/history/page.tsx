'use client'
import { CalendarIcon, CreditCardIcon } from '@heroicons/react/20/solid'
import { useEffect, useState } from 'react'
import { TransactionsService } from '@/services/api/shared/transactionsService'
import { ProductService } from '@/services/api/shared/productService'
import { StudentService } from '@/services/api/shared/studentService'
import { ScheduleService } from '@/services/api/shared/scheduleService'
import { InstructorResponseDto, PoolDto, ProductResponseDto, ScheduleResponseDto, StudentResponseDto } from '@/api'
import { TransactionResponseDto } from '@/api'
import { PoolService } from '@/services/api/shared/poolService'
import { InstructorService } from '@/services/api/shared/instructorService'
import Header from '../components/Header'
import { formatDateTime } from '@/app/utils/dates'

function classNames(...classes: string[]) {
  return classes.filter(Boolean).join(' ')
}

export default function History() {
  const [transactions, setTransactions] = useState([] as TransactionResponseDto[])
  const [products, setProducts] = useState([] as ProductResponseDto[])
  const [students, setStudents] = useState([] as StudentResponseDto[])
  const [schedules, setSchedules] = useState([] as ScheduleResponseDto[])

  const [pools, setPools] = useState([] as PoolDto[])
  const [instructors, setInstructors] = useState([] as InstructorResponseDto[])

  useEffect(() => {
    TransactionsService.findMy()
      .then(async transactions => {
        // sort by created at descending
        transactions.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        setTransactions(transactions)

        const scheduleIds = transactions.filter(t => t.scheduleId).map(t => t.scheduleId)
        const uniqueScheduleIds = Array.from(new Set(scheduleIds))
        const queryString = uniqueScheduleIds.map(id => id).join(',')
        const schedules = queryString ? await ScheduleService.findAll() : []
        setSchedules(schedules.filter(s => uniqueScheduleIds.includes(s.id)))
      })
      .catch((err: any) => console.error(err))

    ProductService.findAll()
      .then(setProducts)
      .catch((err: any) => console.error(err))

    StudentService.findMyStudents()
      .then(setStudents)
      .catch((err: any) => console.error(err))

    PoolService.findAll().then(setPools)
    InstructorService.findAll().then(setInstructors)
  }, [])

  return (
    <>
      <Header title="History" />
      <div className="py-10">
        <div className="px-6">
          <div className="mx-auto max-w-7xl sm:px-6 lg:px-8 py-10">
            {transactions.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20">
                <span className="text-4xl mb-4" aria-hidden="true">
                  🕰️
                </span>
                <h2 className="text-xl font-semibold mb-2">No history yet</h2>
                <p className="text-gray-500 text-center max-w-md">
                  You haven't made any transactions or scheduled any lessons yet. When you do, your history will appear
                  here.
                </p>
              </div>
            ) : (
              <ul role="list" className="-mb-8">
                {transactions.map((transaction, transactionIdx) => {
                  const schedule = schedules.find(s => s.id === transaction.scheduleId)
                  const product = products.find(p => p.id === transaction.productId)
                  const student = students.find(s => s.id === transaction.studentId)
                  const pool = pools.find(p => p.id === schedule?.poolId)
                  const iconBackground =
                    transaction.transactionType === 'PURCHASE_CREDITS'
                      ? 'bg-green-500'
                      : transaction.transactionType === 'CANCEL_REGISTRATION'
                        ? 'bg-red-400'
                        : 'bg-blue-500'
                  const Icon =
                    transaction.transactionType === 'PURCHASE_CREDITS' ? (
                      <CreditCardIcon className="h-5 w-5 text-white" aria-hidden="true" />
                    ) : (
                      <CalendarIcon className="h-5 w-5 text-white" aria-hidden="true" />
                    )

                  const content =
                    transaction.transactionType === 'PURCHASE_CREDITS'
                      ? 'Purchased'
                      : transaction.transactionType == 'CANCEL_REGISTRATION'
                        ? 'Canceled lesson for'
                        : 'Scheduled lesson for'
                  const target =
                    transaction.transactionType === 'PURCHASE_CREDITS'
                      ? `${transaction.credits} credits`
                      : student?.name
                  let details: string | null = null
                  if (
                    transaction.transactionType == 'REGISTER' ||
                    transaction.transactionType == 'CANCEL_REGISTRATION'
                  ) {
                    const startTimeFormatted = schedule ? formatDateTime(schedule.startDateTime) : ''
                    details = ` with ${instructors.find(i => i.id === schedule?.instructorId)?.name} at ${pool?.name} on ${startTimeFormatted}`
                  }

                  const transactionDateFormatted = new Date(transaction.createdAt).toLocaleString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric',
                    hour: 'numeric',
                    minute: 'numeric',
                    hour12: true,
                  })

                  return (
                    <li key={transaction.id}>
                      <div className="relative pb-8">
                        {transactionIdx !== transactions.length - 1 ? (
                          <span className="absolute left-4 top-4 -ml-px h-full w-0.5 bg-gray-200" aria-hidden="true" />
                        ) : null}
                        <div className="relative flex space-x-3">
                          <div>
                            <span
                              className={classNames(
                                iconBackground,
                                'h-8 w-8 rounded-full flex items-center justify-center ring-8 ring-white',
                              )}
                            >
                              {Icon}
                            </span>
                          </div>
                          <div className="flex min-w-0 flex-1 justify-between space-x-4 pt-1.5">
                            <div>
                              <p className="text-sm text-gray-500">
                                {content} <span className="font-medium text-gray-900">{target}</span>
                              </p>
                              {details && <p className="text-sm text-gray-500">{details}</p>}
                            </div>
                            <div className="whitespace-nowrap text-right text-sm text-gray-500">
                              <time dateTime={transaction.createdAt}>{transactionDateFormatted}</time>
                            </div>
                          </div>
                        </div>
                      </div>
                    </li>
                  )
                })}
              </ul>
            )}
          </div>
        </div>
      </div>
    </>
  )
}
