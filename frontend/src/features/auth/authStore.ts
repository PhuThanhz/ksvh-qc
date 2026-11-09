import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { TokenResponse, UserInfo } from '@/api/types'

interface AuthState {
  accessToken: string | null
  refreshToken: string | null
  user: UserInfo | null
  setSession: (res: TokenResponse) => void
  logout: () => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      accessToken: null,
      refreshToken: null,
      user: null,
      setSession: (res) =>
        set({ accessToken: res.accessToken, refreshToken: res.refreshToken, user: res.user }),
      logout: () => set({ accessToken: null, refreshToken: null, user: null }),
    }),
    { name: 'ksvh-auth' },
  ),
)

/** Trang mặc định sau khi đăng nhập, theo vai trò. */
export function homePathFor(user: UserInfo | null): string {
  if (!user) return '/login'
  return user.role === 'AUDITOR' ? '/qc' : '/admin'
}
