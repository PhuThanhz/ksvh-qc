import { Descriptions, Modal, Spin, Typography } from 'antd'
import { AuditActionTag } from '@/features/audit/components/AuditActionTag'
import { useAuditLog } from '@/features/audit/hooks/useAuditLogs'
import { TARGET_LABELS } from '@/features/audit/audit.types'
import { formatDateTime } from '@/utils/format-date'

interface Props {
  logId?: number
  open: boolean
  onClose: () => void
}

export function AuditLogDetailModal({ logId, open, onClose }: Props) {
  const { data: log, isLoading } = useAuditLog(open ? logId : undefined)

  let formattedDetails: string | null = null
  if (log?.details) {
    try {
      formattedDetails = JSON.stringify(JSON.parse(log.details), null, 2)
    } catch {
      formattedDetails = log.details
    }
  }

  return (
    <Modal
      open={open}
      title="Chi tiết nhật ký hệ thống"
      onCancel={onClose}
      footer={null}
      width={720}
      destroyOnHidden
    >
      <Spin spinning={isLoading}>
        {log && (
          <Descriptions bordered column={2} size="small" style={{ marginTop: 16 }}>
            <Descriptions.Item label="Thời gian" span={2}>
              {formatDateTime(log.createdAt)}
            </Descriptions.Item>

            <Descriptions.Item label="Người thực hiện">
              {log.userFullName ? `${log.userFullName} (${log.username})` : (log.username || 'Hệ thống')}
            </Descriptions.Item>

            <Descriptions.Item label="IP truy cập">
              {log.ipAddress || '—'}
            </Descriptions.Item>

            <Descriptions.Item label="Hành động">
              <AuditActionTag action={log.action} />
            </Descriptions.Item>

            <Descriptions.Item label="Đối tượng">
              <span>{TARGET_LABELS[log.targetType] || log.targetType}</span>
              {log.targetId && <strong> : {log.targetId}</strong>}
            </Descriptions.Item>

            <Descriptions.Item label="Nội dung tóm tắt" span={2}>
              <Typography.Text strong>{log.summary}</Typography.Text>
            </Descriptions.Item>

            {formattedDetails && (
              <Descriptions.Item label="Dữ liệu chi tiết" span={2}>
                <pre
                  style={{
                    margin: 0,
                    padding: 8,
                    borderRadius: 4,
                    background: 'var(--app-surface-sunken)',
                    maxHeight: 280,
                    overflowY: 'auto',
                    fontSize: 12,
                    fontFamily: 'monospace',
                  }}
                >
                  {formattedDetails}
                </pre>
              </Descriptions.Item>
            )}
          </Descriptions>
        )}
      </Spin>
    </Modal>
  )
}
