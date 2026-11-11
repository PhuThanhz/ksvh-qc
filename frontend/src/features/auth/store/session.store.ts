import { create } from 'zustand'
import type { SessionEndReason, SessionResponse, SessionStatus, SessionUser } from '@/features/auth/auth.types'

interface SessionState {
  status: SessionStatus
  /** Chỉ nằm trong bộ nhớ: đóng tab là mất, khôi phục lại bằng cookie refresh HttpOnly. */
  accessToken: string | null
  user: SessionUser | null
  endReason: SessionEndReason
  setSession: (session: SessionResponse) => void
  endSession: (reason: Exclude<SessionEndReason, null>) => void
}

/** KHÔNG dùng persist: token không bao giờ được ghi vào localStorage/sessionStorage. */
export const useSessionStore = create<SessionState>()((set) => ({
  status: 'bootstrapping',
  accessToken: null,
  user: null,
  endReason: null,
  setSession: (session) =>
    set({ status: 'authenticated', accessToken: session.accessToken, user: session.user, endReason: null }),
  endSession: (reason) => set({ status: 'anonymous', accessToken: null, user: null, endReason: reason }),
}))

export const selectUser = (s: SessionState) => s.user
export const selectStatus = (s: SessionState) => s.status
