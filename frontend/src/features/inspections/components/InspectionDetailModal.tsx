import {
  AlertOutlined,
  AppstoreOutlined,
  CalendarOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  FilePdfOutlined,
  FileProtectOutlined,
  PrinterOutlined,
  SafetyCertificateOutlined,
  UserOutlined,
} from '@ant-design/icons'
import { Button, Skeleton, Space, Tag } from 'antd'
import { lazy, Suspense, useState } from 'react'
import { StatusBadge } from '@/components/data-display/StatusBadge'
import { DetailDrawer, type DetailStat } from '@/components/feedback/detail'
import { InspectionCriteriaResults } from '@/features/inspections/components/InspectionCriteriaResults'
import { InspectionOverviewPanel } from '@/features/inspections/components/InspectionOverviewPanel'
import { INSPECTION_STATUS_META } from '@/features/inspections/constants/status'
import { useInspection } from '@/features/inspections/hooks/useInspectionData'
import { INSPECTION_KIND_LABEL, INSPECTION_MODE_LABEL, type InspectionResponse } from '@/features/inspections/inspection.types'
import { formatInspectionDuration, getComplianceGrade } from '@/features/inspections/utils/inspection-metrics'
import { reportApi } from '@/features/reports/api/report.api'
import { useNotify } from '@/hooks/useNotify'
import { formatDate, formatDateTime } from '@/utils/format-date'

const InspectionPrintModal = lazy(() =>
  import('./InspectionPrintModal').then((m) => ({ default: m.InspectionPrintModal })),
)

interface Props {
  open: boolean
  inspectionId?: number
  onClose: () => void
}

function inspectionStats(ins: InspectionResponse): DetailStat[] {
  const grade = getComplianceGrade(ins.complianceScore, ins.maxRiskLevel)
  const score = ins.adjustedComplianceScore ?? ins.complianceScore
  return [
    {
      icon: <SafetyCertificateOutlined />,
      label: 'Điểm tuân thủ',
      value: score == null ? '—' : `${score.toLocaleString('vi-VN')}%`,
      hint: <Tag color={grade.color} style={{ margin: 0 }}>{grade.label}</Tag>,
      tone: score == null ? 'default' : grade.color === 'error' ? 'danger' : grade.color === 'success' ? 'good' : 'warning',
    },
    {
      icon: <CheckCircleOutlined />,
      label: 'Kết quả chấm',
      value: `${ins.passedCriteria}/${ins.totalCriteria} đạt`,
      hint: `${ins.failedCriteria} không đạt · ${ins.naCriteria} không áp dụng`,
      tone: ins.failedCriteria > 0 ? 'warning' : 'good',
    },
    {
      icon: <AlertOutlined />,
      label: 'Điểm rủi ro',
      value: `${ins.totalRiskScore} điểm`,
      hint: ins.maxRiskLevel ? `Mức cao nhất: ${ins.maxRiskLevel}` : 'Không có vi phạm',
      tone: ins.maxRiskLevel === 'M4' || ins.maxRiskLevel === 'M3' ? 'danger' : ins.maxRiskLevel ? 'warning' : 'good',
    },
    {
      icon: <ClockCircleOutlined />,
      label: 'Thời lượng',
      value: ins.checkinAt ? formatInspectionDuration(ins.checkinAt, ins.submittedAt) : '—',
      hint: ins.submittedAt ? `Nộp ${formatDateTime(ins.submittedAt)}` : 'Chưa nộp',
      tone: 'info',
    },
  ]
}

/** Chi tiết biên bản kiểm tra: hero + chỉ số + tab Tổng quan / Tiêu chí đánh giá. */
export function InspectionDetailModal({ open, inspectionId, onClose }: Props) {
  const { data: ins, isLoading } = useInspection(inspectionId)
  const [printOpen, setPrintOpen] = useState(false)
  const [downloadingPdf, setDownloadingPdf] = useState(false)
  const notify = useNotify()

  const handleExportPdf = async () => {
    if (!ins?.id) return
    setDownloadingPdf(true)
    try {
      const name = await reportApi.exportInspectionPdf(ins.id)
      notify.success(`Đã xuất file PDF ${name}`)
    } catch {
      notify.error('Không thể xuất file PDF phiếu kiểm tra')
    } finally {
      setDownloadingPdf(false)
    }
  }

  return (
    <DetailDrawer
      open={open}
      onClose={onClose}
      icon={<FileProtectOutlined />}
      title="Chi tiết biên bản kiểm tra"
      subtitle={ins?.code}
      hero={
        ins && {
          avatar: <FileProtectOutlined />,
          eyebrow: `Biên bản ${ins.code}`,
          title: ins.restaurantName,
          status: <StatusBadge status={ins.status} meta={INSPECTION_STATUS_META} />,
          description: ins.templateName || ins.topicNames.join(', '),
          chips: [
            { icon: <AppstoreOutlined />, label: `${INSPECTION_KIND_LABEL[ins.inspectionType]} · ${INSPECTION_MODE_LABEL[ins.inspectionMode]}` },
            { icon: <UserOutlined />, label: ins.inspectorName },
            ...(ins.checkinAt ? [{ icon: <CalendarOutlined />, label: formatDate(ins.checkinAt) }] : []),
          ],
        }
      }
      stats={ins ? inspectionStats(ins) : undefined}
      tabs={
        ins && [
          { key: 'overview', label: 'Tổng quan', children: <InspectionOverviewPanel ins={ins} /> },
          {
            key: 'items',
            label: `Tiêu chí đánh giá (${ins.items?.length ?? 0})`,
            children: <InspectionCriteriaResults items={ins.items ?? []} loading={isLoading} />,
          },
        ]
      }
      audit={ins && { createdAt: formatDateTime(ins.createdAt), updatedAt: ins.completedAt && formatDateTime(ins.completedAt) }}
      actions={
        ins && (
          <Space size={8}>
            <Button icon={<FilePdfOutlined />} loading={downloadingPdf} onClick={handleExportPdf}>
              Tải PDF
            </Button>
            <Button type="primary" icon={<PrinterOutlined />} onClick={() => setPrintOpen(true)}>
              In biên bản QC
            </Button>
          </Space>
        )
      }
    >
      <Skeleton active loading={isLoading} paragraph={{ rows: 8 }} />
      {ins && printOpen && (
        <Suspense fallback={null}>
          <InspectionPrintModal open={printOpen} inspection={ins} onClose={() => setPrintOpen(false)} />
        </Suspense>
      )}
    </DetailDrawer>
  )
}
