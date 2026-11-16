import { Flex, Typography } from 'antd'
import type { ReactNode } from 'react'

/** Một dòng tóm tắt phiên bản đang áp dụng, đặt trên bảng phiên bản. */
export function CurrentSummary({ since, text }: { since: string; text: ReactNode }) {
  return (
    <Flex gap={10} align="baseline" style={{ marginBottom: 14, fontSize: 13, color: '#3a3936' }}>
      <span style={{ width: 8, height: 8, borderRadius: 999, background: '#0ca30c', flexShrink: 0, transform: 'translateY(-1px)' }} />
      <span>
        <Typography.Text strong>Đang áp dụng từ {since}.</Typography.Text> {text}
      </span>
    </Flex>
  )
}
