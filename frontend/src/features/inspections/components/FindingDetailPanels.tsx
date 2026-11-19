import { CalendarOutlined, CommentOutlined, FileTextOutlined, ScheduleOutlined, UserOutlined } from '@ant-design/icons'
import { Tag, Typography } from 'antd'
import { DetailItem, DetailSection } from '@/components/feedback/detail'
import { FindingAppealReviewsCard } from '@/features/inspections/components/FindingAppealReviewsCard'
import { FindingEvidenceGallery } from '@/features/inspections/components/FindingEvidenceGallery'
import type { FindingResponse } from '@/features/inspections/finding.types'
import { formatDate, formatDateTime } from '@/utils/format-date'

/** Mô tả lỗi và ảnh hiện trường do Chuyên viên ghi nhận. */
export function FindingSitePanel({ finding }: { finding: FindingResponse }) {
  return (
    <DetailSection title="Hiện trường">
      <Typography.Paragraph style={{ margin: '4px 0 0', fontSize: 14.5 }}>
        {finding.description || <Typography.Text type="secondary">Chuyên viên không ghi mô tả</Typography.Text>}
      </Typography.Paragraph>
      <FindingEvidenceGallery urls={finding.evidenceUrls} title="Ảnh bằng chứng hiện trường" />
    </DetailSection>
  )
}

/** Khiếu nại của nhà hàng, ý kiến thẩm định và kết luận. */
export function FindingAppealPanel({ finding }: { finding: FindingResponse }) {
  return (
    <>
      <DetailSection title="Khiếu nại từ nhà hàng">
        <DetailItem icon={<CommentOutlined />} label="Lý do khiếu nại" value={finding.appealReason} />
        <DetailItem icon={<CalendarOutlined />} label="Thời điểm gửi" value={finding.appealSubmittedAt && formatDateTime(finding.appealSubmittedAt)} />
        <DetailItem
          icon={<FileTextOutlined />}
          label="Kết luận"
          value={
            finding.appealConclusion ? (
              <Tag color={finding.appealConclusion === 'UPHELD' ? 'volcano' : 'green'}>
                {finding.appealConclusion === 'UPHELD' ? 'Bác khiếu nại – giữ nguyên lỗi' : 'Chấp thuận khiếu nại – huỷ lỗi'}
              </Tag>
            ) : (
              'Đang thẩm định'
            )
          }
        />
        {finding.appealConcludedByName && <DetailItem icon={<UserOutlined />} label="Người kết luận" value={finding.appealConcludedByName} />}
        <FindingEvidenceGallery urls={finding.appealEvidenceUrls} title="Bằng chứng khiếu nại" />
      </DetailSection>
      <div style={{ marginTop: 16 }}>
        <FindingAppealReviewsCard finding={finding} />
      </div>
    </>
  )
}

/** Kế hoạch, bằng chứng khắc phục và kết quả nghiệm thu. */
export function FindingRemediationPanel({ finding }: { finding: FindingResponse }) {
  return (
    <DetailSection title="Khắc phục & nghiệm thu">
      <DetailItem icon={<FileTextOutlined />} label="Kế hoạch khắc phục" value={finding.remediationPlan} />
      <DetailItem icon={<ScheduleOutlined />} label="Hẹn hoàn thành" value={finding.remediationTargetDate && formatDate(finding.remediationTargetDate)} />
      <DetailItem
        icon={<CalendarOutlined />}
        label="Nộp bằng chứng lúc"
        value={finding.remediationSubmittedAt && formatDateTime(finding.remediationSubmittedAt)}
      />
      {finding.verifiedByName && (
        <DetailItem
          icon={<UserOutlined />}
          label="Nghiệm thu"
          value={`${finding.verifiedByName}${finding.verifiedAt ? ` · ${formatDateTime(finding.verifiedAt)}` : ''}`}
        />
      )}
      {finding.verificationComment && <DetailItem icon={<CommentOutlined />} label="Nhận xét nghiệm thu" value={finding.verificationComment} />}
      <FindingEvidenceGallery urls={finding.remediationEvidenceUrls} title="Bằng chứng sau khắc phục" />
    </DetailSection>
  )
}
