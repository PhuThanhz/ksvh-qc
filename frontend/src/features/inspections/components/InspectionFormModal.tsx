import { Modal, Segmented } from 'antd'
import { useState } from 'react'
import { InspectionBatchForm } from '@/features/inspections/components/InspectionBatchForm'
import { InspectionSingleForm } from '@/features/inspections/components/InspectionSingleForm'
import type { InspectionCreateRequest } from '@/features/inspections/inspection.types'

interface Props {
  open: boolean
  onClose: () => void
  initialValues?: Partial<InspectionCreateRequest>
}

export function InspectionFormModal({ open, onClose, initialValues }: Props) {
  const [mode, setMode] = useState<'SINGLE' | 'BATCH'>('SINGLE')

  return (
    <Modal
      open={open}
      title="Khởi tạo phiếu kiểm tra & phân công"
      onCancel={onClose}
      footer={null}
      destroyOnClose
      width={680}
    >
      {!initialValues && (
        <Segmented
          block
          value={mode}
          onChange={(val) => setMode(val as 'SINGLE' | 'BATCH')}
          options={[
            { value: 'SINGLE', label: 'Tạo đơn lẻ (1 nhà hàng)' },
            { value: 'BATCH', label: 'Tạo hàng loạt (Nhiều nhà hàng)' },
          ]}
          style={{ marginTop: 8 }}
        />
      )}

      {mode === 'SINGLE' || initialValues ? (
        <InspectionSingleForm onSuccess={onClose} onCancel={onClose} initialValues={initialValues} />
      ) : (
        <InspectionBatchForm onSuccess={onClose} onCancel={onClose} />
      )}
    </Modal>
  )
}
