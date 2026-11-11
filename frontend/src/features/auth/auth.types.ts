import type { SessionResponse, SessionUser } from '@/types/api.generated'

export type { SessionResponse, SessionUser }

/**
 * bootstrapping: đang khôi phục phiên khi mở app (gọi refresh bằng cookie)
 * authenticated: có access token trong bộ nhớ
 * anonymous: chưa đăng nhập / phiên đã hết
 */
export type SessionStatus = 'bootstrapping' | 'authenticated' | 'anonymous'

/** Lý do kết thúc phiên, để trang đăng nhập hiển thị thông báo phù hợp. */
export type SessionEndReason = 'logout' | 'expired' | null
