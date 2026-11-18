import { CheckCircleOutlined, ExclamationCircleOutlined } from '@ant-design/icons'
import { Image, Space, Tag } from 'antd-mobile'
import { toMediaUrl } from '@/utils/media-url'

interface Props {
  findingId?: number
  findingDescription?: string
  findingEvidenceUrls?: string
  remediationPlan?: string
  remediationEvidenceUrls?: string
}

export function FindingRemediationInfo({
  findingId,
  findingDescription,
  findingEvidenceUrls,
  remediationPlan,
  remediationEvidenceUrls,
}: Props) {
  if (!findingId) return null

  const findingImages = findingEvidenceUrls ? findingEvidenceUrls.split(',').map((u) => u.trim()).filter(Boolean) : []
  const remediationImages = remediationEvidenceUrls
    ? remediationEvidenceUrls.split(',').map((u) => u.trim()).filter(Boolean)
    : []

  return (
    <div
      style={{
        marginTop: 10,
        padding: 10,
        borderRadius: 8,
        background: 'var(--app-surface-sunken)',
        border: '1px solid var(--app-border)',
        fontSize: 12,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
        <Tag color="warning">Nghiệm thu lỗi #{findingId}</Tag>
      </div>

      {findingDescription && (
        <div style={{ marginBottom: 6 }}>
          <div style={{ color: 'var(--app-danger)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 4 }}>
            <ExclamationCircleOutlined /> Lỗi phát hiện ban đầu:
          </div>
          <div style={{ marginTop: 2, color: 'var(--app-text-primary)' }}>{findingDescription}</div>
          {findingImages.length > 0 && (
            <Space wrap style={{ marginTop: 4 }}>
              {findingImages.map((u) => (
                <Image key={u} lazy src={toMediaUrl(u)} width={48} height={48} fit="cover" style={{ borderRadius: 4 }} />
              ))}
            </Space>
          )}
        </div>
      )}

      {remediationPlan && (
        <div style={{ marginTop: 6, borderTop: '1px dashed var(--app-border)', paddingTop: 6 }}>
          <div style={{ color: 'var(--app-success)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 4 }}>
            <CheckCircleOutlined /> Kế hoạch / Kết quả khắc phục từ nhà hàng:
          </div>
          <div style={{ marginTop: 2, color: 'var(--app-text-primary)' }}>{remediationPlan}</div>
          {remediationImages.length > 0 && (
            <Space wrap style={{ marginTop: 4 }}>
              {remediationImages.map((u) => (
                <Image key={u} lazy src={toMediaUrl(u)} width={48} height={48} fit="cover" style={{ borderRadius: 4 }} />
              ))}
            </Space>
          )}
        </div>
      )}
    </div>
  )
}
