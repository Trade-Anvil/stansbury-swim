//@ts-check

const { withSentryConfig } = require('@sentry/nextjs/config')

// Plain config: Nx deprecated withNx/composePlugins, and Next transpiles the workspace library itself
// (https://nx.dev/docs/technologies/react/next/guides/next-config-setup). Path aliases come from the
// "paths" in tsconfig.json, which both Turbopack and webpack read.
/** @type {import('next').NextConfig} */
const nextConfig = {
  trailingSlash: true,
  images: {
    // Instructor and pool photos are uploaded to the stansbury-swim-images Vercel Blob store under unique file names
    // that are never overwritten, so optimized copies can be cached for a long time. Keep this in sync with
    // STORED_IMAGE_PREFIX in src/app/utils/images.ts.
    // https://nextjs.org/docs/app/api-reference/components/image#remotepatterns
    remotePatterns: [
      new URL('https://whembj0sslpokn6t.public.blob.vercel-storage.com/**'),
      // Poster frames for the YouTube video on the home page (components/youtube-video.tsx).
      new URL('https://i.ytimg.com/vi/**'),
    ],
    minimumCacheTTL: 2678400, // 31 days
  },
  compiler: {
    // Strips the Sentry SDK's debug logging from the bundle. Sentry's own treeshake option is webpack-only and
    // builds use Turbopack, so set the flag directly. Must be the boolean false: Next JSON-encodes these values,
    // and the string 'false' would be truthy.
    // https://docs.sentry.io/platforms/javascript/configuration/tree-shaking/
    define: { __SENTRY_DEBUG__: false },
  },
}

module.exports = withSentryConfig(nextConfig, {
  // For all available options, see:
  // https://docs.sentry.io/platforms/javascript/guides/nextjs/configuration/build/

  org: 'elevation-tech',
  project: 'stansburyswim',

  // Only print logs for uploading source maps in CI
  silent: !process.env.CI,

  // Upload a larger set of source maps for prettier stack traces (increases build time)
  widenClientFileUpload: true,

  // Uncomment to route browser requests to Sentry through a Next.js rewrite to circumvent ad-blockers.
  // This can increase your server load as well as your hosting bill.
  // Note: Check that the configured route will not match with your Next.js proxy, otherwise reporting of client-
  // side errors will fail.
  // tunnelRoute: "/monitoring",

  _experimental: {
    // Creates Sentry cron monitors for Vercel Cron Jobs in vercel.json. Replaces webpack.automaticVercelMonitors,
    // which does nothing under Turbopack. There are no cron jobs configured today.
    vercelCronsMonitoring: true,
  },
})
