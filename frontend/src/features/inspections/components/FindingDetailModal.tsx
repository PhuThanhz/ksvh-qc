import {
  AlertOutlined,
  BarcodeOutlined,
  CalendarOutlined,
  FilePdfOutlined,
  FileProtectOutlined,
  RiseOutlined,
  ShopOutlined,
  SyncOutlined,
  WarningOutlined,
} from '@ant-design/icons'
import { Button, Empty, Skeleton, Tag } from 'antd'
import dayjs from 'dayjs'
import { useState } from 'react'
import { DetailDrawer, DetailSection, type DetailStat, type DetailTab } from '@/components/feedback/detail'
import { FindingAppealPanel, FindingRemediationPanel, FindingSitePanel } from '@/features/inspections/components/FindingDetailPanels'
import { FindingTimeline } from '@/features/inspections/components/FindingTimeline'
import { FINDING_STATUS_TAG, type FindingResponse } from '@/features/inspections/finding.types'
import { useFinding } from '@/features/inspections/hooks/useInspectionData'
import { reportApi } from '@/features/reports/api/report.api'
import { useNotify } from '@/hooks/useNotify'
import { formatDate, formatDateTime } from '@/utils/format-date'

interface Props {
  open: boolean
  findingId?: number
  onClose: () => void
}

const DONE = new Set(['CLOSED', 'DISMISSED'])

function findingStats(f: FindingResponse): DetailStat[] {
  const escalated = f.effectiveImpact != null && f.effectiveImpact > f.baseImpact
  const overdue = !DONE.has(f.status) && f.deadlineDate && dayjs(f.deadlineDate).isBefore(dayjs(), 'day')
  const high = f.riskLevelCode === 'M3' || f.riskLevelCode === 'M4'
  return [
    {
      icon: <AlertOutlined />,
      label: 'Mức rủi ro',
      value: f.riskLevelCode,
      hint: `${f.riskLevelName} · ${f.calculatedScore} điểm`,
      tone: high ? 'danger' : 'warning',
    },
    {
      icon: <RiseOutlined />,
      label: 'Mức ảnh hưởng',
      value: escalated ? `${f.baseImpact} → ${f.effectiveImpact}` : `Mức ${f.baseImpact}`,
      hint: escalated ? 'Đã nâng mức do tái phạm' : 'Theo mức gốc của tiêu chí',
      tone: escalated ? 'warning' : 'default',
    },
    {
      icon: <SyncOutlined />,
      label: 'Tần suất',
      value: `${f.violationCount} lần`,
      hint: 'Trong kỳ đếm, tính cả lần này',
      tone: f.violationCount > 1 ? 'warning' : 'default',
    },
    {
      icon: <CalendarOutlined />,
      label: 'Hạn khắc phục',
      value: f.deadlineDate ? formatDate(f.deadlineDate) : '—',
      hint: overdue ? 'Đã quá hạn' : `${f.remediationDays} ngày theo mức ${f.riskLevelCode}`,
      tone: overdue ? 'danger' : 'info',
    },
  ]
}

function findingTabs(f: FindingResponse): DetailTab[] {
  const tabs: DetailTab[] = [{ key: 'site', label: 'Hiện trường', children: <FindingSitePanel finding={f} /> }]
  if (f.appealReason || f.appealEvidenceUrls) tabs.push({ key: 'appeal', label: 'Khiếu nại', children: <FindingAppealPanel finding={f} /> })
  if (f.remediationPlan || f.remediationEvidenceUrls || f.verifiedByName) {
    tabs.push({ key: 'remediation', label: 'Khắc phục', children: <FindingRemediationPanel finding={f} /> })
  }
  tabs.push({
    key: 'history',
    label: `Lịch sử xử lý (${f.history?.length ?? 0})`,
    children: (
      <DetailSection title="Nhật ký chu trình">
        <FindingTimeline history={f.history} />
      </DetailSection>
    ),
  })
  return tabs
}

/** Chi tiết điểm không phù hợp: hero + chỉ số rủi ro + tab Hiện trường / Khiếu nại / Khắc phục / Lịch sử. */
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

  const status = finding && FINDING_STATUS_TAG[finding.status]
  return (
    <DetailDrawer
      open={open}
      onClose={onClose}
      icon={<WarningOutlined />}
      title="Chi tiết điểm không phù hợp"
      subtitle={finding && `#${finding.id} · biên bản ${finding.inspectionCode}`}
      hero={
        finding && {
          avatar: <span className="detail-hero__avatar--text">{finding.riskLevelCode}</span>,
          eyebrow: 'Điểm không phù hợp',
          title: finding.criterionName,
          status: status && <Tag color={status.color} style={{ margin: 0 }}>{status.label}</Tag>,
          chips: [
            { icon: <ShopOutlined />, label: finding.restaurantName },
            { icon: <BarcodeOutlined />, label: finding.criterionCode },
            { icon: <FileProtectOutlined />, label: `Biên bản ${finding.inspectionCode}` },
          ],
        }
      }
      stats={finding ? findingStats(finding) : undefined}
      tabs={finding ? findingTabs(finding) : undefined}
      audit={finding && { createdAt: formatDateTime(finding.createdAt) }}
      actions={
        finding?.riskLevelCode === 'M4' && (
          <Button danger icon={<FilePdfOutlined />} loading={downloadingPdf} onClick={handleExportM4Pdf}>
            Biên bản M4 (PDF)
          </Button>
        )
      }
    >
      {isLoading && <Skeleton active paragraph={{ rows: 8 }} />}
      {!isLoading && !finding && <Empty description="Không tìm thấy thông tin lỗi" />}
    </DetailDrawer>
  )
}
