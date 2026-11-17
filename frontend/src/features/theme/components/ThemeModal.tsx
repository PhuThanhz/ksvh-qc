import { CheckCircleFilled, LinkOutlined, ReloadOutlined, UploadOutlined } from '@ant-design/icons'
import { Button, Card, Divider, Flex, Input, message, Modal, Typography, Upload } from 'antd'
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
      message.success('Đã áp dụng ảnh nền từ đường dẫn!')
      onClose()
    }
  }

  const handleFileUpload = (file: File) => {
    if (!file.type.startsWith('image/')) {
      message.error('Vui lòng chọn file hình ảnh hợp lệ (PNG, JPG, WebP)!')
      return false
    }
    const reader = new FileReader()
    reader.onload = (e) => {
      const dataUrl = e.target?.result as string
      if (dataUrl) {
        setCustomImageUrl(dataUrl)
        message.success(`Đã áp dụng ảnh nền từ máy tính: ${file.name}!`)
        onClose()
      }
    }
    reader.readAsDataURL(file)
    return false
  }

  const handleResetDefault = () => {
    setTheme('sequoia')
    message.success('Đã đặt lại giao diện Doanh nghiệp chuẩn!')
    onClose()
  }

  return (
    <Modal
      title="Cài đặt hình ảnh giao diện & hình nền"
      open={open}
      onCancel={onClose}
      footer={null}
      width={780}
      centered
      styles={{ body: { paddingBlock: 8 } }}
    >
      <Flex justify="space-between" align="center" style={{ marginBottom: 12 }}>
        <Typography.Paragraph type="secondary" style={{ fontSize: 13, margin: 0 }}>
          Chọn một hình nền từ bộ sưu tập 18 kiệt tác hoặc tải ảnh riêng từ máy tính:
        </Typography.Paragraph>
        <Button
          type="text"
          size="small"
          icon={<ReloadOutlined />}
          onClick={handleResetDefault}
          style={{ fontSize: 12, color: '#64748b' }}
        >
          Đặt lại mặc định
        </Button>
      </Flex>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(4, 1fr)',
          gap: 12,
          maxHeight: 390,
          overflowY: 'auto',
          paddingRight: 4,
          marginBottom: 16,
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
                message.success(`Đã đổi sang hình nền: ${preset.name}!`)
                onClose()
              }}
              style={{
                borderRadius: 10,
                overflow: 'hidden',
                cursor: 'pointer',
                border: isSelected ? '2px solid #0f172a' : '1px solid #e2e8f0',
                boxShadow: isSelected ? '0 0 0 3px rgba(15, 23, 42, 0.15)' : undefined,
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
                        color: '#0f172a',
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

      <Divider style={{ margin: '14px 0' }} />

      <Flex vertical gap={10}>
        <Typography.Text strong style={{ fontSize: 12.5, color: '#334155' }}>
          Tải ảnh của riêng bạn:
        </Typography.Text>
        <Flex gap={8} wrap>
          <Upload
            beforeUpload={handleFileUpload}
            showUploadList={false}
            accept="image/*"
          >
            <Button icon={<UploadOutlined />} style={{ borderRadius: 6 }}>
              Tải ảnh từ máy tính (PNG, JPG, WebP)
            </Button>
          </Upload>
          <Flex gap={6} style={{ flex: 1, minWidth: 260 }}>
            <Input
              prefix={<LinkOutlined style={{ color: '#94a3b8' }} />}
              placeholder="Hoặc dán URL ảnh (https://...)"
              value={customInput}
              onChange={(e) => setCustomInput(e.target.value)}
              onPressEnter={handleApplyCustom}
              style={{ borderRadius: 6 }}
            />
            <Button type="primary" onClick={handleApplyCustom} style={{ borderRadius: 6 }}>
              Áp dụng
            </Button>
          </Flex>
        </Flex>
      </Flex>
    </Modal>
  )
}
