'use client'
import { useSyncExternalStore } from 'react'
import { ORG_TIMEZONE } from '@/app/utils/dates'

// The device timezone never changes while the page is open, so there is nothing to subscribe to.
const subscribe = () => () => {
  // nothing to unsubscribe from
}
const getViewerTimeZone = () => Intl.DateTimeFormat().resolvedOptions().timeZone
const getServerTimeZone = () => null

// Names the viewer's timezone the way a person would say it, for example
// 'Eastern Time' rather than 'America/New_York'.
function describeTimeZone(timeZone: string) {
  const parts = new Intl.DateTimeFormat('en-US', { timeZone, timeZoneName: 'longGeneric' }).formatToParts(new Date())
  return parts.find(part => part.type === 'timeZoneName')?.value
}

/**
 * Warns a viewer whose device is set outside the pool's timezone that the times
 * on the page are pool time and must not be converted. Renders nothing for
 * viewers already in the pool's timezone.
 */
export default function TimezoneNotice() {
  // The viewer's timezone is only knowable after hydration, so this stays null
  // for the server render and the first client render.
  const viewerTimeZone = useSyncExternalStore<string | null>(subscribe, getViewerTimeZone, getServerTimeZone)

  if (!viewerTimeZone || viewerTimeZone === ORG_TIMEZONE) {
    return null
  }

  const viewerLabel = describeTimeZone(viewerTimeZone)

  return (
    <div
      role="status"
      className="mb-4 rounded-md bg-amber-50 px-4 py-3 text-sm text-amber-800 dark:bg-amber-950 dark:text-amber-200"
    >
      <p className="font-semibold">
        {viewerLabel ? `Your device is set to ${viewerLabel}.` : 'Your device is set to a different timezone.'}
      </p>
      <p className="mt-1">
        Every lesson time on this page is shown in Mountain Time, the time at the pool. These are the times to show up.
        Do not convert them.
      </p>
    </div>
  )
}
