import { SafetyCertificateOutlined } from '@ant-design/icons'
import { Button, Descriptions, Space } from 'antd'
import { DetailDrawer } from '@/components/feedback/detail'
import { ConfigStatusTag } from '@/features/criteria/components/ConfigStatusTag'
import { RiskLevelView } from '@/features/criteria/components/RiskLevelView'
import type { RiskLevelVersion } from '@/features/criteria/criteria.types'
import { formatDate, formatDateTime } from '@/utils/format-date'

export interface RiskLevelDetailModalProps {
  open: boolean
  version?: RiskLevelVersion | null
  editable?: boolean
  onClose: () => void
  onEdit?: (version: RiskLevelVersion) => void
}

/** Modal xem chi tiết bảng phân loại rủi ro M1–M4. */
export function RiskLevelDetailModal({
  open,
  version,
  editable,
  onClose,
  onEdit,
}: RiskLevelDetailModalProps) {
  if (!version) return null

  return (
    <DetailDrawer
      open={open}
      onClose={onClose}
      icon={<SafetyCertificateOutlined />}
      title={
        <Space size={8}>
          <span>Chi tiết bảng phân loại rủi ro</span>
          <ConfigStatusTag status={version.status} />
        </Space>
      }
      actions={
        editable &&
        onEdit && (
          <Button
            type="primary"
            onClick={() => {
              onClose()
              onEdit(version)
            }}
          >
            {version.status === 'SCHEDULED' ? 'Sửa phiên bản này' : 'Tạo phiên bản mới từ bản này'}
          </Button>
        )
      }
    >
      <Descriptions bordered size="small" column={{ xs: 1, sm: 3 }} style={{ margin: '16px 0 20px' }}>
        <Descriptions.Item label="Ngày bắt đầu hiệu lực">
          <b>{formatDate(version.effectiveFrom)}</b>
        </Descriptions.Item>
        <Descriptions.Item label="Trạng thái">
          <ConfigStatusTag status={version.status} />
        </Descriptions.Item>
        <Descriptions.Item label="Cập nhật lần cuối">
          {[version.updatedByName, version.updatedAt ? formatDateTime(version.updatedAt) : null].filter(Boolean).join(' · ') || '—'}
        </Descriptions.Item>
      </Descriptions>

      <div>
        <div style={{ fontSize: 13.5, fontWeight: 600, marginBottom: 8, color: '#334155' }}>
          Chi tiết các mức phân loại ({version.levels.length} mức)
        </div>
        <RiskLevelView levels={version.levels} />
      </div>
    </DetailDrawer>
  )
}

