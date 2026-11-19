import { EllipsisOutlined, SnippetsOutlined } from '@ant-design/icons'
import { Button, Dropdown, Flex, Typography } from 'antd'
import { IMPACT_DOT } from './batchCriterion.types'

export interface BatchToolbarProps {
  count: number
  pasteOpen: boolean
  onTogglePaste: () => void
  onApplyImpact: (impact: number) => void
  onClearEmpty: () => void
}

/** Dòng công cụ nhỏ phía trên danh sách: số tiêu chí, dán danh sách, thao tác phụ. */
export function BatchToolbar({ count, pasteOpen, onTogglePaste, onApplyImpact, onClearEmpty }: BatchToolbarProps) {
  return (
    <Flex justify="space-between" align="center" style={{ marginBottom: 8 }}>
      <Typography.Text type="secondary" style={{ fontSize: 12.5 }}>
        {count > 0 ? `${count} tiêu chí` : 'Danh sách tiêu chí'}
      </Typography.Text>
      <Flex gap={4}>
        <Button type="text" size="small" icon={<SnippetsOutlined />} onClick={onTogglePaste} className={pasteOpen ? 'is-active-text' : undefined}>
          Dán danh sách
        </Button>
        <Dropdown
          trigger={['click']}
          menu={{
            items: [
              {
                key: 'impact',
                label: 'Đặt mức ảnh hưởng cho tất cả',
                children: [1, 2, 3, 4, 5].map((v) => ({
                  key: `impact-${v}`,
                  label: (
                    <span className="impact-pill"><i style={{ background: IMPACT_DOT[v] }} />Mức {v}</span>
                  ),
                  onClick: () => onApplyImpact(v),
                })),
              },
              { key: 'clear', label: 'Xoá các dòng trống', onClick: onClearEmpty },
            ],
          }}
        >
          <Button type="text" size="small" icon={<EllipsisOutlined />} aria-label="Thao tác khác" />
        </Dropdown>
      </Flex>
    </Flex>
  )
}
