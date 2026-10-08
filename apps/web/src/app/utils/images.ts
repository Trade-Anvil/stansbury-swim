// Only images from our Vercel Blob store (stansbury-swim-images) go through next/image optimization
// (images.remotePatterns in next.config.js). Anything else renders as a placeholder on the public site, so a stale
// URL can never pull in content from a storage bucket we no longer control.
const STORED_IMAGE_PREFIX = 'https://whembj0sslpokn6t.public.blob.vercel-storage.com/'

export function isStoredImage(url?: string | null): url is string {
  return !!url && url.startsWith(STORED_IMAGE_PREFIX)
}
