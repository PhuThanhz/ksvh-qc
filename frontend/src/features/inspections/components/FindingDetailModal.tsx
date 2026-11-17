import {
  AuditOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  ExclamationCircleOutlined,
  FileDoneOutlined,
  FormOutlined,
  RollbackOutlined,
} from '@ant-design/icons'
import { Card, Descriptions, Empty, Flex, Image, Modal, Space, Spin, Tag, Timeline, Typography } from 'antd'
import type { ReactNode } from 'react'
import { useFinding } from '@/features/inspections/hooks/useInspectionData'
import type { FindingEventAction, FindingEventResponse, FindingStatus } from '@/features/inspections/inspection.types'
import { formatDate } from '@/utils/format-date'
import { parseMediaUrls, toMediaUrl } from '@/utils/media-url'

interface Props {
  open: boolean
  findingId?: number
  onClose: () => void
}

const STATUS_TAG: Record<FindingStatus, { color: string; label: string }> = {
  OPEN: { color: 'warning', label: 'Chờ phản hồi' },
  CONFIRMED: { color: 'blue', label: 'Đã xác nhận' },
  APPEALED: { color: 'purple', label: 'Đang khiếu nại' },
  REMEDIATING: { color: 'orange', label: 'Đang khắc phục' },
  PENDING_VERIFICATION: { color: 'cyan', label: 'Chờ nghiệm thu' },
  CLOSED: { color: 'success', label: 'Đã đóng' },
  DISMISSED: { color: 'default', label: 'Đã huỷ bỏ' },
}

const ACTION_META: Record<FindingEventAction, { color: string; icon: ReactNode; label: string }> = {
  CREATED: { color: 'blue', icon: <ExclamationCircleOutlined />, label: 'Phát hiện lỗi vi phạm' },
  CONFIRMED: { color: 'blue', icon: <CheckCircleOutlined />, label: 'Xác nhận nhận lỗi' },
  APPEALED: { color: 'purple', icon: <RollbackOutlined />, label: 'Gửi khiếu nại' },
  APPEAL_UPHELD: { color: 'volcano', icon: <AuditOutlined />, label: 'Bác khiếu nại (Giữ nguyên lỗi)' },
  APPEAL_DISMISSED: { color: 'green', icon: <CheckCircleOutlined />, label: 'Chấp nhận khiếu nại (Huỷ lỗi)' },
  REMEDIATION_PLANNED: { color: 'orange', icon: <FormOutlined />, label: 'Lập kế hoạch khắc phục' },
  REMEDIATION_SUBMITTED: { color: 'cyan', icon: <FileDoneOutlined />, label: 'Nộp bằng chứng khắc phục' },
  VERIFY_PASSED: { color: 'green', icon: <CheckCircleOutlined />, label: 'Nghiệm thu đạt (Đóng lỗi)' },
  VERIFY_FAILED: { color: 'red', icon: <CloseCircleOutlined />, label: 'Nghiệm thu không đạt' },
}

function EvidenceGallery({ urls, title }: { urls?: string | null; title: string }) {
  const list = parseMediaUrls(urls)
  if (list.length === 0) return null

  return (
    <div style={{ marginTop: 8 }}>
      <Typography.Text type="secondary" style={{ fontSize: 12, display: 'block', marginBottom: 4 }}>
        {title} ({list.length} ảnh):
      </Typography.Text>
      <Image.PreviewGroup>
        <Space size={8} wrap>
          {list.map((u, idx) => (
            <Image
              key={idx}
              src={toMediaUrl(u)}
              alt={`${title} #${idx + 1}`}
              loading="lazy"
              width={72}
              height={72}
              style={{ objectFit: 'cover', borderRadius: 4, border: '1px solid #d9d9d9' }}
            />
          ))}
        </Space>
      </Image.PreviewGroup>
    </div>
  )
}

