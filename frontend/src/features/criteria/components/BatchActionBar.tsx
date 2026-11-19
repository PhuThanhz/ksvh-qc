import { CheckOutlined, ClearOutlined, FileTextOutlined, PlusOutlined, ThunderboltOutlined } from '@ant-design/icons'
import { Button, Flex, Select, Space, Typography } from 'antd'
import { IMPACT_LEVELS } from '@/features/criteria/criteria.types'

export interface BatchActionBarProps {
  showPasteBox: boolean
  validCount: number
  totalCount: number
  isPending: boolean
  onAddRows: (count: number) => void
  onAutoNumber: () => void
  onClearEmpty: () => void
  onChangeCommonImpact: (impact: number) => void
  onTogglePasteBox: () => void
  onClose: () => void
  onSave: () => void
}

export function BatchActionBar({
  showPasteBox,
  validCount,
  totalCount,
  isPending,
  onAddRows,
  onAutoNumber,
  onClearEmpty,
  onChangeCommonImpact,
  onTogglePasteBox,
  onClose,
  onSave,
}: BatchActionBarProps) {
  return (
    <Flex vertical gap={12} style={{ paddingTop: 6 }}>
      {/* Hàng công cụ thao tác trên bảng */}
      <Flex justify="space-between" align="center" wrap gap={8}>
        <Space size={8} wrap>
          <Button icon={<PlusOutlined />} onClick={() => onAddRows(1)}>
            Thêm 1 dòng
          </Button>
          <Button onClick={() => onAddRows(5)}>
            +5 dòng
          </Button>
          <Button
            icon={<FileTextOutlined />}
            onClick={onTogglePasteBox}
            type={showPasteBox ? 'primary' : 'default'}
            ghost={showPasteBox}
          >
            {showPasteBox ? 'Đóng hộp dán' : 'Dán từ Excel / Word'}
          </Button>
        </Space>

        <Space size={8} wrap>
          <Select
            placeholder="Gán mức chung..."
            style={{ width: 145 }}
            options={IMPACT_LEVELS.map((l) => ({ value: l, label: `Gán tất cả Mức ${l}` }))}
            onChange={onChangeCommonImpact}
            allowClear
          />
          <Button icon={<ThunderboltOutlined />} onClick={onAutoNumber} title="Tự động đánh lại mã liên tục theo thứ tự">
            Đánh lại mã
          </Button>
          <Button icon={<ClearOutlined />} onClick={onClearEmpty} title="Xoá tất cả dòng chưa nhập tên">
            Xoá dòng trống
          </Button>
        </Space>
      </Flex>

      {/* Thanh chân trang (Footer xác nhận) */}
      <Flex
        justify="space-between"
        align="center"
        style={{
          paddingTop: 12,
          borderTop: '1px solid #e2e8f0',
          marginTop: 2,
        }}
      >
        <Flex align="center" gap={8}>
          <Typography.Text style={{ fontSize: 13, color: '#475569' }}>
            Trạng thái:{' '}
            <strong style={{ color: validCount > 0 ? '#1677ff' : '#94a3b8' }}>
              {validCount}
            </strong>{' '}
            / {totalCount} tiêu chí hợp lệ
          </Typography.Text>
        </Flex>

        <Space size={10}>
          <Button onClick={onClose} style={{ minWidth: 80 }}>
            Huỷ bỏ
          </Button>
          <Button
            type="primary"
            loading={isPending}
            disabled={validCount === 0}
            onClick={onSave}
            icon={<CheckOutlined />}
            style={{ minWidth: 150 }}
          >
            Thêm {validCount} tiêu chí
          </Button>
        </Space>
      </Flex>
    </Flex>
  )
}
