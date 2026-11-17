import { api } from '@/lib/http'
import type { PageResponse } from '@/types/common.types'
import type {
  NotificationPreferenceRequest,
  NotificationPreferenceResponse,
  NotificationResponse,
  UnreadCountResponse,
} from '@/features/notifications/notification.types'

const data = <T>(r: { data: T }) => r.data

export const notificationsApi = {
  list: (params?: { page?: number; size?: number }) =>
    api.get<PageResponse<NotificationResponse>>('/notifications', { params }).then(data),

  unreadCount: () =>
    api.get<UnreadCountResponse>('/notifications/unread-count').then(data),

  markAsRead: (id: number) =>
    api.post<NotificationResponse>(`/notifications/${id}/read`).then(data),

  markAllAsRead: () =>
    api.post<void>('/notifications/read-all').then(() => undefined),

  getPreferences: () =>
    api.get<NotificationPreferenceResponse>('/notifications/preferences').then(data),

  updatePreferences: (body: NotificationPreferenceRequest) =>
    api.put<NotificationPreferenceResponse>('/notifications/preferences', body).then(data),
}
