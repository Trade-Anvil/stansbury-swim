import Image from 'next/image'
import { PoolService } from '@/services/api/shared/poolService'
import { isStoredImage } from '@/app/utils/images'

export default async function Pools() {
  const pools = await PoolService.findAll()

  return (
    <div id="pools" className="scroll-mt-24 bg-white py-12 md:py-10 lg:py-10">
      <div className="mx-auto grid max-w-7xl grid-cols-1 gap-x-8 gap-y-20 px-6 lg:px-8 xl:grid-cols-3">
        <div className="mx-auto max-w-2xl lg:mx-0">
          <h2 className="text-2xl font-bold tracking-tight text-gray-900 sm:text-3xl">Our Pools</h2>
          <p className="mt-6 text-lg leading-8 text-gray-600">
            We have four pools in Stansbury Park and Grantsville. Each pool is unique and offers a different experience
            for our swimmers.
          </p>
        </div>
        <ul
          role="list"
          className="mx-auto grid max-w-2xl grid-cols-1 gap-x-6 gap-y-20 sm:grid-cols-2 lg:mx-0 lg:max-w-none lg:gap-x-8 xl:col-span-2"
        >
          {pools.map(pool => (
            <li key={pool.name}>
              {isStoredImage(pool.imageUrl) ? (
                <Image
                  className="aspect-[3/2] w-full rounded-2xl object-cover"
                  src={pool.imageUrl}
                  alt={`Photo of ${pool.name}`}
                  width={1200}
                  height={800}
                  sizes="(min-width: 1280px) 25rem, (min-width: 640px) 50vw, 100vw"
                />
              ) : (
                <div className="aspect-[3/2] w-full rounded-2xl bg-gray-100" />
              )}
              <h3 className="mt-6 text-lg font-semibold leading-8 text-gray-900">{pool.name}</h3>
              <p className="text-base leading-7 text-gray-600">{pool.address}</p>
              <p className="mt-4 text-base leading-7 text-gray-600">{pool.details}</p>
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}
