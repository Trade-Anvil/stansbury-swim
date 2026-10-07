'use client'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import React, { useSyncExternalStore } from 'react'
import { ReactNode, useState } from 'react'
import { persistQueryClient, PersistQueryClientProvider } from '@tanstack/react-query-persist-client'
import { createSyncStoragePersister } from '@tanstack/query-sync-storage-persister'

interface AppProviderProps {
  children: ReactNode
}

type Persister = ReturnType<typeof createSyncStoragePersister>

// localStorage only exists in the browser, so the server render and hydration get no persister and the
// client switches to one right after. Created once so every read returns the same object.
let browserPersister: Persister | undefined
const subscribe = () => () => {
  // nothing to unsubscribe from
}
const getBrowserPersister = () => (browserPersister ??= createSyncStoragePersister({ storage: window.localStorage }))
const getServerPersister = () => null

export const AppProvider = ({ children }: AppProviderProps) => {
  const persister = useSyncExternalStore<Persister | null>(subscribe, getBrowserPersister, getServerPersister)

  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 1000 * 60 * 5, // Cache data for 5 minutes
            gcTime: 1000 * 60 * 10, // Keep cache for 10 minutes
          },
        },
      }),
  )

  if (persister) {
    persistQueryClient({
      queryClient,
      persister,
    })
  }

  if (!persister) {
    return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  }
  return (
    <PersistQueryClientProvider client={queryClient} persistOptions={{ persister }}>
      {children}
    </PersistQueryClientProvider>
  )
}
