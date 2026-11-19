import { AppstoreOutlined, BankOutlined, BarcodeOutlined, EditOutlined, FileDoneOutlined, FileTextOutlined, OrderedListOutlined } from '@ant-design/icons'
import { Button } from 'antd'
import { StatusBadge } from '@/components/data-display/StatusBadge'
import { DetailDrawer } from '@/components/feedback/detail'
import { TemplateCriteriaPanel } from '@/features/criteria/components/TemplateCriteriaPanel'
import { TemplateOverviewPanel } from '@/features/criteria/components/TemplateOverviewPanel'
import { INSPECTION_TYPE_LABEL, type Template } from '@/features/criteria/criteria.types'
import { useTemplate } from '@/features/criteria/hooks/useTemplates'
import { formatDateTime } from '@/utils/format-date'

const ACTIVE_META = {
  active: { label: 'Đang dùng', tone: 'success' as const },
  inactive: { label: 'Ngưng dùng', tone: 'default' as const },
}

export interface TemplateDetailModalProps {
  open: boolean
  template?: Template
  onClose: () => void
  onEdit?: (template: Template) => void
}

/** Chi tiết mẫu phiếu: hero + tab Tổng quan / Danh sách tiêu chí. */
export function TemplateDetailModal({ open, template, onClose, onEdit }: TemplateDetailModalProps) {
  const detail = useTemplate(open && template?.id ? template.id : undefined)
  if (!template) return null
  const t = detail.data ?? template
  const criteria = t.criteria ?? []
  const groupCount = new Set(criteria.map((c) => c.groupId)).size
  const count = t.criterionCount ?? criteria.length

  return (
    <DetailDrawer
      open={open}
      onClose={onClose}
      icon={<FileTextOutlined />}
      title="Chi tiết mẫu phiếu"
      subtitle="Bộ tiêu chí Chuyên viên dùng khi kiểm tra định kỳ"
      hero={{
        avatar: <FileDoneOutlined />,
        eyebrow: 'Mẫu phiếu kiểm tra',
        title: t.name,
        status: <StatusBadge status={t.active ? 'active' : 'inactive'} meta={ACTIVE_META} />,
        chips: [
          { icon: <BarcodeOutlined />, label: t.code },
          { icon: <BankOutlined />, label: t.companyName ?? 'Dùng chung mọi công ty' },
          ...(t.inspectionType
            ? [{ icon: <AppstoreOutlined />, label: INSPECTION_TYPE_LABEL[t.inspectionType] ?? t.inspectionType }]
            : []),
          { icon: <OrderedListOutlined />, label: `${count} tiêu chí · ${groupCount} nhóm` },
        ],
      }}
      tabs={[
        { key: 'overview', label: 'Tổng quan', children: <TemplateOverviewPanel template={t} /> },
        {
          key: 'criteria',
          label: `Danh sách tiêu chí (${count})`,
          children: <TemplateCriteriaPanel criteria={criteria} loading={detail.isLoading} />,
        },
      ]}
      audit={{ updatedAt: formatDateTime(t.updatedAt) }}
      actions={
        onEdit && (
          <Button
            type="primary"
            icon={<EditOutlined />}
            onClick={() => {
              onClose()
              onEdit(t)
            }}
          >
            Chỉnh sửa
          </Button>
        )
      }
    />
  )
}
