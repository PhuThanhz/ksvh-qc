import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { notificationsApi } from '@/features/notifications/api/notification.api'

export const NOTIFICATION_KEYS = {
  all: ['notifications'] as const,
  list: (page: number, size: number) => ['notifications', 'list', page, size] as const,
  unreadCount: () => ['notifications', 'unread-count'] as const,
  preferences: () => ['notifications', 'preferences'] as const,
}

export function useNotifications(page = 0, size = 20) {
  return useQuery({
    queryKey: NOTIFICATION_KEYS.list(page, size),
    queryFn: () => notificationsApi.list({ page, size }),
    staleTime: 30_000,
  })
}

export function useNotificationPreferences() {
  return useQuery({
    queryKey: NOTIFICATION_KEYS.preferences(),
    queryFn: () => notificationsApi.getPreferences(),
    staleTime: 300_000,
  })
}

export function useUpdateNotificationPreferences() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: notificationsApi.updatePreferences,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: NOTIFICATION_KEYS.preferences() })
    },
  })
}

export function useUnreadCount() {
  return useQuery({
    queryKey: NOTIFICATION_KEYS.unreadCount(),
    queryFn: () => notificationsApi.unreadCount(),
    staleTime: 30_000,
    refetchInterval: 60_000,
    refetchIntervalInBackground: false,
  })
}

export function useNotificationMutations() {
  const queryClient = useQueryClient()

  const markAsRead = useMutation({
    mutationFn: (id: number) => notificationsApi.markAsRead(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: NOTIFICATION_KEYS.all })
    },
  })

  const markAllAsRead = useMutation({
    mutationFn: () => notificationsApi.markAllAsRead(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: NOTIFICATION_KEYS.all })
    },
  })

  return {
    markAsRead,
    markAllAsRead,
  }
}
