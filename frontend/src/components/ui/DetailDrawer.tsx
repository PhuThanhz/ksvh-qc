import { CloseOutlined } from '@ant-design/icons'
import { Button, Drawer, Flex, Typography } from 'antd'
import type { CSSProperties, ReactNode } from 'react'

export interface DetailField {
  label: ReactNode
  value: ReactNode
  span?: 1 | 2
}

export interface AuditInfo {
  createdBy?: string
  createdAt?: string
  updatedBy?: string
  updatedAt?: string
}

export interface DetailDrawerProps {
  title: ReactNode
  open: boolean
  onClose: () => void
  width?: number | string
  fields?: DetailField[]
  audit?: AuditInfo
  extraHeader?: ReactNode
  footer?: ReactNode
  children?: ReactNode
  style?: CSSProperties
}

/**
 * Ngăn kéo chi tiết trượt chuẩn Apple Minimalist (DetailDrawer):
 * - Trượt từ cạnh phải (width mặc định 640px).
 * - Hiển thị thông tin đối tượng theo dạng lưới thẻ 2 cột (label - value).
 * - Khu vực kiểm toán chuyên biệt (Ai tạo, thời gian tạo, ai sửa cuối cùng).
 */
export function DetailDrawer({
  title,
  open,
  onClose,
  width = 640,
  fields,
  audit,
  extraHeader,
  footer,
  children,
  style,
}: DetailDrawerProps) {
  return (
    <Drawer
      title={
        <Flex justify="space-between" align="center" style={{ width: '100%' }}>
          <Typography.Title
            level={4}
            style={{
              margin: 0,
              fontSize: 18,
              fontWeight: 700,
              letterSpacing: '-0.015em',
              color: 'var(--apple-text-primary)',
            }}
          >
            {title}
          </Typography.Title>
          {extraHeader}
        </Flex>
      }
      placement="right"
      width={width}
      open={open}
      onClose={onClose}
      destroyOnClose
      closeIcon={<CloseOutlined style={{ fontSize: 16, color: 'var(--apple-text-secondary)' }} />}
      footer={
        footer ?? (
          <Flex justify="flex-end" style={{ padding: '4px 0' }}>
            <Button
              type="text"
              className="btn-secondary-apple"
              onClick={onClose}
              style={{ height: 36, padding: '0 16px', borderRadius: 'var(--radius-sm)' }}
            >
              Đóng
            </Button>
          </Flex>
        )
      }
      styles={{
        body: { padding: 24, display: 'flex', flexDirection: 'column', gap: 20, ...style },
        header: { borderBottom: '1px solid var(--apple-border)', padding: '16px 24px' },
        footer: { borderTop: '1px solid var(--apple-border)', padding: '12px 24px' },
      }}
    >
      {/* 2-Column Specs Grid */}
      {fields && fields.length > 0 && (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: 12,
            background: 'var(--apple-surface-hover)',
            border: '1px solid var(--apple-border)',
            borderRadius: 'var(--radius-md)',
            padding: 16,
          }}
        >
          {fields.map((f, i) => (
            <div
              key={i}
              style={{
                gridColumn: f.span === 2 ? 'span 2' : 'span 1',
                display: 'flex',
                flexDirection: 'column',
                gap: 4,
              }}
            >
              <span
                style={{
                  fontSize: 12.5,
                  fontWeight: 500,
                  color: 'var(--apple-text-secondary)',
                }}
              >
                {f.label}
              </span>
              <div
                style={{
                  fontSize: 14,
                  fontWeight: 500,
                  color: 'var(--apple-text-primary)',
                  wordBreak: 'break-word',
                }}
              >
                {f.value ?? '—'}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Main Content / Extra Views */}
      {children}

      {/* Dedicated Audit Section */}
      {audit && (audit.createdBy || audit.createdAt || audit.updatedBy || audit.updatedAt) && (
        <div
          style={{
            marginTop: 'auto',
            borderTop: '1px dashed var(--apple-border-strong)',
            paddingTop: 16,
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: 10,
            fontSize: 12.5,
            color: 'var(--apple-text-tertiary)',
          }}
        >
          {(audit.createdBy || audit.createdAt) && (
            <div>
              <span style={{ display: 'block', fontWeight: 500 }}>Khởi tạo:</span>
              <span>
                {audit.createdBy ?? 'Hệ thống'} {audit.createdAt ? `· ${audit.createdAt}` : ''}
              </span>
            </div>
          )}
          {(audit.updatedBy || audit.updatedAt) && (
            <div>
              <span style={{ display: 'block', fontWeight: 500 }}>Chỉnh sửa lần cuối:</span>
              <span>
                {audit.updatedBy ?? '—'} {audit.updatedAt ? `· ${audit.updatedAt}` : ''}
              </span>
            </div>
          )}
        </div>
      )}
    </Drawer>
  )
}
