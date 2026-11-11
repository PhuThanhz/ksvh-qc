import type { SessionResponse } from '@/features/auth/auth.types'

/** Tin nhắn đồng bộ phiên giữa các tab cùng origin. */
export type AuthMessage =
  | { type: 'SESSION_UPDATED'; session: SessionResponse }
  | { type: 'LOGGED_OUT'; reason: 'logout' | 'expired' }

const CHANNEL_NAME = 'ksvh-auth'
const channel = typeof BroadcastChannel === 'undefined' ? null : new BroadcastChannel(CHANNEL_NAME)

export const authChannel = {
  post(message: AuthMessage) {
    channel?.postMessage(message)
  },
  subscribe(handler: (message: AuthMessage) => void): () => void {
    if (!channel) return () => {}
    const listener = (e: MessageEvent<AuthMessage>) => handler(e.data)
    channel.addEventListener('message', listener)
    return () => channel.removeEventListener('message', listener)
  },
}
