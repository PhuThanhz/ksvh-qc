import { Flex, Typography } from 'antd'
import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react'
import { PageActionsContext } from '@/components/layout/pageActions'

export interface PageContainerProps {
  title: string
  subtitle?: ReactNode
  /**
   * Các nút công cụ nằm ở góc trên cao bên phải ngang hàng tiêu đề trang (VD: Xuất file Excel, Nhập từ Excel, Tải file mẫu...).
   */
  headerExtra?: ReactNode
  /**
   * Nút hành động chính của trang (VD: Thêm mới...). Nếu trang có thanh tìm kiếm/lọc (AdvancedFilter),
   * nút này sẽ nằm ở ngay bên dưới nút Bộ lọc (góc phải); nếu không có thì nằm góc phải tiêu đề.
   */
  extra?: ReactNode
  children: ReactNode
}

/** Khung chuẩn của mọi trang /admin: tiêu đề trên ảnh nền, công cụ Excel góc trên cao, nút Thêm nằm dưới Bộ lọc. */
export function PageContainer({ title, subtitle, headerExtra, extra, children }: PageContainerProps) {
  useEffect(() => {
    document.title = `${title} · KSVH QC`
  }, [title])

  const [slotCount, setSlotCount] = useState(0)
  const claim = useCallback(() => {
    setSlotCount((n) => n + 1)
    return () => setSlotCount((n) => n - 1)
  }, [])
  const ctx = useMemo(() => ({ actions: extra, claim }), [extra, claim])
  const showInlineExtra = Boolean(extra) && slotCount === 0

  return (
    <PageActionsContext.Provider value={ctx}>
      <Flex vertical gap={16}>
        <div className="page-header page-container-header" style={{ marginBottom: 2 }}>
          <Flex justify="space-between" align="flex-start" gap={16}>
            <div style={{ flex: 1, minWidth: 240 }}>
              <Typography.Title
                level={2}
                className="page-title"
                style={{
                  margin: 0,
                  color: '#ffffff',
                  fontWeight: 700,
                  letterSpacing: '-0.02em',
                  fontSize: 24,
                  lineHeight: 1.25,
                  textShadow: '0 1px 2px rgba(0, 0, 0, 0.18)',
                }}
              >
                {title}
              </Typography.Title>
              {subtitle && (
                <Typography.Text
                  className="page-subtitle"
                  style={{
                    color: 'rgba(255, 255, 255, 0.88)',
                    fontWeight: 500,
                    fontSize: 13.5,
                    marginTop: 4,
                    display: 'block',
                    textShadow: '0 1px 2px rgba(0, 0, 0, 0.18)',
                  }}
                >
                  {subtitle}
                </Typography.Text>
              )}
            </div>
            {(Boolean(headerExtra) || showInlineExtra) && (
              <Flex
                align="center"
                justify="flex-end"
                gap={8}
                wrap
                className="page-actions"
                style={{ marginInlineStart: 'auto', flexShrink: 0 }}
              >
                {headerExtra}
                {showInlineExtra && extra}
              </Flex>
            )}
          </Flex>
        </div>
        {children}
      </Flex>
    </PageActionsContext.Provider>
  )
}
