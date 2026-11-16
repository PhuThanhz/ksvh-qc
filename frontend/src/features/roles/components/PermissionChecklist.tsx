import { Checkbox, Flex, Typography } from 'antd'
import { groupByModule, moduleLabel, type PermissionInfo } from '@/features/roles/roles.types'

export interface PermissionChecklistProps {
  catalog: readonly PermissionInfo[]
  value: readonly string[]
  onChange: (codes: string[]) => void
  disabled?: boolean
}

/** Chọn permission theo nhóm module; mỗi nhóm có ô "chọn cả nhóm". */
export function PermissionChecklist({ catalog, value, onChange, disabled }: PermissionChecklistProps) {
  const selected = new Set(value)

  const toggle = (codes: readonly string[], on: boolean) => {
    const next = new Set(selected)
    codes.forEach((c) => (on ? next.add(c) : next.delete(c)))
    onChange([...next])
  }

  return (
    <Flex vertical gap={12} style={{ maxHeight: 420, overflowY: 'auto', paddingRight: 8 }}>
      {groupByModule(catalog).map(({ module, items }) => {
        const codes = items.map((p) => p.code)
        const checkedCount = codes.filter((c) => selected.has(c)).length
        return (
          <div key={module}>
            <Checkbox
              disabled={disabled}
              checked={checkedCount === codes.length}
              indeterminate={checkedCount > 0 && checkedCount < codes.length}
              onChange={(e) => toggle(codes, e.target.checked)}
            >
              <Typography.Text strong>{moduleLabel(module)}</Typography.Text>
            </Checkbox>
            <Flex vertical gap={4} style={{ paddingLeft: 24, marginTop: 4 }}>
              {items.map((p) => (
                <Checkbox
                  key={p.code}
                  disabled={disabled}
                  checked={selected.has(p.code)}
                  onChange={(e) => toggle([p.code], e.target.checked)}
                >
                  {p.description} <Typography.Text type="secondary" code>{p.code}</Typography.Text>
                </Checkbox>
              ))}
            </Flex>
          </div>
        )
      })}
    </Flex>
  )
}
