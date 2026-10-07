'use client'

import { UserResponseDto } from '@/api'
import { useUser } from '@/app/contexts/user-context'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'

interface AdminProtectedPageProps {
  children: React.ReactNode
}

export default function AdminProtectedPage({ children }: AdminProtectedPageProps) {
  const { user } = useUser()
  const router = useRouter()
  // The user loads asynchronously; until it arrives there is nothing to check.
  const loading = !user

  useEffect(() => {
    if (!user) {
      return
    }

    if (user.role !== UserResponseDto.role.ADMIN && user.role !== UserResponseDto.role.INSTRUCTOR) {
      router.push('/')
    }
  }, [user, router])

  if (loading) {
    return <div>Loading...</div>
  }

  if (user?.role !== UserResponseDto.role.ADMIN && user?.role !== UserResponseDto.role.INSTRUCTOR) {
    return <div>Not authorized</div>
  }

  return <>{children}</>
}
