'use client'
import { createContext, useContext, useEffect, useState } from 'react'
import { TransactionsService } from '@/services/api/shared/transactionsService'

interface CreditsContextType {
  credits: number
  refreshCredits: () => void
}

const CreditsContext = createContext<CreditsContextType | null>(null)

const loadPrivateCredits = async () => {
  const response = await TransactionsService.getMyCreditBalance()
  return response.balances.find((b: any) => b.creditType === 'private')?.balance ?? 0
}

export const CreditsProvider = ({ children }: { children: React.ReactNode }) => {
  const [credits, setCredits] = useState(0)

  const fetchCredits = () => loadPrivateCredits().then(setCredits)

  useEffect(() => {
    loadPrivateCredits().then(setCredits)
  }, [])

  return <CreditsContext.Provider value={{ credits, refreshCredits: fetchCredits }}>{children}</CreditsContext.Provider>
}

export const useCredits = () => {
  const context = useContext(CreditsContext)
  if (!context) {
    throw new Error('useCredits must be used within a CreditsProvider')
  }
  return context
}
