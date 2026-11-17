import { BellOutlined } from '@ant-design/icons'
import { Badge, Button, Drawer, Popover } from 'antd'
import { useState } from 'react'
import { useUnreadCount } from '@/features/notifications/hooks/useNotifications'
import { NotificationList } from '@/features/notifications/components/NotificationList'

export interface NotificationBellProps {
  isMobile?: boolean
}

export function NotificationBell({ isMobile }: NotificationBellProps) {
  const [open, setOpen] = useState(false)
  const { data } = useUnreadCount()
  const unreadCount = data?.unreadCount ?? 0

  const bellButton = (
    <Badge count={unreadCount} overflowCount={99} size="small" offset={[-2, 4]}>
      <Button
        type="text"
        shape="circle"
        icon={
          <BellOutlined
            style={{
              fontSize: isMobile ? 18 : 17,
              color: isMobile ? 'var(--app-text, #1f1f1f)' : 'var(--app-on-dark, #fff)',
            }}
          />
        }
        onClick={() => setOpen(!open)}
        aria-label="Thông báo"
        style={{
          width: 32,
          height: 32,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: isMobile ? 'transparent' : 'var(--app-on-dark-glass, rgba(255, 255, 255, 0.08))',
          border: isMobile ? 'none' : '1px solid var(--app-on-dark-glass-border, rgba(255, 255, 255, 0.12))',
        }}
      />
    </Badge>
  )

  if (isMobile) {
    return (
      <>
        {bellButton}
        <Drawer
          title="Thông báo"
          placement="bottom"
          height="75vh"
          open={open}
          onClose={() => setOpen(false)}
          styles={{ body: { padding: 0 } }}
        >
          <NotificationList onItemClick={() => setOpen(false)} />
        </Drawer>
      </>
    )
  }

  return (
    <Popover
      content={<NotificationList onItemClick={() => setOpen(false)} />}
      trigger="click"
      open={open}
      onOpenChange={setOpen}
      placement="bottomRight"
      styles={{ container: { padding: 0 } }}
    >
      {bellButton}
    </Popover>
  )
}
