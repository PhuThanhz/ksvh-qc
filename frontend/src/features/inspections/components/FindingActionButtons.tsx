import {
  AuditOutlined,
  CheckCircleOutlined,
  EyeOutlined,
  FileDoneOutlined,
  FormOutlined,
  RollbackOutlined,
} from '@ant-design/icons'
import { ActionButton } from '@/components/data-display/TableActions'
import type { FindingActionType } from '@/features/inspections/components/FindingActionModal'
import type { FindingResponse } from '@/features/inspections/inspection.types'

interface Props {
  finding: FindingResponse
  canRespond: boolean
  canConclude: boolean
  canRemediate: boolean
  canVerify: boolean
  onAction: (finding: FindingResponse, action: FindingActionType) => void
  onView?: (finding: FindingResponse) => void
}

export function FindingActionButtons({
  finding: r,
  canRespond,
  canConclude,
  canRemediate,
  canVerify,
  onAction,
  onView,
}: Props) {
  const code = r.criterionCode || `#${r.id}`

  return (
    <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, whiteSpace: 'nowrap', width: 'max-content' }}>
      {onView && (
        <ActionButton
          tone="view"
          icon={<EyeOutlined />}
          tooltip="Xem chi tiết"
          ariaLabel={`Xem chi tiết lỗi ${code}`}
          onClick={() => onView(r)}
        />
      )}

      {r.status === 'OPEN' && canRespond && (
        <>
          <ActionButton
            tone="add"
            icon={<CheckCircleOutlined />}
            tooltip="Xác nhận nhận lỗi"
            ariaLabel={`Xác nhận nhận lỗi ${code}`}
            onClick={() => onAction(r, 'CONFIRM')}
          />
          <ActionButton
            tone="delete"
            icon={<RollbackOutlined />}
            tooltip="Khiếu nại"
            ariaLabel={`Khiếu nại lỗi ${code}`}
            onClick={() => onAction(r, 'APPEAL')}
          />
        </>
      )}

      {r.status === 'APPEALED' && (
        <ActionButton
          tone="edit"
          icon={<AuditOutlined />}
          tooltip="Thẩm định khiếu nại"
          ariaLabel={`Thẩm định khiếu nại lỗi ${code}`}
          onClick={() => onAction(r, 'SUBMIT_REVIEW')}
        />
      )}

      {r.status === 'APPEAL_MEETING' && canConclude && (
        <ActionButton
          tone="edit"
          icon={<AuditOutlined />}
          tooltip="Kết luận họp khiếu nại"
          ariaLabel={`Kết luận họp khiếu nại lỗi ${code}`}
          onClick={() => onAction(r, 'CONCLUDE_APPEAL')}
        />
      )}

      {r.status === 'CONFIRMED' && canRemediate && (
        <ActionButton
          tone="add"
          icon={<FormOutlined />}
          tooltip="Lập kế hoạch khắc phục"
          ariaLabel={`Lập kế hoạch khắc phục lỗi ${code}`}
          onClick={() => onAction(r, 'REMEDIATION_PLAN')}
        />
      )}

      {r.status === 'REMEDIATING' && canRemediate && (
        <ActionButton
          tone="add"
          icon={<FileDoneOutlined />}
          tooltip="Nộp bằng chứng khắc phục"
          ariaLabel={`Nộp bằng chứng khắc phục lỗi ${code}`}
          onClick={() => onAction(r, 'SUBMIT_REMEDIATION')}
        />
      )}

      {r.status === 'PENDING_VERIFICATION' && canVerify && (
        <ActionButton
          tone="add"
          icon={<CheckCircleOutlined />}
          tooltip="Nghiệm thu đóng lỗi"
          ariaLabel={`Nghiệm thu đóng lỗi ${code}`}
          onClick={() => onAction(r, 'VERIFY')}
        />
      )}
    </div>
  )
}
