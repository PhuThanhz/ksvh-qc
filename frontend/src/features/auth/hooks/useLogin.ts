import { useMutation } from '@tanstack/react-query'
import { authApi } from '@/features/auth/api/auth.api'
import type { LoginFormValues } from '@/features/auth/schemas/login.schema'
import { applySession } from '@/features/auth/session/session-manager'

export function useLogin() {
  return useMutation({
    mutationFn: (values: LoginFormValues) => authApi.login(values),
    onSuccess: applySession,
  })
}
