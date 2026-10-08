export const dynamic = 'force-dynamic'

import PurchaseClient from '../components/PurchaseClient'
import { ProductService } from '@/services/api/shared/productService'
import { ScheduleService } from '@/services/api/shared/scheduleService'
import { StudentService } from '@/services/api/shared/studentService'
import { ConfigService } from '@/services/api/shared/configService'
import { WaitlistService } from '@/services/api/shared/waitlistService'
import { PoolService } from '@/services/api/shared/poolService'

export const metadata = { title: 'Purchase lessons' }

export default async function PurchasePage() {
  // Fetch all required data on the server
  const [products, schedules, students, config, waitlist, pools] = await Promise.all([
    ProductService.findAll(),
    ScheduleService.findParentTot(),
    StudentService.findMyStudents(),
    ConfigService.findOne(),
    WaitlistService.me().catch(() => null),
    PoolService.findAll(),
  ])

  // `config.waitlistEnabled` is the authoritative gate. The previous logic
  // applied `!waitlist.allowed` unconditionally, which meant a stale waitlist
  // record from a prior season (when waitlistEnabled was on) would silently
  // disable purchasing even after the admin turned the waitlist off — and
  // without firing the waitlist banner, since that banner only renders when
  // waitlistEnabled is true. Treat the record as relevant ONLY while gating
  // is active.
  const purchaseEnabled = config.waitlistEnabled ? !!(waitlist && waitlist.allowed) : true

  return (
    <PurchaseClient
      products={products}
      schedules={schedules}
      students={students}
      waitlistEnabled={config.waitlistEnabled}
      onWaitlist={!!waitlist}
      purchaseEnabled={purchaseEnabled}
      pools={pools}
      paypalClientId={process.env.PAYPAL_CLIENT_ID || ''}
    />
  )
}
