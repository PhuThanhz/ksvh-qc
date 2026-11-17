import dayjs from 'dayjs'

export interface ComplianceGrade {
  grade: 'A' | 'B' | 'C' | 'FAIL'
  label: string
  color: 'success' | 'processing' | 'warning' | 'error' | 'default'
  description: string
}

/**
 * Xếp loại chất lượng vận hành nhà hàng theo chuẩn F&B quốc tế:
 * - Hạng A (Xuất sắc): Điểm tuân thủ >= 95%, không có lỗi M4.
 * - Hạng B (Đạt chuẩn): Điểm tuân thủ 85% - 94.9%, không có lỗi M4.
 * - Hạng C (Cảnh báo): Điểm tuân thủ 70% - 84.9%, không có lỗi M4.
 * - Không đạt (Trượt / Cần chấn chỉnh): Điểm tuân thủ < 70% hoặc có bất kỳ lỗi nghiêm trọng M4 nào.
 */
export function getComplianceGrade(
  score: number | null | undefined,
  maxRiskLevel?: string | null,
): ComplianceGrade {
  if (score == null) {
    return {
      grade: 'B',
      label: 'Chưa đánh giá',
      color: 'default',
      description: 'Phiếu chưa hoàn thành chấm điểm',
    }
  }

  if (maxRiskLevel === 'M4' || score < 70) {
    return {
      grade: 'FAIL',
      label: maxRiskLevel === 'M4' ? 'Không đạt (Vi phạm M4)' : 'Không đạt (< 70%)',
      color: 'error',
      description: maxRiskLevel === 'M4'
        ? 'Phát hiện vi phạm nghiêm trọng mức M4 (ATTP / Pháp lý / An toàn)'
        : 'Điểm tuân thủ dưới ngưỡng đạt chuẩn vận hành',
    }
  }

  if (score >= 95) {
    return {
      grade: 'A',
      label: 'Hạng A - Xuất sắc',
      color: 'success',
      description: 'Nhà hàng vận hành xuất sắc, tuân thủ vượt trội quy chuẩn',
    }
  }

  if (score >= 85) {
    return {
      grade: 'B',
      label: 'Hạng B - Đạt chuẩn',
      color: 'processing',
      description: 'Nhà hàng đạt chuẩn vận hành hệ thống',
    }
  }

  return {
    grade: 'C',
    label: 'Hạng C - Cảnh báo',
    color: 'warning',
    description: 'Nhiều lỗi vận hành cần chấn chỉnh và khắc phục sớm',
  }
}

/**
 * Tính thời lượng thực hiện đợt kiểm tra tại hiện trường
 * Từ lúc Check-in GPS đến lúc nộp kết quả hoàn thành.
 */
export function formatInspectionDuration(
  startedAt?: string | null,
  endedAt?: string | null,
): string {
  if (!startedAt || !endedAt) return '—'
  const start = dayjs(startedAt)
  const end = dayjs(endedAt)
  const diffMinutes = end.diff(start, 'minute')
  if (diffMinutes < 0) return '—'
  if (diffMinutes < 60) return `${diffMinutes} phút`
  const hours = Math.floor(diffMinutes / 60)
  const mins = diffMinutes % 60
  return `${hours} giờ ${mins > 0 ? `${mins} phút` : ''}`
}
