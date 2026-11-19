import { FileSearchOutlined } from '@ant-design/icons'
import { Button, Descriptions, Space, type DescriptionsProps } from 'antd'
import { DetailDrawer } from '@/components/feedback/detail'
import { StatusBadge } from '@/components/data-display/StatusBadge'
import { ImpactTag } from '@/features/criteria/components/ImpactTag'
import type { Criterion } from '@/features/criteria/criteria.types'
import { PERMISSIONS, ProtectedAction } from '@/permissions'
import { formatDateTime } from '@/utils/format-date'

const ACTIVE_META = {
  active: { label: 'Đang dùng', tone: 'success' as const },
  inactive: { label: 'Ngưng', tone: 'default' as const },
}

export interface CriterionDetailModalProps {
  open?: boolean
  criterion?: Criterion
  onClose: () => void
  onEdit: (criterion: Criterion) => void
}

export function CriterionDetailModal({ open, criterion, onClose, onEdit }: CriterionDetailModalProps) {
  if (!criterion) return null

  const items: DescriptionsProps['items'] = [
    { key: 'code', label: 'Mã tiêu chí', children: criterion.code },
    {
      key: 'status',
      label: 'Trạng thái',
      children: <StatusBadge status={criterion.active ? 'active' : 'inactive'} meta={ACTIVE_META} />,
    },
    { key: 'group', label: 'Nhóm tiêu chí', span: 2, children: criterion.groupName },
    { key: 'name', label: 'Nội dung tiêu chí kiểm soát', span: 2, children: criterion.name },
    {
      key: 'impact',
      label: 'Mức độ ảnh hưởng cơ sở',
      span: 2,
      children: (
        <Space>
          <ImpactTag value={criterion.baseImpact} />
          <span style={{ color: 'var(--app-text-secondary)', fontSize: 13 }}>
            (Điểm rủi ro = Mức độ ảnh hưởng × Tần suất vi phạm)
          </span>
        </Space>
      ),
    },
    { key: 'method', label: 'Phương pháp đánh giá', span: 2, children: criterion.checkMethod || '—' },
    { key: 'evidence', label: 'Hồ sơ / Bằng chứng minh chứng', span: 2, children: criterion.evidenceRequired || '—' },
    { key: 'updatedAt', label: 'Cập nhật lần cuối', span: 2, children: formatDateTime(criterion.updatedAt) },
  ]

  return (
    <DetailDrawer
      open={open ?? Boolean(criterion)}
      onClose={onClose}
      icon={<FileSearchOutlined />}
      title={`Chi tiết tiêu chí: ${criterion.code}`}
      subtitle={criterion.groupName}
      actions={
        <ProtectedAction access={PERMISSIONS.CRITERIA.MANAGE}>
          <Button
            type="primary"
            onClick={() => {
              onClose()
              onEdit(criterion)
            }}
          >
            Chỉnh sửa
          </Button>
        </ProtectedAction>
      }
    >
      <Descriptions
        bordered
        size="middle"
        column={{ xs: 1, sm: 2 }}
        items={items}
        style={{ marginTop: 12 }}
      />
    </DetailDrawer>
  )
}
