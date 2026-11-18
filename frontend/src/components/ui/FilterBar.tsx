import { ClearOutlined, SearchOutlined } from '@ant-design/icons'
import { Button, Flex, Input } from 'antd'
import { useEffect, useState, type CSSProperties, type ReactNode } from 'react'
import { FilterButton } from '@/components/ui/AppButtons'

export interface FilterBarProps {
  /** Giá trị tìm kiếm */
  searchValue?: string
  searchPlaceholder?: string
  onSearchChange?: (value: string) => void
  debounceMs?: number

  /** Bộ lọc mở rộng */
  children?: ReactNode
  activeFilterCount?: number
  onResetFilters?: () => void

  /** Nút hoặc hành động bổ sung cạnh thanh tìm kiếm */
  extraActions?: ReactNode

  style?: CSSProperties
  className?: string
}

/**
 * Thanh tìm kiếm & lọc chuẩn hoá (FilterBar):
 * - Ô tìm kiếm bo tròn 8px (--radius-sm), viền --apple-input-border.
 * - Nút "Bộ lọc" kèm Badge đếm số lượng bộ lọc kích hoạt.
 * - Hàng lọc nâng cao mở rộng phía dưới dạng lưới auto-fill minmax(180px, 240px).
 */
export function FilterBar({
  searchValue = '',
  searchPlaceholder = 'Tìm kiếm theo từ khoá, mã, tên...',
  onSearchChange,
  debounceMs = 300,

  children,
  activeFilterCount = 0,
  onResetFilters,

  extraActions,
  style,
  className = '',
}: FilterBarProps) {
  const [keyword, setKeyword] = useState(searchValue)
  const [prevSearchValue, setPrevSearchValue] = useState(searchValue)
  const [expanded, setExpanded] = useState(false)

  if (prevSearchValue !== searchValue) {
    setPrevSearchValue(searchValue)
    setKeyword(searchValue)
  }

  // Debounced search callback
  useEffect(() => {
    if (!onSearchChange) return
    const timer = setTimeout(() => {
      if (keyword !== searchValue) {
        onSearchChange(keyword.trim())
      }
    }, debounceMs)
    return () => clearTimeout(timer)
  }, [keyword, debounceMs, onSearchChange, searchValue])

  const hasAdvancedFilters = Boolean(children)

  return (
    <div
      className={`filter-bar-apple ${className}`.trim()}
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 12,
        ...style,
      }}
    >
      {/* Top search & quick action row */}
      <Flex gap={10} align="center" wrap>
        <div style={{ flex: 1, minWidth: 240, maxWidth: 480 }}>
          <Input
            prefix={<SearchOutlined style={{ color: 'var(--apple-placeholder)', fontSize: 15 }} />}
            placeholder={searchPlaceholder}
            value={keyword}
            allowClear
            onChange={(e) => setKeyword(e.target.value)}
            style={{
              height: 38,
              borderRadius: 'var(--radius-sm)',
              borderColor: 'var(--apple-input-border)',
              fontSize: 14,
              boxShadow: 'none',
            }}
          />
        </div>

        {hasAdvancedFilters && (
          <FilterButton
            activeCount={activeFilterCount}
            active={expanded}
            onToggle={() => setExpanded((prev) => !prev)}
          />
        )}

        {(activeFilterCount > 0 || Boolean(keyword)) && onResetFilters && (
          <Button
            type="text"
            icon={<ClearOutlined />}
            onClick={() => {
              setKeyword('')
              onResetFilters()
            }}
            style={{
              height: 38,
              color: 'var(--apple-text-secondary)',
              fontSize: 13.5,
              borderRadius: 'var(--radius-sm)',
            }}
          >
            Đặt lại
          </Button>
        )}

        {extraActions && (
          <Flex align="center" gap={8} style={{ marginLeft: 'auto' }}>
            {extraActions}
          </Flex>
        )}
      </Flex>

      {/* Expandable Advanced Filter Grid */}
      {hasAdvancedFilters && expanded && (
        <div
          style={{
            background: 'var(--apple-surface-hover)',
            border: '1px solid var(--apple-border)',
            borderRadius: 'var(--radius-md)',
            padding: 16,
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))',
            gap: 12,
            alignItems: 'end',
            animation: 'fadeIn 0.2s ease',
          }}
        >
          {children}
        </div>
      )}
    </div>
  )
}
