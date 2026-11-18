import { ClearOutlined, FileTextOutlined, PlusCircleOutlined, PlusOutlined, ThunderboltOutlined } from '@ant-design/icons'
import { Button, Flex, Select, Space } from 'antd'
import { IMPACT_LEVELS } from '@/features/criteria/criteria.types'

export interface BatchActionBarProps {
  showPasteBox: boolean
  validCount: number
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
    <Flex
      justify="space-between"
      align="center"
      wrap="wrap"
      gap={8}
      style={{ paddingTop: 8, borderTop: '1px solid var(--app-border)' }}
    >
      <Space wrap>
        <Button icon={<PlusOutlined />} onClick={() => onAddRows(1)}>
          + 1 dòng
        </Button>
        <Button icon={<PlusCircleOutlined />} onClick={() => onAddRows(5)}>
          + 5 dòng
        </Button>
        <Button icon={<ThunderboltOutlined />} onClick={onAutoNumber}>
          Đánh mã lại
        </Button>
        <Button icon={<ClearOutlined />} onClick={onClearEmpty}>
          Dọn dòng trống
        </Button>
        <Select
          size="small"
          placeholder="Mức chung..."
          style={{ width: 110 }}
          options={IMPACT_LEVELS.map((l) => ({ value: l, label: `Mức ${l}` }))}
          onChange={onChangeCommonImpact}
        />
        <Button icon={<FileTextOutlined />} onClick={onTogglePasteBox}>
          {showPasteBox ? 'Đóng dán' : 'Dán nhanh'}
        </Button>
      </Space>
      <Space>
        <Button onClick={onClose}>Huỷ bỏ</Button>
        <Button type="primary" loading={isPending} disabled={validCount === 0} onClick={onSave}>
          Lưu {validCount} tiêu chí
        </Button>
      </Space>
    </Flex>
  )
}
