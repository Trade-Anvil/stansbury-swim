'use client'
import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react'
import * as Sentry from '@sentry/nextjs'
import { UserResponseDto, ApiError, AuthenticationService } from '@/api'
import { MeService } from '@/services/api/shared/meService'
import { jwtDecode } from 'jwt-decode'
import { redirect, usePathname } from 'next/navigation'

const PUBLIC_PATHS = [
  '/',
  '/sign-in',
  '/register',
  '/forgot-password',
  '/reset-password',
  '/privacy-policy',
  '/terms-of-service',
]

interface Impersonator {
  id: string
  name: string
}

export interface UserContextType {
  user: UserResponseDto | null
  isLoading: boolean
  error: Error | null
  refreshUser: () => void
  isImpersonating: boolean
  impersonator: Impersonator | null
  exitImpersonation: () => void
}

const UserContext = createContext<UserContextType | null>(null)

interface UserProviderProps {
  children: ReactNode
}

export const UserProvider = ({ children }: UserProviderProps) => {
  const [user, setUser] = useState<UserResponseDto | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)
  const [isImpersonating, setIsImpersonating] = useState(false)
  const [impersonator, setImpersonator] = useState<Impersonator | null>(null)
  const pathname = usePathname()

  const normalizedPath = pathname.length > 1 && pathname.endsWith('/') ? pathname.slice(0, -1) : pathname
  const isPublicPath = PUBLIC_PATHS.includes(normalizedPath)

  // Reads the stored session and loads the user.
  const readSessionAndFetchUser = useCallback(async () => {
    try {
      const user = localStorage.getItem('user')
      const token = user ? JSON.parse(user).accessToken : null

      // Don't fetch user details on public pages if no token
      if (!token && isPublicPath) {
        setUser(null)
        return
      }

      if (token) {
        const decodedToken: any = jwtDecode(token)
        if (decodedToken.impersonatorId) {
          setIsImpersonating(true)
          const adminUser = localStorage.getItem('adminUser')
          const adminUserObj = adminUser ? JSON.parse(adminUser) : null

          if (adminUserObj) {
            setImpersonator({ id: adminUserObj.id, name: adminUserObj.name })
          }
        } else {
          setIsImpersonating(false)
          setImpersonator(null)
        }
      }

      const response = await MeService.findMe()
      if (response) {
        setUser(response)
      } else {
        const err = new Error('Failed to fetch user details (empty response)')
        console.error(err.message)
        Sentry.captureException(err, { tags: { context: 'user-context.fetchUserDetails' } })
        setUser(null)
        setError(err)
      }
    } catch (error) {
      if (error instanceof ApiError && error.status === 401) {
        console.error('User is not authenticated')
        setUser(null)
        // Only redirect to sign-in on protected pages
        if (!isPublicPath) {
          redirect('/sign-in')
        }
      } else {
        console.error('Error fetching user details:', error)
        // Non-401 fetch failures previously failed silently and left the
        // dashboard in a permanently-disabled state with no surfaced reason.
        Sentry.captureException(error, { tags: { context: 'user-context.fetchUserDetails' } })
        setError(error instanceof Error ? error : new Error(String(error)))
      }
    } finally {
      setIsLoading(false)
    }
  }, [isPublicPath])

  // Every state update happens in a promise callback, after the effect that starts the load has returned,
  // so loading the user never triggers a synchronous re-render.
  const loadUserDetails = useCallback(() => Promise.resolve().then(readSessionAndFetchUser), [readSessionAndFetchUser])

  // Refresh after a change (sign-in, profile save, waiver): show the loading state, then reload.
  const fetchUserDetails = useCallback(() => {
    setIsLoading(true)
    setError(null)
    return loadUserDetails()
  }, [loadUserDetails])

  // Moving between public and protected pages reloads the user below, so show the loading state again.
  // Done during render rather than in an effect, per https://react.dev/learn/you-might-not-need-an-effect
  const [loadedForPublicPath, setLoadedForPublicPath] = useState(isPublicPath)
  if (loadedForPublicPath !== isPublicPath) {
    setLoadedForPublicPath(isPublicPath)
    setIsLoading(true)
    setError(null)
  }

  useEffect(() => {
    loadUserDetails()
  }, [loadUserDetails])

  const exitImpersonation = async () => {
    try {
      const adminUser = await AuthenticationService.authenticationControllerExitImpersonation()
      localStorage.setItem('user', JSON.stringify(adminUser))
      setUser(adminUser)
      setIsImpersonating(false)
      setImpersonator(null)
      localStorage.removeItem('adminUser')
      window.location.href = '/dashboard'
    } catch (error) {
      console.error('Error exiting impersonation:', error)
      Sentry.captureException(error, { tags: { context: 'user-context.exitImpersonation' } })
    }
  }

  return (
    <UserContext.Provider
      value={{
        user,
        isLoading,
        error,
        refreshUser: fetchUserDetails,
        isImpersonating,
        impersonator,
        exitImpersonation,
      }}
    >
      {children}
    </UserContext.Provider>
  )
}

export const useUser = () => {
  const context = useContext(UserContext)
  if (!context) {
    throw new Error('useUser must be used within a UserContext')
  }
  return context
}
