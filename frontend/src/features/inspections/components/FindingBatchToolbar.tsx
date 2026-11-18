import { CheckCircleOutlined, CloseOutlined, FormOutlined, SafetyCertificateOutlined } from '@ant-design/icons'
import { Button, Card, Flex, Space, Typography } from 'antd'

interface Props {
  selectedCount: number
  canConfirm: boolean
  canPlan: boolean
  canVerify: boolean
  onConfirm: () => void
  onPlan: () => void
  onVerify: () => void
  onClear: () => void
}

export function FindingBatchToolbar({
  selectedCount,
  canConfirm,
  canPlan,
  canVerify,
  onConfirm,
  onPlan,
  onVerify,
  onClear,
}: Props) {
  if (selectedCount === 0) return null

  return (
    <Card
      size="small"
      style={{
        background: 'var(--app-surface-highlight, #e6f4ff)',
        borderColor: '#91caff',
        borderRadius: 8,
      }}
    >
      <Flex align="center" justify="space-between" wrap="wrap" gap={8}>
        <Space>
          <Typography.Text strong style={{ color: '#0958d9' }}>
            Đã chọn {selectedCount} lỗi vi phạm
          </Typography.Text>
          <Button type="text" size="small" icon={<CloseOutlined />} onClick={onClear}>
            Bỏ chọn
          </Button>
        </Space>

        <Space wrap>
          {canConfirm && (
            <Button size="small" type="primary" icon={<CheckCircleOutlined />} onClick={onConfirm}>
              Xác nhận nhận lỗi ({selectedCount})
            </Button>
          )}
          {canPlan && (
            <Button size="small" type="primary" icon={<FormOutlined />} onClick={onPlan}>
              Lập KH khắc phục ({selectedCount})
            </Button>
          )}
          {canVerify && (
            <Button
              size="small"
              type="primary"
              style={{ background: '#52c41a', borderColor: '#52c41a' }}
              icon={<SafetyCertificateOutlined />}
              onClick={onVerify}
            >
              Nghiệm thu đóng lỗi ({selectedCount})
            </Button>
          )}
        </Space>
      </Flex>
    </Card>
  )
}
