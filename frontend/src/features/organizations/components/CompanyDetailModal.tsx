import { BankOutlined, BarcodeOutlined } from '@ant-design/icons'
import { ActiveBadge } from '@/features/organizations/components/ActiveBadge'
import { DetailModal, type DetailField } from '@/components/feedback/DetailModal'
import type { Company } from '@/features/organizations/organizations.types'
import { formatDateTime } from '@/utils/format-date'

export interface CompanyDetailModalProps {
  open: boolean
  company?: Company
  onClose: () => void
}

export function CompanyDetailModal({ open, company, onClose }: CompanyDetailModalProps) {
  if (!company) return null

  const fields: DetailField[] = [
    { label: 'Mã công ty', value: company.code },
    { label: 'Tên công ty', value: company.name },
    { label: 'Trạng thái', value: <ActiveBadge active={company.active} /> },
  ]

  return (
    <DetailModal
      open={open}
      title="Chi tiết công ty"
      icon={<BankOutlined />}
      hero={{
        avatar: <BankOutlined />,
        eyebrow: 'Công ty',
        title: company.name,
        status: <ActiveBadge active={company.active} />,
        chips: [{ icon: <BarcodeOutlined />, label: company.code }],
      }}
      audit={{ createdAt: formatDateTime(company.createdAt), updatedAt: formatDateTime(company.updatedAt) }}
      fields={fields}
      onClose={onClose}
    />
  )
}
