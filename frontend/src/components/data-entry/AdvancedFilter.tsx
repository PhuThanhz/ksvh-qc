import { CloseCircleOutlined, FilterOutlined, ReloadOutlined } from '@ant-design/icons'
import { Badge, Button, Flex, Tag, Typography } from 'antd'
import { useState, type ReactNode } from 'react'
import { SearchInput, type SearchInputProps } from '@/components/data-entry/SearchInput'
import { usePageActionsSlot } from '@/components/layout/pageActions'

export interface FilterTagItem {
  key: string
  label: string
  onClose: () => void
}

export interface AdvancedFilterProps {
  /** Cấu hình ô tìm kiếm từ khoá */
  search?: Pick<SearchInputProps, 'value' | 'defaultValue' | 'placeholder' | 'maxWidth' | 'onSearch'>

  /** Bộ lọc nhanh luôn hiển thị hoặc nằm trong panel mở rộng */
  children?: ReactNode

  /** Bộ lọc nâng cao nằm trong panel mở rộng (nếu có) */
  advancedFilters?: ReactNode

  /** Số lượng bộ lọc đang hoạt động */
  activeCount?: number

  /** Gọi khi bấm "Đặt lại" */
  onReset?: () => void

  /** Danh sách tag hiển thị các bộ lọc đang áp dụng (có nút x để xoá nhanh) */
  activeTags?: FilterTagItem[]

  /** Nội dung phụ bên dưới thanh tìm kiếm */
  extra?: ReactNode

  /** Trạng thái mở mặc định của panel nâng cao */
  defaultExpanded?: boolean

  /** Nội dung đặt trên thanh chính, vd thanh chuyển tab trạng thái (Segmented) */
  top?: ReactNode
}

/**
 * Component bộ lọc nâng cao dùng chung toàn hệ thống:
 * - Hàng 1: Ô tìm kiếm kéo dài full-width bên trái · Nút Thêm mới (pageActions) nằm ngay góc phải cùng hàng.
 * - Hàng 2: Nút [Bộ lọc] (và [Đặt lại]) nằm gọn ở bên trái ngay dưới ô tìm kiếm.
 * - Hàng 3 (khi bấm "Bộ lọc"): Các ô điều kiện lọc nằm thẳng hàng.
 */
export function AdvancedFilter({
  search,
  children,
  advancedFilters,
  activeCount = 0,
  onReset,
  activeTags = [],
  extra,
  defaultExpanded = false,
  top,
}: AdvancedFilterProps) {
  const [expanded, setExpanded] = useState(defaultExpanded || activeCount > 0)
  const pageActions = usePageActionsSlot()
  const showReset = Boolean(onReset && activeCount > 0)
  const hasFilters = Boolean(children || advancedFilters)

  return (
    <div className="advanced-filter">
      <Flex vertical gap={10}>
        {top}
        {/* Hàng 1: Ô tìm kiếm kéo dài bên trái · Nút Thêm mới (pageActions) nằm ngay góc phải cùng hàng */}
        <Flex align="center" gap={10} wrap style={{ width: '100%' }}>
          {search ? (
            <div style={{ flex: 1, minWidth: 260 }}>
              <SearchInput {...search} maxWidth="none" />
            </div>
          ) : (
            hasFilters && (
              <Badge count={activeCount} size="small" offset={[-4, 4]}>
                <Button
                  icon={<FilterOutlined />}
                  className={expanded ? 'filter-toggle filter-toggle--open' : 'filter-toggle'}
                  onClick={() => setExpanded((prev) => !prev)}
                  aria-expanded={expanded}
                >
                  Bộ lọc
                </Button>
              </Badge>
            )
          )}
          {!search && showReset && (
            <Button className="filter-reset" icon={<ReloadOutlined />} onClick={onReset}>
              Đặt lại
            </Button>
          )}
          {(extra || pageActions) && (
            <Flex align="center" gap={8} wrap className="page-actions" style={{ marginInlineStart: 'auto', flexShrink: 0 }}>
              {extra}
              {pageActions}
            </Flex>
          )}
        </Flex>

        {/* Hàng 2: Nút [Bộ lọc] + [Đặt lại] nằm bên trái ngay dưới ô tìm kiếm */}
        {search && (hasFilters || showReset) && (
          <Flex align="center" gap={8} wrap>
            {hasFilters && (
              <Badge count={activeCount} size="small" offset={[-4, 4]}>
                <Button
                  icon={<FilterOutlined />}
                  className={expanded ? 'filter-toggle filter-toggle--open' : 'filter-toggle'}
                  onClick={() => setExpanded((prev) => !prev)}
                  aria-expanded={expanded}
                >
                  Bộ lọc
                </Button>
              </Badge>
            )}
            {showReset && (
              <Button className="filter-reset" icon={<ReloadOutlined />} onClick={onReset}>
                Đặt lại
              </Button>
            )}
          </Flex>
        )}

        {/* Hàng 3 (khi mở Bộ lọc): Các ô lọc nằm thẳng hàng */}
        {hasFilters && expanded && (
          <Flex align="center" gap={8} wrap className="advanced-filter__panel">
            {children}
            {advancedFilters}
          </Flex>
        )}

        {/* Danh sách chip/tag các điều kiện đang lọc */}
        {activeTags.length > 0 && (
          <Flex align="center" gap={6} wrap style={{ paddingTop: 2 }}>
            <Typography.Text type="secondary" style={{ fontSize: 12, marginRight: 4 }}>
              Đang lọc theo:
            </Typography.Text>
            {activeTags.map((tag) => (
              <Tag
                key={tag.key}
                closable
                onClose={tag.onClose}
                closeIcon={<CloseCircleOutlined />}
                style={{ borderRadius: 12, padding: '2px 8px' }}
              >
                {tag.label}
              </Tag>
            ))}
            {showReset && (
              <Button type="link" size="small" onClick={onReset} style={{ fontSize: 12, padding: 0 }}>
                Xoá tất cả
              </Button>
            )}
          </Flex>
        )}
      </Flex>
    </div>
  )
}

