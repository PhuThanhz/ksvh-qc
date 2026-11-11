import { Select, type SelectProps } from 'antd'

export interface FilterSelectProps<V extends string | number | boolean = string>
  extends Omit<SelectProps<V>, 'onChange' | 'style'> {
  width?: number
  onChange: (value: V | undefined) => void
}

/** Ô chọn lọc chuẩn cho FilterBar: tự bật nút xoá nhanh và giữ kích thước gọn. */
export function FilterSelect<V extends string | number | boolean = string>({
  width = 180,
  allowClear = true,
  onChange,
  ...rest
}: FilterSelectProps<V>) {
  return (
    <Select<V>
      allowClear={allowClear}
      style={{ minWidth: width }}
      onChange={(val) => onChange(val)}
      {...rest}
    />
  )
}
