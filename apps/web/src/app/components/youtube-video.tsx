'use client'

import Image from 'next/image'
import { useEffect, useRef, useState } from 'react'
import { preconnect } from 'react-dom'
import { PlayIcon } from '@heroicons/react/24/solid'

const PLAYER_ORIGIN = 'https://www.youtube-nocookie.com'

// Shows the video's thumbnail and loads YouTube's player, about 1 MB of script, only once someone presses play.
// The privacy-enhanced domain keeps YouTube from setting cookies until then.
export function YouTubeVideo({ videoId, title }: { videoId: string; title: string }) {
  const [playing, setPlaying] = useState(false)
  const iframeRef = useRef<HTMLIFrameElement>(null)

  // The button that had focus is gone once the player replaces it, so move focus into the player.
  useEffect(() => {
    if (playing) iframeRef.current?.focus()
  }, [playing])

  // Opening the connection while the pointer or focus is on the button makes playback start sooner.
  const warmUp = () => preconnect(PLAYER_ORIGIN)

  return (
    <div className="relative aspect-video overflow-hidden rounded-2xl bg-gray-900 shadow-xl ring-1 ring-gray-900/10">
      {playing ? (
        <iframe
          ref={iframeRef}
          className="absolute inset-0 size-full"
          src={`${PLAYER_ORIGIN}/embed/${videoId}?autoplay=1&rel=0`}
          title={title}
          allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture; web-share"
          referrerPolicy="strict-origin-when-cross-origin"
          allowFullScreen
        />
      ) : (
        <button
          type="button"
          aria-label={`Play video: ${title}`}
          onClick={() => setPlaying(true)}
          onPointerEnter={warmUp}
          onFocus={warmUp}
          className="group absolute inset-0 size-full cursor-pointer focus-visible:outline-none"
        >
          <Image
            src={`https://i.ytimg.com/vi/${videoId}/maxresdefault.jpg`}
            alt=""
            fill
            sizes="(min-width: 1024px) 56rem, (min-width: 672px) 42rem, 100vw"
            className="object-cover motion-safe:transition-transform motion-safe:duration-500 motion-safe:group-hover:scale-105"
          />
          <span
            aria-hidden="true"
            className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent"
          />
          <span
            aria-hidden="true"
            className="absolute left-1/2 top-1/2 flex size-16 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-[rgb(66,139,202)] shadow-lg ring-4 ring-white/40 motion-safe:transition-transform motion-safe:duration-200 group-hover:ring-white/70 motion-safe:group-hover:scale-110 group-focus-visible:ring-white sm:size-20"
          >
            <PlayIcon className="ml-1 size-8 text-white sm:size-10" />
          </span>
          <span className="absolute bottom-4 left-4 right-4 text-left text-sm font-semibold text-white sm:bottom-6 sm:left-6 sm:text-base">
            {title}
          </span>
          <span
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 rounded-2xl ring-inset group-focus-visible:ring-4 group-focus-visible:ring-indigo-600"
          />
        </button>
      )}
    </div>
  )
}
