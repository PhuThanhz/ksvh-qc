import { Flex, Modal, type ModalProps } from 'antd'
import type { ReactNode } from 'react'
import { PrimaryButton, SecondaryButton } from '@/components/ui/AppButtons'

export interface AppModalProps extends Omit<ModalProps, 'footer'> {
  title?: ReactNode
  open: boolean
  onCancel: () => void
  onOk?: () => void
  okText?: ReactNode
  cancelText?: ReactNode
  loading?: boolean
  confirmLoading?: boolean
  okDisabled?: boolean
  children: ReactNode
  footer?: ReactNode
  customFooter?: ReactNode
}

/**
 * Khung Modal hộp thoại chuẩn Apple Glass:
 * - Backdrop: rgba(15, 23, 42, 0.42) kèm backdrop-filter: blur(10px).
 * - Khung hộp thoại: Bo góc lớn 24px (--radius-xl), viền mờ 1px solid rgba(255, 255, 255, 0.2), đổ bóng var(--apple-shadow-modal).
 * - Chân modal: Nút Hủy (SecondaryButton) bên trái, nút Lưu / Xác nhận (PrimaryButton gradient cam) bên phải.
 */
export function AppModal({
  title,
  open,
  onCancel,
  onOk,
  okText = 'Lưu thay đổi',
  cancelText = 'Hủy',
  loading = false,
  confirmLoading = false,
  okDisabled = false,
  children,
  footer,
  customFooter,
  width = 560,
  className = '',
  ...rest
}: AppModalProps) {
  const defaultFooter = (
    <Flex justify="space-between" align="center" style={{ width: '100%', marginTop: 24 }}>
      <SecondaryButton onClick={onCancel} disabled={loading || confirmLoading}>
        {cancelText}
      </SecondaryButton>

      {onOk && (
        <PrimaryButton
          onClick={onOk}
          loading={loading || confirmLoading}
          disabled={okDisabled}
        >
          {okText}
        </PrimaryButton>
      )}
    </Flex>
  )

  return (
    <Modal
      title={
        title ? (
          <span
            style={{
              fontSize: 18,
              fontWeight: 700,
              letterSpacing: '-0.015em',
              color: 'var(--apple-text-primary)',
            }}
          >
            {title}
          </span>
        ) : null
      }
      open={open}
      onCancel={onCancel}
      width={width}
      centered
      destroyOnClose
      footer={customFooter !== undefined ? customFooter : (footer ?? defaultFooter)}
      className={`apple-glass-modal ${className}`.trim()}
      {...rest}
    >
      <div style={{ marginTop: title ? 16 : 0, color: 'var(--apple-text-primary)' }}>
        {children}
      </div>
    </Modal>
  )
}
