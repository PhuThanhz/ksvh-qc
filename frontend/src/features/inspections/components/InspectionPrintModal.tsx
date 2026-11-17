import { Button, Modal, Space } from 'antd'
import { PrinterOutlined, CloseOutlined } from '@ant-design/icons'
import type { InspectionResponse } from '@/features/inspections/inspection.types'
import { InspectionPrintDocument } from './InspectionPrintDocument'

interface Props {
  open: boolean
  inspection?: InspectionResponse | null
  onClose: () => void
}

export function InspectionPrintModal({ open, inspection: ins, onClose }: Props) {
  if (!ins) return null

  const handlePrint = () => {
    window.print()
  }

  return (
    <Modal
      open={open}
      onCancel={onClose}
      width={900}
      footer={
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: 13, color: '#8c8c8c' }}>
            Biên bản được chuẩn hóa theo chuẩn thanh tra F&B quốc tế (SafetyCulture / Lumiform standard)
          </span>
          <Space>
            <Button icon={<CloseOutlined />} onClick={onClose}>
              Đóng
            </Button>
            <Button type="primary" icon={<PrinterOutlined />} onClick={handlePrint}>
              In biên bản / Xuất PDF
            </Button>
          </Space>
        </div>
      }
      styles={{ body: { maxHeight: '80vh', overflowY: 'auto', background: '#f5f5f5', padding: '16px' } }}
    >
      <style>{`
        @media print {
          body * {
            visibility: hidden !important;
          }
          #inspection-printable-doc, #inspection-printable-doc * {
            visibility: visible !important;
          }
          #inspection-printable-doc {
            position: absolute !important;
            left: 0 !important;
            top: 0 !important;
            width: 100% !important;
            margin: 0 !important;
            padding: 12mm !important;
            background: #ffffff !important;
            color: #000000 !important;
            box-shadow: none !important;
            font-size: 11pt !important;
          }
          .ant-modal-close, .ant-modal-footer, .no-print {
            display: none !important;
          }
          .page-break {
            page-break-before: always;
          }
          @page {
            size: A4 portrait;
            margin: 10mm;
          }
        }
      `}</style>

      <InspectionPrintDocument inspection={ins} />
    </Modal>
  )
}
