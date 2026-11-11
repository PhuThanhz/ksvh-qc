import type { QueryClient } from '@tanstack/react-query'
import { RouterProvider } from 'react-router'
import { AppProviders } from '@/app/providers/AppProviders'
import { AuthBootstrap } from '@/app/providers/AuthBootstrap'
import { router } from '@/app/router/router'

export function App({ queryClient }: { queryClient: QueryClient }) {
  return (
    <AppProviders queryClient={queryClient}>
      <AuthBootstrap>
        <RouterProvider router={router} />
      </AuthBootstrap>
    </AppProviders>
  )
}
