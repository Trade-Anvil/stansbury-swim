import Image from 'next/image'
import { AnnouncementService } from '@/services/api/shared/announcementService'
import { ScheduleService } from '@/services/api/shared/scheduleService'
import { InstructorService } from '@/services/api/shared/instructorService'
import { PoolService } from '@/services/api/shared/poolService'
import Time from './time'
import { isStoredImage } from '@/app/utils/images'

export default async function ParentTot() {
  const [announcement, schedules, instructors, pools] = await Promise.all([
    AnnouncementService.findOne(),
    ScheduleService.findParentTot(),
    InstructorService.findAll(),
    PoolService.findAll(),
  ])

  return (
    <div id="announcement" className="bg-white py-12 md:py-10 lg:py-10">
      <div className="mx-auto grid max-w-7xl grid-cols-1 gap-x-8 gap-y-20 px-6 lg:px-8 xl:grid-cols-3">
        <div className="mx-auto max-w-2xl lg:mx-0">
          <h2 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">{announcement?.heading}</h2>
          <p className="mt-6 text-lg leading-8 text-gray-600">{announcement?.content}</p>
        </div>
        <div>
          <h3 className="text-xl font-semibold tracking-tight text-gray-900">Upcoming Group Lessons</h3>
          {schedules && schedules.length > 0 ? (
            <ol className="mt-4 space-y-1 text-sm leading-6 text-gray-500">
              {schedules.map(schedule => {
                const instructor = instructors.find(instructor => instructor.id === schedule.instructorId)
                const pool = pools.find(pool => pool.id === schedule.poolId)
                const name = `${instructor?.name ?? 'Private instructor'} at ${pool?.name}`

                return (
                  <li
                    key={schedule.id}
                    className="group flex items-center space-x-4 rounded-xl px-4 py-2 focus-within:bg-gray-100 hover:bg-gray-100"
                  >
                    <a href="/dashboard/purchase" className="flex-auto">
                      {isStoredImage(instructor?.imageUrl) ? (
                        <Image
                          src={instructor.imageUrl}
                          alt=""
                          width={40}
                          height={40}
                          className="h-10 w-10 flex-none rounded-full object-cover"
                        />
                      ) : (
                        <div className="h-10 w-10 flex-none rounded-full bg-gray-100" />
                      )}
                      <div className="flex-auto">
                        <p className="text-gray-900">{name}</p>
                        <p className="mt-0.5">
                          <Time dateTime={schedule.startDateTime} />- <Time dateTime={schedule.endDateTime} />
                        </p>
                        <p className="mt-0.5">{schedule.spotsAvailable} spots left</p>
                      </div>
                    </a>
                  </li>
                )
              })}
            </ol>
          ) : (
            <p className="mt-4 text-sm leading-6 text-gray-500">
              No group lessons are available to book right now. Check back soon!
            </p>
          )}
        </div>
      </div>
    </div>
  )
}
