'use client'
import { useSyncExternalStore } from 'react'
import { formatDateTime, ORG_TIMEZONE } from '@/app/utils/dates'

// The device timezone never changes while the page is open, so there is nothing to subscribe to.
const subscribe = () => () => {
  // nothing to unsubscribe from
}
const getViewerTimeZone = () => Intl.DateTimeFormat().resolvedOptions().timeZone
const getServerTimeZone = () => null

/**
 * Renders a lesson time in the pool's timezone.
 *
 * Pass alwaysShowTimeZone on views where the reader has to act on the time, so
 * the 'MT' label is present for everyone rather than appearing only for viewers
 * who happen to be travelling. A label that comes and goes teaches nobody what
 * it means.
 */
export default function Time({
  dateTime,
  alwaysShowTimeZone = false,
}: {
  dateTime: string
  alwaysShowTimeZone?: boolean
}) {
  // The viewer's timezone is only knowable after hydration, so this stays null
  // for the server render and the first client render.
  const viewerTimeZone = useSyncExternalStore<string | null>(subscribe, getViewerTimeZone, getServerTimeZone)

  // Viewers outside the pool's timezone always get the label so they don't read
  // the time as local.
  const showTimeZone = alwaysShowTimeZone || (viewerTimeZone !== null && viewerTimeZone !== ORG_TIMEZONE)

  // 'shortGeneric' renders 'MT' rather than 'MDT'/'MST', which stays the same
  // year round and avoids daylight-saving jargon.
  const options: Intl.DateTimeFormatOptions = showTimeZone ? { timeZoneName: 'shortGeneric' } : {}

  return <time dateTime={dateTime}>{formatDateTime(dateTime, options)}</time>
}
