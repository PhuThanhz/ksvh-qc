import { CloseCircleOutlined, DownOutlined, FilterOutlined, ReloadOutlined, UpOutlined } from '@ant-design/icons'
import { Badge, Button, Card, Flex, Tag, Typography } from 'antd'
import { useState, type ReactNode } from 'react'
import { SearchInput, type SearchInputProps } from '@/components/data-entry/SearchInput'

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

  /** Tiêu đề của panel bộ lọc nâng cao (mặc định: 'Bộ lọc nâng cao') */
  panelTitle?: string

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
}

/**
 * Component bộ lọc nâng cao dùng chung toàn hệ thống.
 * Tích hợp tìm kiếm nhanh, bộ lọc mở rộng (collapsible panel), đếm số lượng bộ lọc (Badge),
 * và danh sách chip tag điều kiện lọc có thể xoá nhanh từng mục.
 */
export function AdvancedFilter({
  search,
  children,
  advancedFilters,
  panelTitle = 'Bộ lọc nâng cao',
  activeCount = 0,
  onReset,
  activeTags = [],
  extra,
  defaultExpanded = false,
}: AdvancedFilterProps) {
  const [expanded, setExpanded] = useState(defaultExpanded)
  const showReset = Boolean(onReset && activeCount > 0)
  const hasAdvanced = Boolean(advancedFilters)

  return (
    <div
      style={{
        background: '#ffffff',
        borderRadius: 14,
        border: '1px solid rgba(0, 0, 0, 0.06)',
        boxShadow: '0 1px 3px rgba(0, 0, 0, 0.02), 0 4px 16px -2px rgba(0, 0, 0, 0.04)',
        padding: '14px 18px',
      }}
    >
      <Flex vertical gap={12}>
        {/* Thanh chính */}
      <Flex justify="space-between" align="center" gap={12} wrap>
        <Flex align="center" gap={8} wrap style={{ flex: 1, minWidth: 260 }}>
          {search && <SearchInput {...search} />}
          {children}

          {hasAdvanced && (
            <Badge count={activeCount} size="small" offset={[-4, 4]}>
              <Button
                icon={<FilterOutlined />}
                onClick={() => setExpanded((prev) => !prev)}
                type={expanded ? 'primary' : 'default'}
              >
                Bộ lọc {expanded ? <UpOutlined /> : <DownOutlined />}
              </Button>
            </Badge>
          )}

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

      {/* Panel bộ lọc nâng cao (mở rộng) */}
      {hasAdvanced && expanded && (
        <Card
          size="small"
          styles={{ body: { padding: '12px 16px', backgroundColor: '#fafafa', borderRadius: 8 } }}
        >
          <Flex vertical gap={12}>
            <Flex justify="space-between" align="center">
              <Typography.Text strong style={{ fontSize: 13 }}>
                <FilterOutlined style={{ marginRight: 6 }} />
                {panelTitle}
              </Typography.Text>
              {showReset && (
                <Button type="link" size="small" icon={<ReloadOutlined />} onClick={onReset} style={{ padding: 0 }}>
                  Xoá tất cả bộ lọc
                </Button>
              )}
            </Flex>
            <Flex align="center" gap={12} wrap>
              {advancedFilters}
            </Flex>
          </Flex>
        </Card>
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
              color="blue"
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

