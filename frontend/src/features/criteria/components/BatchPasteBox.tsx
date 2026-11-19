import { Button, Flex, Input, Space, Typography } from 'antd'
import { parsePasted } from './batchCriterion.types'

export interface BatchPasteBoxProps {
  pasteText: string
  onChangeText: (text: string) => void
  onClose: () => void
  /** replace = thay toàn bộ bảng; append = thêm vào cuối. */
  onApply: (mode: 'replace' | 'append') => void
}

/** Dán danh sách từ Excel (nhiều cột) hoặc Word (mỗi dòng một tiêu chí). */
export function BatchPasteBox({ pasteText, onChangeText, onClose, onApply }: BatchPasteBoxProps) {
  const count = parsePasted(pasteText).length
  return (
    <div className="batch-paste">
      <Flex justify="space-between" align="baseline" wrap gap={8} style={{ marginBottom: 8 }}>
        <Typography.Text strong style={{ fontSize: 13 }}>Dán danh sách tiêu chí</Typography.Text>
        <Typography.Text type="secondary" style={{ fontSize: 12 }}>
          Word: mỗi dòng một tiêu chí · Excel: cột Nội dung | Mức (1–5) | Phương pháp
        </Typography.Text>
      </Flex>
      <Input.TextArea
        autoFocus
        rows={4}
        value={pasteText}
        onChange={(e) => onChangeText(e.target.value)}
        placeholder={'Sàn bếp khô ráo, không đọng nước\t3\tQuan sát khu bếp\nThùng rác có nắp đậy kín\t2\nNhân viên đeo thẻ tên đúng quy định'}
        style={{ fontSize: 13 }}
      />
      <Flex justify="space-between" align="center" style={{ marginTop: 10 }}>
        <Typography.Text type="secondary" style={{ fontSize: 12 }}>
          {count > 0 ? `Nhận được ${count} tiêu chí · số thứ tự, gạch đầu dòng được tự bỏ` : 'Chưa có nội dung'}
        </Typography.Text>
        <Space size={8}>
          <Button size="small" type="text" onClick={onClose}>Đóng</Button>
          <Button size="small" disabled={count === 0} onClick={() => onApply('append')}>Thêm vào cuối</Button>
          <Button size="small" type="primary" disabled={count === 0} onClick={() => onApply('replace')}>
            Thay danh sách ({count})
          </Button>
        </Space>
      </Flex>
    </div>
  )
}
