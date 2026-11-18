import { Input, Modal } from 'antd'

export interface CancelInspectionModalProps {
  open: boolean
  reason: string
  loading: boolean
  onChangeReason: (val: string) => void
  onConfirm: () => void
  onCancel: () => void
}

export function CancelInspectionModal({
  open,
  reason,
  loading,
  onChangeReason,
  onConfirm,
  onCancel,
}: CancelInspectionModalProps) {
  return (
    <Modal
      title="Xác nhận huỷ phiếu kiểm tra"
      open={open}
      onCancel={onCancel}
      onOk={onConfirm}
      okText="Huỷ phiếu"
      okButtonProps={{ danger: true, loading }}
      centered
    >
      <p style={{ marginTop: 12 }}>Bạn có chắc chắn muốn huỷ phiếu kiểm tra này? Thao tác sẽ huỷ toàn bộ dữ liệu.</p>
      <Input.TextArea
        rows={3}
        placeholder="Nhập lý do huỷ phiếu bắt buộc..."
        value={reason}
        onChange={(e) => onChangeReason(e.target.value)}
      />
    </Modal>
  )
}
