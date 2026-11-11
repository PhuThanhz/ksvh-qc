import { useMutation } from '@tanstack/react-query'
import { authApi } from '@/features/auth/api/auth.api'
import { endSession } from '@/features/auth/session/session-manager'

/** Thu hồi phiên ở server (best effort) rồi kết thúc phiên ở mọi tab, kể cả khi mất mạng. */
export function useLogout() {
  return useMutation({
    mutationFn: () => authApi.logout().catch(() => undefined),
    onSettled: () => endSession('logout'),
  })
}
