import { Button, Flex, Input, Space, Typography } from 'antd'

export interface BatchPasteBoxProps {
  pasteText: string
  onChangeText: (text: string) => void
  onClose: () => void
  onApply: () => void
}

export function BatchPasteBox({ pasteText, onChangeText, onClose, onApply }: BatchPasteBoxProps) {
  const lineCount = pasteText.split('\n').filter((l) => l.trim().length > 0).length

  return (
    <div
      style={{
        background: '#f8fafc',
        padding: 14,
        borderRadius: 8,
        border: '1px solid #cbd5e1',
        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.04)',
      }}
    >
      <Flex justify="space-between" align="center" style={{ marginBottom: 8 }}>
        <Typography.Text strong style={{ fontSize: 13, color: '#0f172a' }}>
          📋 Dán danh sách tiêu chí kiểm soát (mỗi dòng là một tiêu chí):
        </Typography.Text>
        {lineCount > 0 && (
          <Typography.Text style={{ fontSize: 12, color: '#2563eb', fontWeight: 600 }}>
            Đã phát hiện: {lineCount} dòng
          </Typography.Text>
        )}
      </Flex>
      <Input.TextArea
        rows={4}
        placeholder={'Dán danh sách từ Word hoặc Excel vào đây...\nVí dụ:\nSàn nhà sạch sẽ, không trơn trượt\nThùng rác có nắp đậy kín\nNhân viên đeo thẻ đúng quy định'}
        value={pasteText}
        onChange={(e) => onChangeText(e.target.value)}
        style={{ fontSize: 13, borderRadius: 6 }}
      />
      <Flex justify="space-between" align="center" style={{ marginTop: 10 }}>
        <Typography.Text type="secondary" style={{ fontSize: 12 }}>
          💡 Hệ thống sẽ tự động loại bỏ số thứ tự, gạch đầu dòng và tự sinh mã tiêu chí liên tục.
        </Typography.Text>
        <Space size={8}>
          <Button size="small" onClick={onClose}>
            Đóng
          </Button>
          <Button size="small" type="primary" disabled={!pasteText.trim()} onClick={onApply}>
            Nạp vào bảng {lineCount > 0 ? `(${lineCount} dòng)` : ''}
          </Button>
        </Space>
      </Flex>
    </div>
  )
}
