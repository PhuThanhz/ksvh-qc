import { Button, Descriptions, Modal, type DescriptionsProps } from 'antd'
import type { ReactNode } from 'react'

export interface DetailField {
  label: ReactNode
  value: ReactNode
  span?: number
}

export interface DetailModalProps {
  open: boolean
  title: ReactNode
  fields?: DetailField[]
  children?: ReactNode
  onClose: () => void
  width?: number
  column?: DescriptionsProps['column']
  extraFooter?: ReactNode
}

/**
 * Modal xem chi tiết chuẩn hoá dùng chung cho mọi module (User, Employee, OrgUnit, Criteria, v.v.).
 * Tự động render lưới nhãn - giá trị bằng Descriptions và nút Đóng chuẩn.
 */
export function DetailModal({
  open,
  title,
  fields,
  children,
  onClose,
  width = 680,
  column = { xs: 1, sm: 2 },
  extraFooter,
}: DetailModalProps) {
  return (
    <Modal
      open={open}
      title={title}
      width={width}
      centered
      styles={{ body: { maxHeight: 'calc(100vh - 180px)', overflowY: 'auto', paddingRight: 4 } }}
      onCancel={onClose}
      destroyOnHidden
      footer={[
        extraFooter,
        <Button key="close" type="primary" onClick={onClose}>
          Đóng
        </Button>,
      ]}
    >
      <div style={{ marginTop: 16 }}>
        {fields && fields.length > 0 && (
          <Descriptions bordered column={column} size="middle">
            {fields.map((f, i) => (
              <Descriptions.Item key={i} label={f.label} span={f.span}>
                {f.value ?? '—'}
              </Descriptions.Item>
            ))}
          </Descriptions>
        )}
        {children}
      </div>
    </Modal>
  )
}

