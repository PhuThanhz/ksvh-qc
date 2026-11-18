import {
  AlertOutlined,
  AuditOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  FileTextOutlined,
  TeamOutlined,
} from '@ant-design/icons'
import { Flex, Typography } from 'antd'
import type { CSSProperties, ReactNode } from 'react'
import type {
  NotificationResponse,
  NotificationType,
} from '@/features/notifications/notification.types'

const { Text } = Typography

function formatRelativeTime(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60_000)
  if (mins < 1) return 'Vừa xong'
  if (mins < 60) return `${mins} phút trước`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours} giờ trước`
  const days = Math.floor(hours / 24)
  if (days < 7) return `${days} ngày trước`
  return new Date(dateStr).toLocaleDateString('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  })
}

function getIconAndColor(type: NotificationType): { icon: ReactNode; color: string } {
  switch (type) {
    case 'PLAN_APPROVED':
    case 'FINDING_VERIFIED':
    case 'FINDING_APPEAL_CONCLUDED':
      return { icon: <CheckCircleOutlined />, color: '#52c41a' }
    case 'PLAN_REJECTED':
    case 'FINDING_M4_ALERT':
    case 'FINDING_OVERDUE':
      return { icon: <AlertOutlined />, color: '#ff4d4f' }
    case 'FINDING_REMINDER_DUE':
      return { icon: <ClockCircleOutlined />, color: '#fa8c16' }
    case 'FINDING_APPEALED':
    case 'APPEAL_MEETING_REQUIRED':
      return { icon: <TeamOutlined />, color: '#faad14' }
    case 'INSPECTION_ASSIGNED':
      return { icon: <AuditOutlined />, color: '#722ed1' }
    case 'INSPECTION_SUBMITTED':
    case 'REMEDIATION_SUBMITTED':
      return { icon: <FileTextOutlined />, color: '#1677ff' }
    default:
      return { icon: <FileTextOutlined />, color: 'var(--app-accent, #1677ff)' }
  }
}

export interface NotificationItemProps {
  notification: NotificationResponse
  onClick: (n: NotificationResponse) => void
}

export function NotificationItem({ notification, onClick }: NotificationItemProps) {
  const { icon, color } = getIconAndColor(notification.type)
  const isUnread = !notification.read

  const itemStyle: CSSProperties = {
    padding: '10px 14px',
    cursor: 'pointer',
    borderRadius: 8,
    transition: 'background 0.2s',
    background: isUnread ? 'var(--app-hover-tint, rgba(22, 119, 255, 0.05))' : 'transparent',
    borderBottom: '1px solid var(--app-border, rgba(0, 0, 0, 0.06))',
  }

  return (
    <div
      role="button"
      tabIndex={0}
      style={itemStyle}
      onClick={() => onClick(notification)}
      onKeyDown={(e) => e.key === 'Enter' && onClick(notification)}
    >
      <Flex gap={12} align="flex-start">
        <div
          style={{
            color,
            fontSize: 18,
            marginTop: 2,
            flexShrink: 0,
          }}
        >
          {icon}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <Flex justify="space-between" align="baseline" gap={8}>
            <Text
              strong={isUnread}
              ellipsis
              style={{
                fontSize: 13,
                color: isUnread ? 'var(--app-text, #1f1f1f)' : 'var(--app-text-secondary, #666)',
              }}
            >
              {notification.title}
            </Text>
            {isUnread && (
              <span
                style={{
                  width: 7,
                  height: 7,
                  borderRadius: '50%',
                  background: '#1677ff',
                  display: 'inline-block',
                  flexShrink: 0,
                }}
              />
            )}
          </Flex>
          <div
            style={{
              fontSize: 12,
              color: 'var(--app-text-secondary, #666)',
              marginTop: 2,
              lineHeight: 1.4,
              wordBreak: 'break-word',
            }}
          >
            {notification.body}
          </div>
          <div
            style={{
              fontSize: 11,
              color: 'var(--app-text-tertiary, #999)',
              marginTop: 4,
            }}
          >
            {formatRelativeTime(notification.createdAt)}
          </div>
        </div>
      </Flex>
    </div>
  )
}
