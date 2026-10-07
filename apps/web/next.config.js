//@ts-check

// eslint-disable-next-line @typescript-eslint/no-var-requires
const { composePlugins, withNx } = require('@nx/next')
const path = require('path')
const { withSentryConfig } = require('@sentry/nextjs/config')

/**
 * @type {import('@nx/next/plugins/with-nx').WithNxOptions}
 **/
const nextConfig = {
  trailingSlash: true,
  images: { unoptimized: true },
  webpack: config => {
    config.resolve.alias = {
      ...config.resolve.alias,
      '@': path.join(__dirname, 'src'),
      '@components': path.join(__dirname, 'src/app/components'),
      '@lib': path.join(__dirname, 'src/app/lib'),
      '@utils': path.join(__dirname, 'src/app/utils'),
      '@contexts': path.join(__dirname, 'src/app/contexts'),
    }
    return config
  },
}

const plugins = [
  // Add more Next.js plugins to this list if needed.
  withNx,
]

module.exports = withSentryConfig(composePlugins(...plugins)(nextConfig), {
  // For all available options, see:
  // https://www.npmjs.com/package/@sentry/webpack-plugin#options

  org: 'elevation-tech',
  project: 'stansburyswim',

  // Only print logs for uploading source maps in CI
  silent: !process.env.CI,

  // For all available options, see:
  // https://docs.sentry.io/platforms/javascript/guides/nextjs/manual-setup/

  // Upload a larger set of source maps for prettier stack traces (increases build time)
  widenClientFileUpload: true,

  // Uncomment to route browser requests to Sentry through a Next.js rewrite to circumvent ad-blockers.
  // This can increase your server load as well as your hosting bill.
  // Note: Check that the configured route will not match with your Next.js middleware, otherwise reporting of client-
  // side errors will fail.
  // tunnelRoute: "/monitoring",

  // Options below were top-level before Sentry 11. They only apply to webpack builds.
  // https://docs.sentry.io/platforms/javascript/guides/nextjs/configuration/build/
  webpack: {
    // Automatically tree-shake Sentry logger statements to reduce bundle size
    treeshake: { removeDebugLogging: true },

    // Enables automatic instrumentation of Vercel Cron Monitors. (Does not yet work with App Router route handlers.)
    // See the following for more information:
    // https://docs.sentry.io/product/crons/
    // https://vercel.com/docs/cron-jobs
    automaticVercelMonitors: true,
  },
})
