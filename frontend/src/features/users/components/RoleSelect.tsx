import { Select } from 'antd'
import { useRoles } from '@/features/roles'

export interface RoleSelectProps {
  value: string[]
  onChange: (codes: string[]) => void
}

/** Chọn nhiều vai trò (giá trị = mã role). */
export function RoleSelect({ value, onChange }: RoleSelectProps) {
  const roles = useRoles()
  return (
    <Select<string[]>
      mode="multiple"
      placeholder="Chọn vai trò"
      loading={roles.isFetching}
      value={value}
      onChange={onChange}
      showSearch={{ optionFilterProp: 'label' }}
      options={(roles.data ?? []).map((r) => ({ value: r.code, label: r.name }))}
    />
  )
}
