import { Modal } from 'antd'
import { RiskLevelEditor } from '@/features/criteria/components/RiskLevelEditor'
import type { RiskLevel } from '@/features/criteria/criteria.types'
import { formatDate } from '@/utils/format-date'

export interface RiskLevelFormModalProps {
  open: boolean
  source: readonly RiskLevel[]
  effectiveFrom?: string
  onClose: () => void
  onSaved: (effectiveFrom: string) => void
}

/** Modal soạn thảo / tạo phiên bản bảng phân loại rủi ro. */
export function RiskLevelFormModal({
  open,
  source,
  effectiveFrom,
  onClose,
  onSaved,
}: RiskLevelFormModalProps) {
  return (
    <Modal
      open={open}
      title={
        <span style={{ fontSize: 16, fontWeight: 700 }}>
          {effectiveFrom ? `Sửa bảng phân loại (Hiệu lực từ ${formatDate(effectiveFrom)})` : 'Tạo bảng phân loại rủi ro mới'}
        </span>
      }
      width={1060}
      footer={null}
      onCancel={onClose}
      destroyOnHidden
    >
      <div style={{ marginTop: 16 }}>
        <RiskLevelEditor
          source={source}
          effectiveFrom={effectiveFrom}
          isModal
          onCancel={onClose}
          onSaved={(d) => {
            onSaved(d)
            onClose()
          }}
        />
      </div>
    </Modal>
  )
}
