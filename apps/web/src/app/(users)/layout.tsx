import { GoogleOAuthProvider } from '@react-oauth/google'
import '../global.css'
import Footer from '../components/footer'
import { Analytics } from '@vercel/analytics/next'
import { SpeedInsights } from '@vercel/speed-insights/next'
import { UserProvider } from '../contexts/user-context'
import { ImpersonationBanner } from '../components/impersonation-banner'
import { EmailVerificationBanner } from '../components/email-verification-banner'

export const metadata = {
  title: 'Stansbury Swim',
  description: '',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <GoogleOAuthProvider clientId={process.env.GOOGLE_CLIENT_ID || ''}>
      <UserProvider>
        <Analytics />
        <SpeedInsights />
        <html lang="en" className="h-full bg-white">
          <head>
            <link rel="stylesheet" href="https://rsms.me/inter/inter.css" />
          </head>
          <body className="h-full">
            <ImpersonationBanner />
            <EmailVerificationBanner />
            <div className="bg-white flex min-h-screen flex-col">
              <main className="flex-grow">{children}</main>
              <Footer />
            </div>
          </body>
        </html>
      </UserProvider>
    </GoogleOAuthProvider>
  )
}
