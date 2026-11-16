import { Select } from 'antd'
import { useMemo, useState } from 'react'
import { SEARCH_DEBOUNCE_MS } from '@/constants/app.constants'
import { useUsers } from '@/features/users/hooks/useUsers'
import { useDebounce } from '@/hooks/useDebounce'

const PICKER_PAGE_SIZE = 20

/** Người đang được chọn, để hiện tên khi chưa nằm trong trang kết quả tìm kiếm. */
export interface UserOption {
  id: number
  username: string
  fullName: string
}

export interface UserPickerProps {
  /** Chỉ hiện người có role này (server kiểm tra lại khi lưu). Bỏ trống = mọi người dùng. */
  role?: string
  value: number | null
  onChange: (id: number | null) => void
  /** Người đang được gán, để hiện tên ngay cả khi chưa nằm trong trang kết quả tìm kiếm. */
  current?: UserOption | null
  placeholder?: string
}

/** Chọn người dùng (lọc theo vai trò nếu có), tìm trên server (không tải hết danh sách). */
export function UserPicker({ role, value, onChange, current, placeholder }: UserPickerProps) {
  const [keyword, setKeyword] = useState('')
  const debounced = useDebounce(keyword, SEARCH_DEBOUNCE_MS)
  const users = useUsers({ page: 0, size: PICKER_PAGE_SIZE, role, keyword: debounced || undefined })

  const options = useMemo(() => {
    const list = (users.data?.items ?? [])
      .filter((u) => u.active)
      .map((u) => ({ value: u.id, label: `${u.fullName} (${u.username})` }))
    if (current && !list.some((o) => o.value === current.id)) {
      list.unshift({ value: current.id, label: `${current.fullName} (${current.username})` })
    }
    return list
  }, [users.data, current])

  return (
    <Select<number>
      showSearch={{ filterOption: false, onSearch: setKeyword }}
      allowClear
      placeholder={placeholder}
      loading={users.isFetching}
      options={options}
      value={value ?? undefined}
      onChange={(v) => onChange(v ?? null)}
      onOpenChange={(open) => {
        if (!open) setKeyword('')
      }}
      notFoundContent={users.isFetching ? 'Đang tìm…' : 'Không có người phù hợp'}
    />
  )
}
