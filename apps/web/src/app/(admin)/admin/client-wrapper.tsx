'use client'

import { UserProvider } from '@/app/contexts/user-context'
import AdminProtectedPage from './components/admin-protected-page'
import { AppProvider } from '@/app/app-provider'
import { CreditsProvider, InstructorsProvider, PoolsProvider } from '@contexts/index'
import { GoogleOAuthProvider } from '@react-oauth/google'
import { MotionConfig } from 'framer-motion'

interface ClientWrapperProps {
  children: React.ReactNode
  googleClientId: string
}

export function ClientWrapper({ children, googleClientId }: ClientWrapperProps) {
  return (
    <GoogleOAuthProvider clientId={googleClientId}>
      <UserProvider>
        <AdminProtectedPage>
          <AppProvider>
            <InstructorsProvider>
              <PoolsProvider>
                <CreditsProvider>
                  {/* Skips the sidebar and navbar indicator animations for people who ask for reduced motion. */}
                  <MotionConfig reducedMotion="user">{children}</MotionConfig>
                </CreditsProvider>
              </PoolsProvider>
            </InstructorsProvider>
          </AppProvider>
        </AdminProtectedPage>
      </UserProvider>
    </GoogleOAuthProvider>
  )
}
