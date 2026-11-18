import { Button, Flex, Input, Typography } from 'antd'

export interface BatchPasteBoxProps {
  pasteText: string
  onChangeText: (text: string) => void
  onClose: () => void
  onApply: () => void
}

export function BatchPasteBox({ pasteText, onChangeText, onClose, onApply }: BatchPasteBoxProps) {
  return (
    <div
      style={{
        background: 'var(--app-surface-muted)',
        padding: 12,
        borderRadius: 6,
        border: '1px dashed var(--app-border-strong)',
      }}
    >
      <Typography.Text strong style={{ fontSize: 13, display: 'block', marginBottom: 6 }}>
        Dán danh sách tiêu chí vào đây (mỗi dòng là 1 tiêu chí con):
      </Typography.Text>
      <Input.TextArea
        rows={4}
        placeholder={'Sàn nhà sạch sẽ, khô ráo\nThùng rác có nắp đậy kín\nNhân viên đeo thẻ đúng quy định'}
        value={pasteText}
        onChange={(e) => onChangeText(e.target.value)}
      />
      <Flex justify="flex-end" gap={8} style={{ marginTop: 8 }}>
        <Button size="small" onClick={onClose}>
          Đóng
        </Button>
        <Button size="small" type="primary" disabled={!pasteText.trim()} onClick={onApply}>
          Nạp vào bảng
        </Button>
      </Flex>
    </div>
  )
}
