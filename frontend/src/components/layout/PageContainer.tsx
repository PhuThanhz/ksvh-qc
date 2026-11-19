import { Flex, Typography } from 'antd'
import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react'
import { PageActionsContext } from '@/components/layout/pageActions'

export interface PageContainerProps {
  title: string
  subtitle?: ReactNode
  /**
   * Nút hành động của trang (Thêm, Excel…). Nếu trang có thanh tìm kiếm/lọc (AdvancedFilter),
   * nút tự nằm ở góc phải hàng đó; không có thì nằm góc phải tiêu đề.
   */
  extra?: ReactNode
  children: ReactNode
}

/** Khung chuẩn của mọi trang /admin: tiêu đề trên ảnh nền, nút hành động luôn ở góc phải. */
export function PageContainer({ title, subtitle, extra, children }: PageContainerProps) {
  useEffect(() => {
    document.title = `${title} · KSVH QC`
  }, [title])

  // Số thanh lọc đang nhận nút hành động; > 0 thì không vẽ nút trên đầu trang.
  const [slotCount, setSlotCount] = useState(0)
  const claim = useCallback(() => {
    setSlotCount((n) => n + 1)
    return () => setSlotCount((n) => n - 1)
  }, [])
  const ctx = useMemo(() => ({ actions: extra, claim }), [extra, claim])
  const showHeaderActions = Boolean(extra) && slotCount === 0

  return (
    <PageActionsContext.Provider value={ctx}>
    <Flex vertical gap={16}>
      <div className="page-header page-container-header" style={{ marginBottom: 4 }}>
        <Flex justify="space-between" align="center" gap={12} wrap>
          <div>
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
          {showHeaderActions && (
            <Flex align="center" gap={8} wrap className="page-actions" style={{ maxWidth: '100%' }}>
              {extra}
            </Flex>
          )}
        </Flex>
      </div>
      {children}
    </Flex>
    </PageActionsContext.Provider>
  )
}
