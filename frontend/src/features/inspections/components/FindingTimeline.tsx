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
import { FINDING_EVENT_ACTION_META, FINDING_STATUS_META } from '../constants/status'
import type { FindingEventAction, FindingEventResponse } from '@/features/inspections/finding.types'
import { formatDate } from '@/utils/format-date'

const ACTION_ICONS: Record<FindingEventAction, ReactNode> = {
  CREATED: <ExclamationCircleOutlined />,
  CONFIRMED: <CheckCircleOutlined />,
  APPEALED: <RollbackOutlined />,
  APPEAL_REVIEWED: <AuditOutlined />,
  APPEAL_MEETING: <AuditOutlined />,
  APPEAL_UPHELD: <AuditOutlined />,
  APPEAL_DISMISSED: <CheckCircleOutlined />,
  REMEDIATION_PLANNED: <FormOutlined />,
  REMEDIATION_SUBMITTED: <FileDoneOutlined />,
  VERIFY_PASSED: <CheckCircleOutlined />,
  VERIFY_FAILED: <CloseCircleOutlined />,
  OVERDUE: <ClockCircleOutlined />,
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
        const meta = FINDING_EVENT_ACTION_META[e.action] || { color: 'gray', label: e.action }
        const icon = ACTION_ICONS[e.action] ?? null
        return {
          color: meta.color,
          dot: icon,
          children: (
            <div style={{ marginBottom: 8 }}>
              <Flex align="center" gap={8} wrap="wrap">
                <Typography.Text strong style={{ fontSize: 13 }}>{meta.label}</Typography.Text>
                {e.toStatus && (
                  <Tag color={FINDING_STATUS_META[e.toStatus]?.color} style={{ margin: 0, fontSize: 11 }}>
                    {FINDING_STATUS_META[e.toStatus]?.label}
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
