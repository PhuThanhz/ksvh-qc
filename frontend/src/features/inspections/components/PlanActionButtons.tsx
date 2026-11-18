import { CheckOutlined, CloseOutlined, DeleteOutlined, EditOutlined, EyeOutlined, SendOutlined } from '@ant-design/icons'
import { Space } from 'antd'
import { ActionButton } from '@/components/data-display/TableActions'
import type { PlanResponse } from '@/features/inspections/inspection.types'

interface Props {
  plan: PlanResponse
  canCreate: boolean
  canApprove: boolean
  onView?: (plan: PlanResponse) => void
  onEdit: (plan: PlanResponse) => void
  onSubmit: (plan: PlanResponse) => void
  onApprove: (plan: PlanResponse) => void
  onReject: (plan: PlanResponse) => void
  onDelete: (plan: PlanResponse) => void
}

export function PlanActionButtons({
  plan: r,
  canCreate,
  canApprove,
  onView,
  onEdit,
  onSubmit,
  onApprove,
  onReject,
  onDelete,
}: Props) {
  const isDraftOrRejected = (r.status === 'DRAFT' || r.status === 'REJECTED') && canCreate
  const isPendingApproval = r.status === 'PENDING_APPROVAL' && canApprove

  return (
    <Space size={6} wrap={false}>
      {onView && (
        <ActionButton
          tone="view"
          icon={<EyeOutlined />}
          tooltip="Xem chi tiết kế hoạch"
          ariaLabel={`Xem chi tiết kế hoạch ${r.planCode}`}
          onClick={() => onView(r)}
        />
      )}

      {isDraftOrRejected && (
        <>
          <ActionButton
            tone="add"
            icon={<SendOutlined />}
            tooltip="Gửi duyệt"
            ariaLabel={`Gửi duyệt kế hoạch ${r.planCode}`}
            onClick={() => onSubmit(r)}
          />
          <ActionButton
            tone="edit"
            icon={<EditOutlined />}
            tooltip="Chỉnh sửa"
            ariaLabel={`Chỉnh sửa kế hoạch ${r.planCode}`}
            onClick={() => onEdit(r)}
          />
          <ActionButton
            tone="delete"
            icon={<DeleteOutlined />}
            tooltip="Xoá"
            ariaLabel={`Xoá kế hoạch ${r.planCode}`}
            onClick={() => onDelete(r)}
          />
        </>
      )}

      {isPendingApproval && (
        <>
          <ActionButton
            tone="add"
            icon={<CheckOutlined />}
            tooltip="Phê duyệt"
            ariaLabel={`Phê duyệt kế hoạch ${r.planCode}`}
            onClick={() => onApprove(r)}
          />
          <ActionButton
            tone="delete"
            icon={<CloseOutlined />}
            tooltip="Từ chối"
            ariaLabel={`Từ chối kế hoạch ${r.planCode}`}
            onClick={() => onReject(r)}
          />
        </>
      )}
    </Space>
  )
}
