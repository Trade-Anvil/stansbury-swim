import { unstable_cache } from 'next/cache'
import { AnnouncementService } from '@/services/api/shared/announcementService'
import { InstructorService } from '@/services/api/shared/instructorService'
import { PoolService } from '@/services/api/shared/poolService'
import { ProductService } from '@/services/api/shared/productService'
import { ScheduleService } from '@/services/api/shared/scheduleService'

// Home page data, cached so the page keeps working when the API or database is down. Next serves the last good
// copy while a refresh fails (see unstable_cache in node_modules/next). Returns null only when the API is down
// and nothing is cached yet, for example right after a deploy. The catch sits outside the cache so a failure is
// never stored. Admin edits show on the home page within REVALIDATE_SECONDS.
// shortcut: unstable_cache is superseded by 'use cache' in Next 16, switch when the app turns on cacheComponents.
const REVALIDATE_SECONDS = 60

function cached<T>(key: string, fetcher: () => Promise<T>): () => Promise<T | null> {
  const get = unstable_cache(fetcher, ['public-data', key], { revalidate: REVALIDATE_SECONDS })
  return () =>
    get().catch(error => {
      console.error(`Failed to load ${key} for the home page:`, error)
      return null
    })
}

export const getAnnouncement = cached('announcement', () => AnnouncementService.findOne())
export const getInstructors = cached('instructors', () => InstructorService.findAll())
export const getPools = cached('pools', () => PoolService.findAll())
export const getProducts = cached('products', () => ProductService.findAll())
export const getParentTotSchedules = cached('parent-tot-schedules', () => ScheduleService.findParentTot())
