import { CheckCircleOutlined } from '@ant-design/icons'
import type { InspectionItemResponse } from '@/features/inspections/inspection.types'
import { parseMediaUrls, toMediaUrl } from '@/utils/media-url'

interface Props {
  failedItems: InspectionItemResponse[]
}

export function PrintFailedFindingsTable({ failedItems }: Props) {
  return (
    <div style={{ marginBottom: 20 }}>
      <div
        style={{
          fontSize: 14,
          fontWeight: 700,
          borderLeft: '4px solid #cf1322',
          paddingLeft: 8,
          marginBottom: 10,
          color: '#cf1322',
          textTransform: 'uppercase',
        }}
      >
        3. DANH SÁCH LỖI VI PHẠM CẦN KHẮC PHỤC ({failedItems.length} HẠNG MỤC)
      </div>

      {failedItems.length === 0 ? (
        <div
          style={{
            padding: '16px',
            border: '1px solid #d9f7be',
            background: '#f6ffed',
            color: '#389e0d',
            borderRadius: 4,
            fontSize: 13,
          }}
        >
          <CheckCircleOutlined style={{ marginRight: 6 }} /> <b>Tuyệt vời!</b> Nhà hàng không ghi
          nhận bất kỳ tiêu chí vi phạm nào trong đợt kiểm tra này.
        </div>
      ) : (
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
          <thead>
            <tr style={{ background: '#fafafa' }}>
              <th style={{ padding: '8px', border: '1px solid #e8e8e8', width: 40, textAlign: 'center' }}>
                STT
              </th>
              <th style={{ padding: '8px', border: '1px solid #e8e8e8', width: 90 }}>Mã tiêu chí</th>
              <th style={{ padding: '8px', border: '1px solid #e8e8e8', width: 140 }}>Nhóm</th>
              <th style={{ padding: '8px', border: '1px solid #e8e8e8' }}>Nội dung & Vi phạm</th>
              <th
                style={{ padding: '8px', border: '1px solid #e8e8e8', width: 70, textAlign: 'center' }}
              >
                Trọng số
              </th>
              <th
                style={{ padding: '8px', border: '1px solid #e8e8e8', width: 90, textAlign: 'center' }}
              >
                Đánh giá
              </th>
            </tr>
          </thead>
          <tbody>
            {failedItems.map((item, idx) => {
              const photos = parseMediaUrls(item.evidenceUrls)
              return (
                <tr key={item.id}>
                  <td
                    style={{
                      padding: '8px',
                      border: '1px solid #e8e8e8',
                      textAlign: 'center',
                      fontWeight: 600,
                    }}
                  >
                    {idx + 1}
                  </td>
                  <td
                    style={{
                      padding: '8px',
                      border: '1px solid #e8e8e8',
                      fontFamily: 'monospace',
                      fontWeight: 600,
                    }}
                  >
                    {item.criterionCode}
                  </td>
                  <td style={{ padding: '8px', border: '1px solid #e8e8e8' }}>
                    {item.groupName || '—'}
                  </td>
                  <td style={{ padding: '8px', border: '1px solid #e8e8e8' }}>
                    <div style={{ fontWeight: 600, color: '#111827' }}>{item.criterionName}</div>
                    {item.comment && (
                      <div
                        style={{
                          color: '#cf1322',
                          marginTop: 4,
                          background: '#fff1f0',
                          padding: '4px 8px',
                          borderRadius: 2,
                        }}
                      >
                        <b>Mô tả lỗi:</b> {item.comment}
                      </div>
                    )}
                    {photos.length > 0 && (
                      <div style={{ marginTop: 6, display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                        {photos.map((url, pIdx) => (
                          <img
                            key={pIdx}
                            src={toMediaUrl(url)}
                            alt={`Bằng chứng #${pIdx + 1}`}
                            style={{
                              width: 64,
                              height: 64,
                              objectFit: 'cover',
                              borderRadius: 3,
                              border: '1px solid #d9d9d9',
                            }}
                          />
                        ))}
                      </div>
                    )}
                  </td>
                  <td
                    style={{
                      padding: '8px',
                      border: '1px solid #e8e8e8',
                      textAlign: 'center',
                      fontWeight: 600,
                    }}
                  >
                    {item.baseImpact}/5
                  </td>
                  <td
                    style={{
                      padding: '8px',
                      border: '1px solid #e8e8e8',
                      textAlign: 'center',
                    }}
                  >
                    <span style={{ color: '#cf1322', fontWeight: 700 }}>KHÔNG ĐẠT</span>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      )}
    </div>
  )
}
