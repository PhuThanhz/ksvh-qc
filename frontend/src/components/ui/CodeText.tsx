import { CopyOutlined, CheckOutlined } from '@ant-design/icons'
import { message, Tooltip } from 'antd'
import { useState, type CSSProperties, type ReactNode } from 'react'

export interface CodeTextProps {
  children: ReactNode
  copyable?: boolean
  copyText?: string
  style?: CSSProperties
  className?: string
}

/**
 * Hiển thị mã chứng từ / SKU / số tiền / ID theo font monospace Apple (SF Mono).
 * Các chữ số và ký tự mã gióng hàng thẳng tắp, có tùy chọn sao chép nhanh 1 chạm.
 */
export function CodeText({
  children,
  copyable = false,
  copyText,
  style,
  className = '',
}: CodeTextProps) {
  const [copied, setCopied] = useState(false)

  const handleCopy = () => {
    const text = copyText ?? (typeof children === 'string' || typeof children === 'number' ? String(children) : '')
    if (!text) return
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true)
      message.success({ content: `Đã sao chép: ${text}`, duration: 1.5 })
      setTimeout(() => setCopied(false), 2000)
    })
  }

  const baseStyle: CSSProperties = {
    fontFamily: 'var(--font-family-code)',
    fontSize: 12.5,
    letterSpacing: '-0.01em',
    background: 'rgba(15, 23, 42, 0.05)',
    border: '1px solid rgba(15, 23, 42, 0.08)',
    borderRadius: 4,
    padding: '2px 6px',
    color: 'var(--apple-text-primary)',
    display: 'inline-flex',
    alignItems: 'center',
    gap: 4,
    ...style,
  }

  if (!copyable) {
    return (
      <code className={`code-badge ${className}`.trim()} style={baseStyle}>
        {children}
      </code>
    )
  }

  return (
    <Tooltip title={copied ? 'Đã sao chép!' : 'Bấm để sao chép mã'}>
      <code
        className={`code-badge ${className}`.trim()}
        style={{
          ...baseStyle,
          cursor: 'pointer',
          userSelect: 'all',
          transition: 'all 0.15s ease',
        }}
        onClick={handleCopy}
      >
        <span>{children}</span>
        {copied ? (
          <CheckOutlined style={{ fontSize: 11, color: 'var(--status-up)' }} />
        ) : (
          <CopyOutlined style={{ fontSize: 11, color: 'var(--apple-text-tertiary)' }} />
        )}
      </code>
    </Tooltip>
  )
}
