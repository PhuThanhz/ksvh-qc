import { CloseCircleOutlined, DownOutlined, FilterOutlined, ReloadOutlined, UpOutlined } from '@ant-design/icons'
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

  /** Bộ lọc nhanh luôn hiển thị trên thanh chính */
  children?: ReactNode

  /** Bộ lọc nâng cao nằm trong panel mở rộng (nếu có) */
  advancedFilters?: ReactNode


  /** Số lượng bộ lọc đang hoạt động */
  activeCount?: number

  /** Gọi khi bấm "Đặt lại" */
  onReset?: () => void

  /** Danh sách tag hiển thị các bộ lọc đang áp dụng (có nút x để xoá nhanh) */
  activeTags?: FilterTagItem[]

  /** Nút hành động bên phải (ví dụ: Thêm mới, Xuất Excel) */
  extra?: ReactNode

  /** Trạng thái mở mặc định của panel nâng cao */
  defaultExpanded?: boolean

  /** Nội dung đặt trên thanh chính, vd thanh chuyển tab trạng thái (Segmented) */
  top?: ReactNode
}

/**
 * Component bộ lọc nâng cao dùng chung toàn hệ thống — nằm trực tiếp trên nền trang (không khung), phía trên khối bảng (TableCard/DataTable).
 * Tích hợp tìm kiếm nhanh, bộ lọc mở rộng (collapsible panel), đếm số lượng bộ lọc (Badge),
 * và danh sách chip tag điều kiện lọc có thể xoá nhanh từng mục.
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
  // Mặc định thu gọn; đang có bộ lọc bật sẵn (vd mở từ link có ?status=) thì mở sẵn để thấy.
  const [expanded, setExpanded] = useState(defaultExpanded || activeCount > 0)
  // Nút hành động của trang (Thêm, Excel…) luôn nằm góc phải hàng tìm kiếm.
  const pageActions = usePageActionsSlot()
  const showReset = Boolean(onReset && activeCount > 0)
  const hasFilters = Boolean(children || advancedFilters)

  return (
    <div className="advanced-filter">
      <Flex vertical gap={12}>
        {top}
        {/* Hàng 1: ô tìm kiếm dài full-width (trái) · nút hành động của trang (phải) */}
        <Flex align="center" gap={12} wrap style={{ width: '100%' }}>
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
                  Bộ lọc {expanded ? <UpOutlined /> : <DownOutlined />}
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

        {/* Hàng 2: Nút [Bộ lọc] + Nút [Đặt lại] khi có ô tìm kiếm */}
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
                  Bộ lọc {expanded ? <UpOutlined /> : <DownOutlined />}
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

        {/* Hàng 3 (bấm "Bộ lọc" mới hiện): các ô lọc nằm thẳng hàng */}
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

