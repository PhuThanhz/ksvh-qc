import {
  AuditOutlined,
  CheckCircleOutlined,
  EyeOutlined,
  FileDoneOutlined,
  FormOutlined,
  RollbackOutlined,
} from '@ant-design/icons'
import { Button, Space, Tooltip } from 'antd'
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
  return (
    <Space size={4}>
      {onView && (
        <Tooltip title="Xem chi tiết">
          <Button type="text" icon={<EyeOutlined />} onClick={() => onView(r)} />
        </Tooltip>
      )}

      {r.status === 'OPEN' && canRespond && (
        <>
          <Tooltip title="Xác nhận nhận lỗi">
            <Button type="text" icon={<CheckCircleOutlined />} onClick={() => onAction(r, 'CONFIRM')} />
          </Tooltip>
          <Tooltip title="Khiếu nại">
            <Button type="text" icon={<RollbackOutlined />} onClick={() => onAction(r, 'APPEAL')} />
          </Tooltip>
        </>
      )}

      {r.status === 'APPEALED' && (
        <Tooltip title="Thẩm định khiếu nại">
          <Button type="text" icon={<AuditOutlined />} onClick={() => onAction(r, 'SUBMIT_REVIEW')} />
        </Tooltip>
      )}

      {r.status === 'APPEAL_MEETING' && canConclude && (
        <Tooltip title="Kết luận họp khiếu nại">
          <Button type="text" icon={<AuditOutlined />} onClick={() => onAction(r, 'CONCLUDE_APPEAL')} />
        </Tooltip>
      )}

      {r.status === 'CONFIRMED' && canRemediate && (
        <Tooltip title="Lập kế hoạch khắc phục">
          <Button type="text" icon={<FormOutlined />} onClick={() => onAction(r, 'REMEDIATION_PLAN')} />
        </Tooltip>
      )}

      {r.status === 'REMEDIATING' && canRemediate && (
        <Tooltip title="Nộp bằng chứng khắc phục">
          <Button type="text" icon={<FileDoneOutlined />} onClick={() => onAction(r, 'SUBMIT_REMEDIATION')} />
        </Tooltip>
      )}

      {r.status === 'PENDING_VERIFICATION' && canVerify && (
        <Tooltip title="Nghiệm thu đóng lỗi">
          <Button type="text" icon={<CheckCircleOutlined />} onClick={() => onAction(r, 'VERIFY')} />
        </Tooltip>
      )}
    </Space>
  )
}
