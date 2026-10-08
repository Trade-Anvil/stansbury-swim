'use client'
import { useState } from 'react'
import { useUser } from '@/app/contexts/user-context'
import { AuthService } from '@/services/api/shared/authService'

export const EmailVerificationBanner = () => {
  const { user } = useUser()
  const [sent, setSent] = useState(false)
  const [sending, setSending] = useState(false)

  if (!user) {
    return null
  }

  // Accounts created before verification existed come back with the flag absent, which the
  // API reports as verified. Only a genuine `false` or a staged address raises this.
  const unverified = user.emailVerified === false
  const pending = user.pendingEmail

  if (!unverified && !pending) {
    return null
  }

  const handleResend = async () => {
    setSending(true)
    try {
      await AuthService.resendVerification()
      setSent(true)
    } catch {
      setSent(false)
    } finally {
      setSending(false)
    }
  }

  return (
    <div className="bg-amber-100 border-b border-amber-300 px-4 py-2 text-sm text-amber-900">
      <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-center gap-2 text-center">
        <span>
          {pending
            ? `Confirm ${pending} to finish changing your email address. Until then we'll keep sending to ${user.email}.`
            : `Please confirm ${user.email} so your lesson reminders reach you.`}
        </span>
        {/* Always mounted so screen readers announce the confirmation when it appears. */}
        <span role="status">{sent && <span className="font-semibold">Sent, check your inbox.</span>}</span>
        {!sent && (
          <button
            type="button"
            onClick={handleResend}
            disabled={sending}
            className="font-semibold underline underline-offset-2 disabled:opacity-60"
          >
            {sending ? 'Sending...' : 'Resend the link'}
          </button>
        )}
      </div>
    </div>
  )
}
