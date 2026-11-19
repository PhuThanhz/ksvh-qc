import type { DescriptionsProps } from 'antd'
import type { ReactNode } from 'react'
import { DetailDrawer, DetailItem, DetailSection, type DetailAudit, type DetailHeroProps } from '@/components/feedback/detail'

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
  /** @deprecated Drawer chi tiết dùng chung một độ rộng; giữ để không vỡ chỗ gọi cũ. */
  width?: number
  column?: DescriptionsProps['column']
  extraFooter?: ReactNode
  icon?: ReactNode
  subtitle?: ReactNode
  hero?: DetailHeroProps
  audit?: DetailAudit
}

/**
 * Xem chi tiết dạng đơn giản (danh sách nhãn – giá trị) cho mọi module.
 * Hiển thị bằng DetailDrawer chung; trang cần hero / tab / icon thì dùng thẳng DetailDrawer.
 */
export function DetailModal(props: DetailModalProps) {
  const { open, title, fields, children, onClose, column, extraFooter, icon, subtitle, hero, audit } = props
  const oneColumn = column === 1
  return (
    <DetailDrawer
      open={open}
      title={title}
      onClose={onClose}
      actions={extraFooter}
      fit
      icon={icon}
      subtitle={subtitle}
      hero={hero}
      audit={audit}
    >
      {fields && fields.length > 0 && (
        <DetailSection title="Thông tin chung" columns={oneColumn ? 1 : 2}>
          {fields.map((f, i) => (
            <DetailItem key={i} label={f.label} value={f.value} wide={f.span === 2} />
          ))}
        </DetailSection>
      )}
      {children}
    </DetailDrawer>
  )
}
