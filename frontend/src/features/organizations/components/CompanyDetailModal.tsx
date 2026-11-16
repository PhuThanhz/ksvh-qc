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
    { label: 'Ngày tạo', value: formatDateTime(company.createdAt) },
    { label: 'Cập nhật lần cuối', value: formatDateTime(company.updatedAt) },
  ]

  return (
    <DetailModal
      open={open}
      title={`Chi tiết công ty: ${company.name}`}
      column={1}
      width={600}
      fields={fields}
      onClose={onClose}
    />
  )
}
