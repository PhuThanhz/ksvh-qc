import {
  AuditOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  CloseCircleOutlined,
  ExclamationCircleOutlined,
  FileDoneOutlined,
  FormOutlined,
  RollbackOutlined,
} from '@ant-design/icons'
import { Empty, Flex, Tag, Timeline, Typography } from 'antd'
import type { ReactNode } from 'react'
import { FINDING_STATUS_TAG, type FindingEventAction, type FindingEventResponse } from '@/features/inspections/finding.types'
import { formatDate } from '@/utils/format-date'

const ACTION_META: Record<FindingEventAction, { color: string; icon: ReactNode; label: string }> = {
  CREATED: { color: 'gray', icon: <ExclamationCircleOutlined />, label: 'Phát hiện lỗi vi phạm' },
  CONFIRMED: { color: 'gray', icon: <CheckCircleOutlined />, label: 'Xác nhận nhận lỗi' },
  APPEALED: { color: 'gray', icon: <RollbackOutlined />, label: 'Gửi khiếu nại' },
  APPEAL_REVIEWED: { color: 'blue', icon: <AuditOutlined />, label: 'Thẩm định viên cho ý kiến' },
  APPEAL_MEETING: { color: 'magenta', icon: <AuditOutlined />, label: 'Chuyển sang họp thống nhất (bất đồng ý kiến)' },
  APPEAL_UPHELD: { color: 'gray', icon: <AuditOutlined />, label: 'Bác khiếu nại (Giữ nguyên lỗi)' },
  APPEAL_DISMISSED: { color: 'green', icon: <CheckCircleOutlined />, label: 'Chấp nhận khiếu nại (Huỷ lỗi)' },
  REMEDIATION_PLANNED: { color: 'gray', icon: <FormOutlined />, label: 'Lập kế hoạch khắc phục' },
  REMEDIATION_SUBMITTED: { color: 'gray', icon: <FileDoneOutlined />, label: 'Nộp bằng chứng khắc phục' },
  VERIFY_PASSED: { color: 'green', icon: <CheckCircleOutlined />, label: 'Nghiệm thu đạt (Đóng lỗi)' },
  VERIFY_FAILED: { color: 'red', icon: <CloseCircleOutlined />, label: 'Nghiệm thu không đạt' },
  OVERDUE: { color: 'red', icon: <ClockCircleOutlined />, label: 'Quá hạn khắc phục (+1 tần suất)' },
}

export function FindingTimeline({ history }: { history?: FindingEventResponse[] }) {
  if (!history || history.length === 0) {
    return <Empty description="Chưa có lịch sử thao tác" image={Empty.PRESENTED_IMAGE_SIMPLE} />
  }

  return (
    <Timeline
      mode="left"
      style={{ marginTop: 16 }}
      items={history.map((e) => {
        const meta = ACTION_META[e.action] || { color: 'gray', icon: null, label: e.action }
        return {
          color: meta.color,
          dot: meta.icon,
          children: (
            <div style={{ marginBottom: 8 }}>
              <Flex align="center" gap={8} wrap="wrap">
                <Typography.Text strong style={{ fontSize: 13 }}>{meta.label}</Typography.Text>
                {e.toStatus && (
                  <Tag color={FINDING_STATUS_TAG[e.toStatus]?.color} style={{ margin: 0, fontSize: 11 }}>
                    {FINDING_STATUS_TAG[e.toStatus]?.label}
                  </Tag>
                )}
              </Flex>
              <div style={{ fontSize: 12, color: 'var(--app-text-secondary)', marginTop: 2 }}>
                {formatDate(e.createdAt)} · {e.actorName || 'Hệ thống'}
              </div>
              {e.note && (
                <div style={{ fontSize: 12, color: 'var(--app-text-body)', marginTop: 4, background: 'var(--app-surface-muted)', padding: '4px 8px', borderRadius: 4 }}>
                  {e.note}
                </div>
              )}
            </div>
          ),
        }
      })}
    />
  )
}
