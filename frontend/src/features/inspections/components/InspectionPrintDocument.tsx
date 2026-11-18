import { Tag } from 'antd'
import { ExclamationCircleOutlined } from '@ant-design/icons'
import type { InspectionResponse } from '@/features/inspections/inspection.types'
import { INSPECTION_KIND_LABEL, INSPECTION_MODE_LABEL, LOCATION_STATUS_META } from '@/features/inspections/inspection.types'
import { formatDate } from '@/utils/format-date'
import { formatInspectionDuration, getComplianceGrade } from '@/features/inspections/utils/inspection-metrics'
import { PrintFailedFindingsTable } from './print/PrintFailedFindingsTable'

interface Props {
  inspection: InspectionResponse
}

export function InspectionPrintDocument({ inspection: ins }: Props) {
  const grade = getComplianceGrade(ins.complianceScore, ins.maxRiskLevel)
  const duration = formatInspectionDuration(ins.checkinAt, ins.submittedAt)
  const failedItems = ins.items?.filter((it) => it.result === 'FAIL') || []

  return (
    <div
      id="inspection-printable-doc"
      style={{
        background: '#ffffff',
        padding: '32px 36px',
        borderRadius: 4,
        boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
        color: '#1f1f1f',
        fontFamily: `-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif`,
        lineHeight: 1.5,
      }}
    >
      {/* Header */}
      <div style={{ borderBottom: '2px solid #1890ff', paddingBottom: 16, marginBottom: 20 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <div style={{ fontSize: 13, fontWeight: 700, letterSpacing: 0.5, color: '#1890ff', textTransform: 'uppercase' }}>
              HỆ THỐNG KIỂM SOÁT VẬN HÀNH & AN TOÀN CHẤT LƯỢNG (KSVH - QC)
            </div>
            <h1 style={{ fontSize: 20, fontWeight: 800, margin: '6px 0 2px 0', color: '#111827' }}>
              BIÊN BẢN KIỂM TRA ĐÁNH GIÁ CHẤT LƯỢNG NHÀ HÀNG
            </h1>
            <div style={{ fontSize: 13, color: '#6b7280' }}>OPERATION AUDIT & COMPLIANCE INSPECTION REPORT</div>
          </div>
          <div style={{ textAlign: 'right', fontSize: 12, lineHeight: 1.6 }}>
            <div><b>Mã biên bản:</b> <span style={{ fontFamily: 'monospace', fontWeight: 600 }}>{ins.code}</span></div>
            <div><b>Ngày lập:</b> {formatDate(ins.submittedAt || ins.createdAt)}</div>
            <div><b>Trạng thái:</b> {ins.status}</div>
          </div>
        </div>
      </div>

      {/* Section 1: Store & Audit Meta */}
      <div style={{ marginBottom: 20 }}>
        <div style={{ fontSize: 14, fontWeight: 700, borderLeft: '4px solid #1890ff', paddingLeft: 8, marginBottom: 10, color: '#1f2937', textTransform: 'uppercase' }}>
          1. THÔNG TIN CHUNG (GENERAL AUDIT INFORMATION)
        </div>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12.5 }}>
          <tbody>
            <tr>
              <td style={{ padding: '6px 10px', background: '#fafafa', border: '1px solid #e8e8e8', width: '22%', fontWeight: 600 }}>Nhà hàng:</td>
              <td style={{ padding: '6px 10px', border: '1px solid #e8e8e8', width: '28%', fontWeight: 700, color: '#0958d9' }}>{ins.restaurantName || '—'}</td>
              <td style={{ padding: '6px 10px', background: '#fafafa', border: '1px solid #e8e8e8', width: '22%', fontWeight: 600 }}>Chuyên viên KSVH:</td>
              <td style={{ padding: '6px 10px', border: '1px solid #e8e8e8', width: '28%', fontWeight: 600 }}>{ins.inspectorName || '—'}</td>
            </tr>
            <tr>
              <td style={{ padding: '6px 10px', background: '#fafafa', border: '1px solid #e8e8e8', fontWeight: 600 }}>Loại & Hình thức:</td>
              <td style={{ padding: '6px 10px', border: '1px solid #e8e8e8' }}>
                {INSPECTION_KIND_LABEL[ins.inspectionType]} ({INSPECTION_MODE_LABEL[ins.inspectionMode]})
              </td>
              <td style={{ padding: '6px 10px', background: '#fafafa', border: '1px solid #e8e8e8', fontWeight: 600 }}>Mẫu / Chuyên đề:</td>
              <td style={{ padding: '6px 10px', border: '1px solid #e8e8e8' }}>
                {ins.templateName ?? (ins.topicNames?.join(', ') || 'Đánh giá vận hành')}
              </td>
            </tr>
            <tr>
              <td style={{ padding: '6px 10px', background: '#fafafa', border: '1px solid #e8e8e8', fontWeight: 600 }}>Bắt đầu (Check-in):</td>
              <td style={{ padding: '6px 10px', border: '1px solid #e8e8e8' }}>{formatDate(ins.checkinAt)}</td>
              <td style={{ padding: '6px 10px', background: '#fafafa', border: '1px solid #e8e8e8', fontWeight: 600 }}>Hoàn thành (Nộp):</td>
              <td style={{ padding: '6px 10px', border: '1px solid #e8e8e8' }}>{formatDate(ins.submittedAt)}</td>
            </tr>
            <tr>
              <td style={{ padding: '6px 10px', background: '#fafafa', border: '1px solid #e8e8e8', fontWeight: 600 }}>Thời lượng kiểm tra:</td>
              <td style={{ padding: '6px 10px', border: '1px solid #e8e8e8', fontWeight: 600 }}>{duration}</td>
              <td style={{ padding: '6px 10px', background: '#fafafa', border: '1px solid #e8e8e8', fontWeight: 600 }}>Xác thực GPS:</td>
              <td style={{ padding: '6px 10px', border: '1px solid #e8e8e8' }}>
                {ins.locationStatus ? LOCATION_STATUS_META[ins.locationStatus].label : '—'}
                {ins.checkinDistanceM ? ` (${Math.round(ins.checkinDistanceM)}m)` : ''}
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Section 2: Executive Scoring & Compliance Grade */}
      <div style={{ marginBottom: 20 }}>
        <div style={{ fontSize: 14, fontWeight: 700, borderLeft: '4px solid #1890ff', paddingLeft: 8, marginBottom: 10, color: '#1f2937', textTransform: 'uppercase' }}>
          2. KẾT QUẢ ĐÁNH GIÁ TỔNG THỂ (AUDIT RATING & RISK ASSESSMENT)
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 12 }}>
          <div style={{ border: '1px solid #e8e8e8', borderRadius: 4, padding: '10px 14px', background: '#fafafa', textAlign: 'center' }}>
            <div style={{ fontSize: 12, color: '#6b7280', textTransform: 'uppercase' }}>Điểm tuân thủ</div>
            <div style={{ fontSize: 24, fontWeight: 800, color: ins.complianceScore != null && ins.complianceScore >= 85 ? '#389e0d' : '#cf1322', marginTop: 4 }}>
              {ins.complianceScore != null ? `${ins.complianceScore.toLocaleString('vi-VN')}%` : '—'}
            </div>
          </div>
          <div style={{ border: '1px solid #e8e8e8', borderRadius: 4, padding: '10px 14px', background: '#fafafa', textAlign: 'center' }}>
            <div style={{ fontSize: 12, color: '#6b7280', textTransform: 'uppercase' }}>Xếp loại vận hành</div>
            <div style={{ marginTop: 6 }}>
              <Tag color={grade.color} style={{ fontSize: 13, fontWeight: 700, padding: '2px 10px' }}>
                {grade.label}
              </Tag>
            </div>
          </div>
          <div style={{ border: '1px solid #e8e8e8', borderRadius: 4, padding: '10px 14px', background: '#fafafa', textAlign: 'center' }}>
            <div style={{ fontSize: 12, color: '#6b7280', textTransform: 'uppercase' }}>Tổng điểm rủi ro</div>
            <div style={{ fontSize: 24, fontWeight: 800, color: ins.totalRiskScore > 0 ? '#cf1322' : '#389e0d', marginTop: 4 }}>
              {ins.totalRiskScore} <span style={{ fontSize: 13, fontWeight: 500 }}>điểm</span>
            </div>
          </div>
          <div style={{ border: '1px solid #e8e8e8', borderRadius: 4, padding: '10px 14px', background: '#fafafa', textAlign: 'center' }}>
            <div style={{ fontSize: 12, color: '#6b7280', textTransform: 'uppercase' }}>Mức rủi ro cao nhất</div>
            <div style={{ marginTop: 6 }}>
              {ins.maxRiskLevel ? (
                <Tag color={ins.maxRiskLevel === 'M4' ? 'error' : ins.maxRiskLevel === 'M3' ? 'warning' : 'blue'} style={{ fontSize: 13, fontWeight: 700, padding: '2px 10px' }}>
                  {ins.maxRiskLevel}
                </Tag>
              ) : (
                <Tag color="success" style={{ fontSize: 13, fontWeight: 700, padding: '2px 10px' }}>
                  An toàn (M0)
                </Tag>
              )}
            </div>
          </div>
        </div>

        <div style={{ fontSize: 12, color: '#4b5563', background: '#f9fafb', padding: '8px 12px', borderRadius: 4, border: '1px dashed #d1d5db' }}>
          <b>Chi tiết phân loại tiêu chí:</b> Tổng số: <b>{ins.totalCriteria}</b> mục · Đạt chuẩn: <b style={{ color: '#389e0d' }}>{ins.passedCriteria}</b> · Vi phạm: <b style={{ color: '#cf1322' }}>{ins.failedCriteria}</b> · Không áp dụng (K/A): <b>{ins.naCriteria}</b>.
          {ins.maxRiskLevel === 'M4' && (
            <div style={{ color: '#cf1322', fontWeight: 600, marginTop: 4 }}>
              <ExclamationCircleOutlined /> LƯU Ý ĐẶC BIỆT: Nhà hàng phát hiện vi phạm mức độ M4 (nghiêm trọng về ATTP / Pháp lý), xếp loại chung là KHÔNG ĐẠT.
            </div>
          )}
        </div>
      </div>

      {/* Section 3: Deficiencies / Failed Findings */}
      <PrintFailedFindingsTable failedItems={failedItems} />

      {/* Section 4: Store Remediation Commitment & Notes */}
      <div style={{ marginBottom: 20 }}>
        <div style={{ fontSize: 14, fontWeight: 700, borderLeft: '4px solid #1890ff', paddingLeft: 8, marginBottom: 10, color: '#1f2937', textTransform: 'uppercase' }}>
          4. Ý KIẾN VÀ KẾ HOẠCH HÀNH ĐỘNG CỦA NHÀ HÀNG (STORE REMEDIATION COMMITMENT)
        </div>
        <div style={{ border: '1px solid #e8e8e8', borderRadius: 4, padding: '12px 14px', fontSize: 12.5, minHeight: 70, background: '#fafafa' }}>
          {ins.notes ? (
            <div><b>Ghi chú:</b> {ins.notes}</div>
          ) : (
            <div style={{ color: '#8c8c8c', fontStyle: 'italic' }}>
              Đại diện nhà hàng xác nhận đã kiểm tra thực tế hiện trường cùng Chuyên viên KSVH, đồng ý với các kết quả đánh giá trên và cam kết lập Kế hoạch hành động khắc phục (CAPA) đúng thời hạn.
            </div>
          )}
        </div>
      </div>

      {/* Section 5: Sign-off and Signatures */}
      <div style={{ marginTop: 32, pageBreakInside: 'avoid' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 40, textAlign: 'center' }}>
          <div>
            <div style={{ fontWeight: 700, fontSize: 13, textTransform: 'uppercase' }}>ĐẠI DIỆN CỬA HÀNG / QUẢN LÝ NHÀ HÀNG</div>
            <div style={{ fontSize: 12, color: '#6b7280', fontStyle: 'italic', marginTop: 2 }}>(Ký, ghi rõ họ tên và đóng dấu nếu có)</div>
            <div style={{ height: 75 }} />
            <div style={{ fontWeight: 600, fontSize: 13, borderTop: '1px dashed #d9d9d9', paddingTop: 6, display: 'inline-block', minWidth: 180 }}>
              Họ tên: ............................................
            </div>
          </div>
          <div>
            <div style={{ fontWeight: 700, fontSize: 13, textTransform: 'uppercase' }}>CHUYÊN VIÊN KIỂM SOÁT VẬN HÀNH (QC)</div>
            <div style={{ fontSize: 12, color: '#6b7280', fontStyle: 'italic', marginTop: 2 }}>(Ký và ghi rõ họ tên)</div>
            <div style={{ height: 75 }} />
            <div style={{ fontWeight: 600, fontSize: 13, borderTop: '1px dashed #d9d9d9', paddingTop: 6, display: 'inline-block', minWidth: 180 }}>
              {ins.inspectorName || 'Chuyên viên KSVH'}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
