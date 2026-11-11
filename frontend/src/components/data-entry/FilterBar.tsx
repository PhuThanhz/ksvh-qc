import { ReloadOutlined } from '@ant-design/icons'
import { Button, Flex } from 'antd'
import type { ReactNode } from 'react'
import { SearchInput, type SearchInputProps } from '@/components/data-entry/SearchInput'

export interface FilterBarProps {
  /** Ô tìm kiếm từ khoá (tuỳ chọn). */
  search?: Pick<SearchInputProps, 'value' | 'defaultValue' | 'placeholder' | 'maxWidth' | 'onSearch'>
  /** Các ô lọc bổ sung (FilterSelect, FilterDateRange...). */
  children?: ReactNode
  /** Số bộ lọc đang bật; > 0 sẽ hiện nút Đặt lại. */
  activeCount?: number
  /** Gọi khi bấm "Đặt lại". */
  onReset?: () => void
  /** Hành động bên phải thanh lọc (vd nút Thêm mới, Xuất Excel). */
  extra?: ReactNode
}

/** Thanh bộ lọc dùng chung cho mọi trang danh sách /admin. */
export function FilterBar({ search, children, activeCount = 0, onReset, extra }: FilterBarProps) {
  const showReset = Boolean(onReset && activeCount > 0)

  return (
    <Flex justify="space-between" align="center" gap={12} wrap>
      <Flex align="center" gap={8} wrap style={{ flex: 1, minWidth: 240 }}>
        {search && <SearchInput {...search} />}
        {children}
        {showReset && (
          <Button icon={<ReloadOutlined />} onClick={onReset}>
            Đặt lại ({activeCount})
          </Button>
        )}
      </Flex>
      {extra && (
        <Flex align="center" gap={8} wrap>
          {extra}
        </Flex>
      )}
    </Flex>
  )
}
