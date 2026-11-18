import { CheckOutlined, SettingOutlined } from '@ant-design/icons'
import { Button, Empty, Flex, Spin, Tooltip, Typography } from 'antd'
import { useState } from 'react'
import { useNavigate } from 'react-router'
import {
  useNotificationMutations,
  useNotifications,
} from '@/features/notifications/hooks/useNotifications'
import { NotificationItem } from '@/features/notifications/components/NotificationItem'
import { NotificationPreferenceModal } from '@/features/notifications/components/NotificationPreferenceModal'
import type { NotificationResponse } from '@/features/notifications/notification.types'

const { Text } = Typography

export interface NotificationListProps {
  onItemClick?: () => void
}

export function NotificationList({ onItemClick }: NotificationListProps) {
  const navigate = useNavigate()
  const [prefOpen, setPrefOpen] = useState(false)
  const { data, isLoading } = useNotifications(0, 30)
  const { markAsRead, markAllAsRead } = useNotificationMutations()

  const notifications = data?.items ?? []
  const hasUnread = notifications.some((n) => !n.read)

  const handleClick = (n: NotificationResponse) => {
    if (!n.read) {
      markAsRead.mutate(n.id)
    }
    onItemClick?.()
    if (n.link) {
      navigate(n.link)
    }
  }

  return (
    <div style={{ width: 340, maxWidth: '100%' }}>
      <Flex
        justify="space-between"
        align="center"
        style={{
          padding: '10px 14px',
          borderBottom: '1px solid var(--app-border, rgba(0, 0, 0, 0.06))',
        }}
      >
        <Flex align="center" gap={6}>
          <Text strong style={{ fontSize: 14 }}>
            Thông báo
          </Text>
          <Tooltip title="Cài đặt kênh nhận thông báo (Email / Zalo)">
            <Button
              type="text"
              size="small"
              icon={<SettingOutlined style={{ fontSize: 13, color: '#8c8c8c' }} />}
              onClick={() => setPrefOpen(true)}
            />
          </Tooltip>
        </Flex>
        {hasUnread && (
          <Button
            type="link"
            size="small"
            icon={<CheckOutlined />}
            loading={markAllAsRead.isPending}
            onClick={() => markAllAsRead.mutate()}
            style={{ padding: 0, fontSize: 12 }}
          >
            Đã đọc tất cả
          </Button>
        )}
      </Flex>

      <div
        style={{
          maxHeight: 380,
          overflowY: 'auto',
          padding: '6px 4px',
        }}
      >
        {isLoading ? (
          <Flex justify="center" align="center" style={{ padding: 32 }}>
            <Spin size="small" />
          </Flex>
        ) : notifications.length === 0 ? (
          <Empty
            image={Empty.PRESENTED_IMAGE_SIMPLE}
            description="Không có thông báo nào"
            style={{ margin: '24px 0' }}
          />
        ) : (
          notifications.map((n) => (
            <NotificationItem key={n.id} notification={n} onClick={handleClick} />
          ))
        )}
      </div>
      <NotificationPreferenceModal open={prefOpen} onClose={() => setPrefOpen(false)} />
    </div>
  )
}
