import Pools from '@components/pools'
import Header from '../components/Header'

export const metadata = { title: 'Pools' }

export default function PoolsPage() {
  return (
    <div>
      <Header title="Pools" />
      <div className="px-6">
        <Pools />
      </div>
    </div>
  )
}
