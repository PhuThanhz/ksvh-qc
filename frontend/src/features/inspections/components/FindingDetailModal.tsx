import { FilePdfOutlined } from '@ant-design/icons'
import { Button, Card, Descriptions, Empty, Flex, Image, Modal, Space, Spin, Tag, Typography } from 'antd'
import { useState } from 'react'
import { FindingAppealReviewsCard } from '@/features/inspections/components/FindingAppealReviewsCard'
import { FindingTimeline } from '@/features/inspections/components/FindingTimeline'
import { FINDING_STATUS_TAG } from '@/features/inspections/finding.types'
import { useFinding } from '@/features/inspections/hooks/useInspectionData'
import { reportApi } from '@/features/reports/api/report.api'
import { useNotify } from '@/hooks/useNotify'
import { formatDate } from '@/utils/format-date'
import { isVideoUrl, parseMediaUrls, toMediaUrl } from '@/utils/media-url'

interface Props {
  open: boolean
  findingId?: number
  onClose: () => void
}

function EvidenceGallery({ urls, title }: { urls?: string | null; title: string }) {
  const list = parseMediaUrls(urls)
  if (list.length === 0) return null

  return (
    <div style={{ marginTop: 8 }}>
      <Typography.Text type="secondary" style={{ fontSize: 12, display: 'block', marginBottom: 4 }}>
        {title} ({list.length} tệp):
      </Typography.Text>
      <Space size={8} wrap>
        {list.map((u, idx) => {
          const mediaUrl = toMediaUrl(u)
          if (isVideoUrl(u)) {
            return (
              <video
                key={idx}
                src={mediaUrl}
                controls
                style={{ width: 140, height: 80, borderRadius: 4, objectFit: 'cover', border: '1px solid var(--app-border)' }}
              />
            )
          }
          return (
            <Image
              key={idx}
              src={mediaUrl}
              alt={`${title} #${idx + 1}`}
              loading="lazy"
              width={72}
              height={72}
              style={{ objectFit: 'cover', borderRadius: 4, border: '1px solid var(--app-border)' }}
            />
          )
        })}
      </Space>
    </div>
  )
}

export function FindingDetailModal({ open, findingId, onClose }: Props) {
  const { data: finding, isLoading } = useFinding(findingId)
  const [downloadingPdf, setDownloadingPdf] = useState(false)
  const notify = useNotify()

  const handleExportM4Pdf = async () => {
    if (!finding?.id) return
    setDownloadingPdf(true)
    try {
      const name = await reportApi.exportM4FindingPdf(finding.id)
      notify.success(`Đã xuất biên bản ${name}`)
    } catch {
      notify.error('Không thể xuất biên bản vi phạm M4')
    } finally {
      setDownloadingPdf(false)
    }
  }

  return (
    <Modal
      open={open}
      title={
        <Flex justify="space-between" align="center" style={{ paddingRight: 32 }}>
          <Space>
            <span>Chi tiết lỗi vi phạm #{finding?.id}</span>
            {finding?.status && (
              <Tag color={FINDING_STATUS_TAG[finding.status]?.color}>
                {FINDING_STATUS_TAG[finding.status]?.label}
              </Tag>
            )}
          </Space>
          {finding?.riskLevelCode === 'M4' && (
            <Button
              danger
              size="small"
              icon={<FilePdfOutlined />}
              loading={downloadingPdf}
              onClick={handleExportM4Pdf}
            >
              Biên bản M4 (PDF)
            </Button>
          )}
        </Flex>
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
                <span style={{ color: 'var(--app-text-secondary)', marginLeft: 8 }}>({finding.criterionCode})</span>
              </div>
            </Descriptions.Item>
            <Descriptions.Item label="Mức độ ảnh hưởng">
              Mức {finding.baseImpact}/5
              {finding.effectiveImpact != null && finding.effectiveImpact > finding.baseImpact && (
                <Tag color="warning" style={{ marginLeft: 6 }}>
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

          <FindingAppealReviewsCard finding={finding} />

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
            <FindingTimeline history={finding.history} />
          </Card>
        </Flex>
      ) : (
        <Empty description="Không tìm thấy thông tin lỗi" />
      )}
    </Modal>
  )
}
