import { CheckCircleFilled, LinkOutlined } from '@ant-design/icons'
import { Button, Card, Flex, Input, Modal, Typography } from 'antd'
import { useState } from 'react'
import { AMBIENT_PRESETS } from '../ambient.presets'
import { useAmbientStore } from '../ambient.store'

export interface ThemeModalProps {
  open: boolean
  onClose: () => void
}

export function ThemeModal({ open, onClose }: ThemeModalProps) {
  const currentThemeId = useAmbientStore((s) => s.currentThemeId)
  const customImageUrl = useAmbientStore((s) => s.customImageUrl)
  const setTheme = useAmbientStore((s) => s.setTheme)
  const setCustomImageUrl = useAmbientStore((s) => s.setCustomImageUrl)
  const [customInput, setCustomInput] = useState(customImageUrl)

  const handleApplyCustom = () => {
    if (customInput.trim()) {
      setCustomImageUrl(customInput.trim())
      onClose()
    }
  }

  return (
    <Modal
      title="Thư viện hình nền giao diện (Apple Wallpapers)"
      open={open}
      onCancel={onClose}
      footer={null}
      width={700}
      centered
      styles={{ body: { paddingBlock: 8 } }}
    >
      <Typography.Paragraph type="secondary" style={{ fontSize: 13, marginBottom: 16 }}>
        Chọn hình nền từ bộ sưu tập để Sidebar và Header trong suốt phản chiếu không gian làm việc:
      </Typography.Paragraph>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(4, 1fr)',
          gap: 12,
          marginBottom: 20,
        }}
      >
        {AMBIENT_PRESETS.map((preset) => {
          const isSelected = currentThemeId === preset.id
          return (
            <Card
              key={preset.id}
              hoverable
              onClick={() => {
                setTheme(preset.id)
                onClose()
              }}
              style={{
                borderRadius: 10,
                overflow: 'hidden',
                cursor: 'pointer',
                border: isSelected ? '2px solid #0071e3' : '1px solid rgba(0, 0, 0, 0.08)',
                boxShadow: isSelected ? '0 0 0 3px rgba(0, 113, 227, 0.2)' : undefined,
                transition: 'all 0.2s ease',
              }}
              styles={{ body: { padding: '8px 6px' } }}
              cover={
                <div
                  style={{
                    height: 84,
                    backgroundImage: `url("${preset.thumbnail}")`,
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                    position: 'relative',
                  }}
                >
                  {isSelected && (
                    <CheckCircleFilled
                      style={{
                        position: 'absolute',
                        top: 6,
                        right: 6,
                        color: '#0071e3',
                        fontSize: 18,
                        background: '#ffffff',
                        borderRadius: '50%',
                      }}
                    />
                  )}
                </div>
              }
            >
              <Typography.Text
                strong={isSelected}
                ellipsis
                style={{ fontSize: 11.5, display: 'block', textAlign: 'center' }}
              >
                {preset.name}
              </Typography.Text>
            </Card>
          )
        })}
      </div>

      <Typography.Text type="secondary" style={{ fontSize: 12, display: 'block', marginBottom: 6 }}>
        Hoặc dán URL ảnh nền chất lượng cao của riêng bạn:
      </Typography.Text>
      <Flex gap={8} align="center">
        <Input
          prefix={<LinkOutlined style={{ color: '#8c8c8c' }} />}
          placeholder="Dán link ảnh (https://...)"
          value={customInput}
          onChange={(e) => setCustomInput(e.target.value)}
          onPressEnter={handleApplyCustom}
          style={{ borderRadius: 8 }}
        />
        <Button type="primary" onClick={handleApplyCustom} style={{ borderRadius: 8 }}>
          Áp dụng
        </Button>
      </Flex>
    </Modal>
  )
}
