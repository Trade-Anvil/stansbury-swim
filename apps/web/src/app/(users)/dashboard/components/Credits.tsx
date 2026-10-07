'use client'
import { useCredits } from '@contexts/index'

export default function Credits({ stats }: { stats: { name: string; stat: number }[] }) {
  const { credits } = useCredits()
  // The live balance from the credits context replaces the server-rendered one.
  const currentStats = stats.map(item => (item.name === 'Available lesson credits' ? { ...item, stat: credits } : item))

  return (
    <div className="py-5">
      {/* <h3 className="text-base font-semibold leading-6 text-gray-900">Credit balances</h3> */}
      <dl className="mt-5 grid grid-cols-1 gap-5 sm:grid-cols-3">
        {currentStats.map(item => (
          <div key={item.name} className="overflow-hidden rounded-lg bg-white px-4 py-5 shadow sm:p-6">
            <dt className="truncate text-sm font-medium text-gray-500">{item.name}</dt>
            <dd className="mt-1 text-3xl font-semibold tracking-tight text-gray-900">{item.stat}</dd>
          </div>
        ))}
      </dl>
    </div>
  )
}
