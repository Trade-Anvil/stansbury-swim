import { Suspense } from 'react'
import { VerifyEmailClient } from './verify-email-client'

// Nothing here is prerenderable: the page exists to read a token off the query string and
// redeem it. Rendering on demand also keeps useSearchParams out of the static export path.
export const dynamic = 'force-dynamic'

export const metadata = { title: 'Verify email' }

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={<div className="px-6 py-12 text-center text-sm text-gray-600">Loading...</div>}>
      <VerifyEmailClient />
    </Suspense>
  )
}
