import { CloseOutlined } from '@ant-design/icons'
import { Button, Drawer, Flex, Tabs, Typography } from 'antd'
import type { ReactNode } from 'react'
import { DetailHero, type DetailHeroProps } from '@/components/feedback/detail/DetailHero'
import { DetailStats, type DetailStat } from '@/components/feedback/detail/DetailStats'

export interface DetailTab {
  key: string
  label: ReactNode
  icon?: ReactNode
  children: ReactNode
}

export interface DetailAudit {
  createdBy?: string | null
  createdAt?: string | null
  updatedBy?: string | null
  updatedAt?: string | null
}

export interface DetailDrawerProps {
  open: boolean
  onClose: () => void
  /** Icon nhỏ cạnh tiêu đề (loại đối tượng). */
  icon?: ReactNode
  title: ReactNode
  subtitle?: ReactNode
  hero?: DetailHeroProps
  /** Dải chỉ số nhanh ngay dưới hero. */
  stats?: DetailStat[]
  /** Nội dung chia tab (hiển thị trước children). */
  tabs?: DetailTab[]
  children?: ReactNode
  /** Nút thao tác ở chân (vd Chỉnh sửa). Nút Đóng luôn có sẵn. */
  actions?: ReactNode
  audit?: DetailAudit
  /** Co chiều cao theo nội dung (trang ít thông tin) thay vì phủ gần hết màn hình. */
  fit?: boolean
}

const fmt = (by?: string | null, at?: string | null) => (by ? `${by}${at ? ` (${at})` : ''}` : (at ?? '—'))

/**
 * Ngăn kéo xem chi tiết dùng chung: trượt từ dưới lên (gần toàn màn hình, chừa thanh menu bên trái),
 * nút đóng tròn nổi ở mép trái; đầu trang có icon + tiêu đề,
 * khối hero màu thương hiệu, tab nội dung, chân có người tạo / cập nhật và nút thao tác.
 */
export function DetailDrawer(props: DetailDrawerProps) {
  const { open, onClose, icon, title, subtitle, hero, stats, tabs, children, actions, audit } = props
  const hasAudit = audit && (audit.createdAt || audit.updatedAt || audit.createdBy || audit.updatedBy)
  return (
    <Drawer
      open={open}
      onClose={onClose}
      placement="bottom"
      size={props.fit ? 'auto' : 'calc(100vh - 24px)'}
      closable={false}
      destroyOnHidden
      rootClassName={props.fit ? 'detail-drawer detail-drawer--fit' : 'detail-drawer'}
      title={
        <Flex align="center" gap={12}>
          {icon && <span className="detail-drawer__icon">{icon}</span>}
          <div style={{ minWidth: 0 }}>
            <Typography.Title level={5} className="detail-drawer__title">{title}</Typography.Title>
            {subtitle && <div className="detail-drawer__subtitle">{subtitle}</div>}
          </div>
        </Flex>
      }
      drawerRender={(node) => (
        <>
          <button type="button" className="detail-drawer__close" aria-label="Đóng" onClick={onClose}>
            <CloseOutlined />
          </button>
          {node}
        </>
      )}
      footer={
        <Flex justify="space-between" align="center" gap={12} wrap>
          <span className="detail-drawer__audit">
            {hasAudit && (
              <>
                {(audit.createdBy || audit.createdAt) && <span>{audit.createdBy ? 'Tạo bởi' : 'Ngày tạo'}: {fmt(audit.createdBy, audit.createdAt)}</span>}
                {(audit.createdBy || audit.createdAt) && (audit.updatedBy || audit.updatedAt) && (
                  <span style={{ margin: '0 10px' }}>·</span>
                )}
                {(audit.updatedBy || audit.updatedAt) && (
                  <span>{audit.updatedBy ? 'Cập nhật bởi' : 'Cập nhật lần cuối'}: {fmt(audit.updatedBy, audit.updatedAt)}</span>
                )}
              </>
            )}
          </span>
          <Flex gap={8}>
            {actions}
            <Button onClick={onClose}>Đóng</Button>
          </Flex>
        </Flex>
      }
    >
      <Flex vertical gap={16}>
        {hero && <DetailHero {...hero} />}
        {stats && stats.length > 0 && <DetailStats items={stats} />}
        {tabs && <Tabs className="detail-drawer__tabs" items={tabs} />}
        {children}
      </Flex>
    </Drawer>
  )
}
