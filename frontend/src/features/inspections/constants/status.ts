import type { BadgeTone } from '@/components/data-display/StatusBadge'
import type { FindingEventAction, FindingStatus } from '../finding.types'
import type { ItemResult } from '../inspection.types'
import type { InspectionStatus, PlanStatus } from '../plan.types'

export interface StatusMeta {
  label: string
  tone: BadgeTone
  color: string
}

export const PLAN_STATUS_META: Record<PlanStatus, StatusMeta> = {
  DRAFT: { label: 'Bản nháp', tone: 'default', color: 'default' },
  PENDING_APPROVAL: { label: 'Chờ duyệt', tone: 'warning', color: 'warning' },
  APPROVED: { label: 'Đã duyệt', tone: 'success', color: 'success' },
  REJECTED: { label: 'Từ chối', tone: 'danger', color: 'error' },
}

export const INSPECTION_STATUS_META: Record<InspectionStatus, StatusMeta> = {
  ASSIGNED: { label: 'Đã phân công', tone: 'default', color: 'default' },
  IN_PROGRESS: { label: 'Đang đánh giá', tone: 'processing', color: 'processing' },
  SUBMITTED: { label: 'Đã nộp', tone: 'warning', color: 'warning' },
  AWAITING_ACK: { label: 'Chờ xác nhận biên bản', tone: 'warning', color: 'warning' },
  COMPLETED: { label: 'Hoàn thành', tone: 'success', color: 'success' },
  CANCELLED: { label: 'Đã huỷ', tone: 'default', color: 'default' },
}

export const FINDING_STATUS_META: Record<FindingStatus, StatusMeta> = {
  OPEN: { label: 'Chờ phản hồi', tone: 'warning', color: 'warning' },
  CONFIRMED: { label: 'Đã xác nhận', tone: 'processing', color: 'processing' },
  APPEALED: { label: 'Đang khiếu nại', tone: 'warning', color: 'warning' },
  APPEAL_MEETING: { label: 'Họp khiếu nại', tone: 'warning', color: 'magenta' },
  REMEDIATING: { label: 'Đang khắc phục', tone: 'processing', color: 'processing' },
  PENDING_VERIFICATION: { label: 'Chờ thẩm tra', tone: 'warning', color: 'warning' },
  CLOSED: { label: 'Đã đóng', tone: 'success', color: 'success' },
  DISMISSED: { label: 'Đã huỷ bỏ', tone: 'default', color: 'default' },
}

export const FINDING_EVENT_ACTION_META: Record<FindingEventAction, StatusMeta> = {
  CREATED: { label: 'Ghi nhận điểm không phù hợp', tone: 'default', color: 'gray' },
  CONFIRMED: { label: 'Xác nhận vi phạm', tone: 'default', color: 'gray' },
  APPEALED: { label: 'Gửi khiếu nại', tone: 'warning', color: 'gray' },
  APPEAL_REVIEWED: { label: 'Thẩm định viên cho ý kiến', tone: 'processing', color: 'blue' },
  APPEAL_MEETING: { label: 'Chuyển sang họp thống nhất (bất đồng ý kiến)', tone: 'warning', color: 'magenta' },
  APPEAL_UPHELD: { label: 'Bác khiếu nại (Giữ nguyên vi phạm)', tone: 'danger', color: 'gray' },
  APPEAL_DISMISSED: { label: 'Chấp thuận khiếu nại (Huỷ bỏ vi phạm)', tone: 'success', color: 'green' },
  REMEDIATION_PLANNED: { label: 'Lập biện pháp khắc phục', tone: 'processing', color: 'gray' },
  REMEDIATION_SUBMITTED: { label: 'Gửi minh chứng khắc phục', tone: 'processing', color: 'gray' },
  VERIFY_PASSED: { label: 'Thẩm tra đạt (Đóng hồ sơ)', tone: 'success', color: 'green' },
  VERIFY_FAILED: { label: 'Thẩm tra không đạt', tone: 'danger', color: 'red' },
  OVERDUE: { label: 'Quá hạn khắc phục (+1 tần suất vi phạm)', tone: 'danger', color: 'red' },
}

export const INSPECTION_STATUS_TABS: { value: string; label: string }[] = [
  { value: 'ALL', label: 'Tất cả' },
  { value: 'ASSIGNED', label: 'Đã phân công' },
  { value: 'IN_PROGRESS', label: 'Đang đánh giá' },
  { value: 'SUBMITTED', label: 'Đã nộp' },
  { value: 'AWAITING_ACK', label: 'Chờ cơ sở xác nhận' },
  { value: 'COMPLETED', label: 'Hoàn thành' },
  { value: 'CANCELLED', label: 'Đã huỷ' },
]

export const ITEM_RESULT_META: Record<ItemResult, StatusMeta> = {
  PASS: { label: 'Đạt', tone: 'success', color: 'success' },
  FAIL: { label: 'Không đạt', tone: 'danger', color: 'error' },
  NA: { label: 'K/A', tone: 'default', color: 'default' },
  UNRATED: { label: 'Chưa chấm', tone: 'warning', color: 'warning' },
}
