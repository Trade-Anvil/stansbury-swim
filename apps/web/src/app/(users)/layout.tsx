import { GoogleOAuthProvider } from '@react-oauth/google'
import '../global.css'
import Footer from '../components/footer'
import { Analytics } from '@vercel/analytics/next'
import { SpeedInsights } from '@vercel/speed-insights/next'
import { UserProvider } from '../contexts/user-context'
import { ImpersonationBanner } from '../components/impersonation-banner'
import { EmailVerificationBanner } from '../components/email-verification-banner'

export const metadata = {
  title: { default: 'Stansbury Swim', template: '%s | Stansbury Swim' },
  description:
    'Private one-on-one swim lessons for kids ages 3 to 10, in warm-water pools in Stansbury Park and Grantsville, Utah.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <GoogleOAuthProvider clientId={process.env.GOOGLE_CLIENT_ID || ''}>
      <UserProvider>
        <html lang="en" className="h-full bg-white">
          <head>
            <link rel="stylesheet" href="https://rsms.me/inter/inter.css" />
          </head>
          <body className="h-full">
            <a
              href="#main"
              className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[100] focus:rounded-md focus:bg-white focus:px-4 focus:py-2 focus:text-sm focus:font-semibold focus:text-gray-900 focus:shadow-lg focus:ring-2 focus:ring-indigo-600"
            >
              Skip to content
            </a>
            <Analytics />
            <SpeedInsights />
            <ImpersonationBanner />
            <EmailVerificationBanner />
            <div className="bg-white flex min-h-screen flex-col">
              {/* Each page renders its own <main id="main">, so the home page's site header can sit outside it. */}
              <div className="flex-grow">{children}</div>
              <Footer />
            </div>
          </body>
        </html>
      </UserProvider>
    </GoogleOAuthProvider>
  )
}