export function FindingDetailModal({ open, findingId, onClose }: Props) {
  const { data: finding, isLoading } = useFinding(findingId)

  const renderTimeline = (history?: FindingEventResponse[]) => {
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
                  {e.toStatus && <Tag color={STATUS_TAG[e.toStatus]?.color} style={{ margin: 0, fontSize: 11 }}>{STATUS_TAG[e.toStatus]?.label}</Tag>}
                </Flex>
                <div style={{ fontSize: 12, color: '#8c8c8c', marginTop: 2 }}>
                  {formatDate(e.createdAt)} · {e.actorName || 'Hệ thống'}
                </div>
                {e.note && (
                  <div style={{ fontSize: 12, color: '#434343', marginTop: 4, background: '#fafafa', padding: '4px 8px', borderRadius: 4 }}>
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

  return (
    <Modal
      open={open}
      title={
        <Space>
          <span>Chi tiết lỗi vi phạm #{finding?.id}</span>
          {finding?.status && <Tag color={STATUS_TAG[finding.status]?.color}>{STATUS_TAG[finding.status]?.label}</Tag>}
        </Space>
      }
      onCancel={onClose}
      footer={null}
      width={760}
      destroyOnClose
    >
      {isLoading ? (
        <Flex justify="center" align="center" style={{ minHeight: 200 }}>
          <Spin />
        </Flex>
      ) : finding ? (
        <Flex vertical gap={16} style={{ marginTop: 16 }}>
          <Descriptions size="small" bordered column={2}>
            <Descriptions.Item label="Nhà hàng">{finding.restaurantName}</Descriptions.Item>
            <Descriptions.Item label="Mã phiếu kiểm tra">{finding.inspectionCode}</Descriptions.Item>
            <Descriptions.Item label="Tiêu chí" span={2}>
              <div>
                <b>{finding.criterionName}</b>
                <span style={{ color: '#8c8c8c', marginLeft: 8 }}>({finding.criterionCode})</span>
              </div>
            </Descriptions.Item>
            <Descriptions.Item label="Mức độ ảnh hưởng">
              Mức {finding.baseImpact}/5
              {finding.effectiveImpact != null && finding.effectiveImpact > finding.baseImpact && (
                <Tag color="orange" style={{ marginLeft: 6 }}>
                  ▲ Nâng lên mức {finding.effectiveImpact}
                </Tag>
              )}
            </Descriptions.Item>
            <Descriptions.Item label="Tần suất vi phạm">
              Lặp lại <b>{finding.violationCount} lần</b>
            </Descriptions.Item>
            <Descriptions.Item label="Mức rủi ro">
              <Tag color={finding.riskLevelCode === 'M4' ? 'error' : finding.riskLevelCode === 'M3' ? 'warning' : 'blue'}>
                {finding.riskLevelCode} - {finding.riskLevelName} ({finding.calculatedScore} điểm)
              </Tag>
            </Descriptions.Item>
            <Descriptions.Item label="Hạn khắc phục">
              {formatDate(finding.deadlineDate)} ({finding.remediationDays} ngày)
            </Descriptions.Item>
            {finding.verifiedByName && (
              <Descriptions.Item label="Chuyên viên nghiệm thu">{finding.verifiedByName}</Descriptions.Item>
            )}
            {finding.appealConcludedByName && (
              <Descriptions.Item label="Thẩm định khiếu nại">{finding.appealConcludedByName}</Descriptions.Item>
            )}
          </Descriptions>

          <Card size="small" title="Mô tả lỗi vi phạm hiện trường">
            <Typography.Paragraph style={{ margin: 0 }}>
              {finding.description || '—'}
            </Typography.Paragraph>
            <EvidenceGallery urls={finding.evidenceUrls} title="Ảnh bằng chứng hiện trường" />
          </Card>

          {(finding.appealReason || finding.appealEvidenceUrls) && (
            <Card size="small" title="Thông tin khiếu nại từ nhà hàng">
              <Descriptions size="small" column={1}>
                <Descriptions.Item label="Lý do khiếu nại">{finding.appealReason}</Descriptions.Item>
                {finding.appealConclusion && (
                  <Descriptions.Item label="Kết luận khiếu nại">
                    <Tag color={finding.appealConclusion === 'UPHELD' ? 'volcano' : 'green'}>
                      {finding.appealConclusion === 'UPHELD' ? 'Bác khiếu nại (Giữ nguyên lỗi)' : 'Chấp thuận khiếu nại (Huỷ lỗi)'}
                    </Tag>
                  </Descriptions.Item>
                )}
              </Descriptions>
              <EvidenceGallery urls={finding.appealEvidenceUrls} title="Ảnh/Video bằng chứng khiếu nại" />
            </Card>
          )}

          {(finding.remediationPlan || finding.remediationEvidenceUrls) && (
            <Card size="small" title="Kế hoạch & Bằng chứng khắc phục">
              <Descriptions size="small" column={2}>
                <Descriptions.Item label="Kế hoạch khắc phục" span={2}>{finding.remediationPlan}</Descriptions.Item>
                <Descriptions.Item label="Hẹn hoàn thành">{formatDate(finding.remediationTargetDate)}</Descriptions.Item>
                <Descriptions.Item label="Thời điểm nộp BC">{formatDate(finding.remediationSubmittedAt)}</Descriptions.Item>
                {finding.verificationComment && (
                  <Descriptions.Item label="Nhận xét nghiệm thu" span={2}>{finding.verificationComment}</Descriptions.Item>
                )}
              </Descriptions>
              <EvidenceGallery urls={finding.remediationEvidenceUrls} title="Ảnh/Video bằng chứng sau khắc phục" />
            </Card>
          )}

          <Card size="small" title="Lịch sử xử lý & Nhật ký chu trình">
            {renderTimeline(finding.history)}
          </Card>
        </Flex>
      ) : (
        <Empty description="Không tìm thấy thông tin lỗi" />
      )}
    </Modal>
  )
}
