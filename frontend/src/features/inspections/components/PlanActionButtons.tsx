import { CheckOutlined, CloseOutlined, DeleteOutlined, EditOutlined, EyeOutlined, SendOutlined } from '@ant-design/icons'
import { Space, Tooltip } from 'antd'
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
  return (
    <Space size={6}>
      {onView && (
        <Tooltip title="Xem chi tiết kế hoạch">
          <button
            type="button"
            className="action-btn action-btn-view"
            aria-label="Xem chi tiết kế hoạch"
            onClick={() => onView(r)}
          >
            <EyeOutlined />
          </button>
        </Tooltip>
      )}

      {(r.status === 'DRAFT' || r.status === 'REJECTED') && canCreate && (
        <>
          <Tooltip title="Gửi duyệt">
            <button
              type="button"
              className="action-btn action-btn-add"
              aria-label="Gửi duyệt kế hoạch"
              onClick={() => onSubmit(r)}
            >
              <SendOutlined />
            </button>
          </Tooltip>
          <Tooltip title="Chỉnh sửa">
            <button
              type="button"
              className="action-btn action-btn-edit"
              aria-label="Chỉnh sửa kế hoạch"
              onClick={() => onEdit(r)}
            >
              <EditOutlined />
            </button>
          </Tooltip>
          <Tooltip title="Xoá">
            <button
              type="button"
              className="action-btn action-btn-delete"
              aria-label="Xoá kế hoạch"
              onClick={() => onDelete(r)}
            >
              <DeleteOutlined />
            </button>
          </Tooltip>
        </>
      )}

      {r.status === 'PENDING_APPROVAL' && canApprove && (
        <>
          <Tooltip title="Phê duyệt">
            <button
              type="button"
              className="action-btn action-btn-add"
              aria-label="Phê duyệt kế hoạch"
              onClick={() => onApprove(r)}
            >
              <CheckOutlined />
            </button>
          </Tooltip>
          <Tooltip title="Từ chối">
            <button
              type="button"
              className="action-btn action-btn-delete"
              aria-label="Từ chối kế hoạch"
              onClick={() => onReject(r)}
            >
              <CloseOutlined />
            </button>
          </Tooltip>
        </>
      )}
    </Space>
  )
}
