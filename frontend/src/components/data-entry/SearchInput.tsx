import { SearchOutlined } from '@ant-design/icons'
import { Input } from 'antd'
import { useEffect, useRef, useState } from 'react'
import { SEARCH_DEBOUNCE_MS } from '@/constants/app.constants'

export interface SearchInputProps {
  value?: string
  defaultValue?: string
  placeholder?: string
  maxWidth?: number | string
  style?: React.CSSProperties
  /** Gọi sau khi người dùng ngừng gõ SEARCH_DEBOUNCE_MS. */
  onSearch: (keyword: string) => void
}

export function SearchInput({
  value: controlledValue,
  defaultValue = '',
  placeholder = 'Tìm kiếm…',
  maxWidth = 440,
  style,
  onSearch,
}: SearchInputProps) {
  const [inner, setInner] = useState(controlledValue ?? defaultValue)
  const [prevControlled, setPrevControlled] = useState(controlledValue)
  if (controlledValue !== prevControlled) {
    setPrevControlled(controlledValue)
    if (controlledValue !== undefined) {
      setInner(controlledValue)
    }
  }

  const lastEmittedRef = useRef((controlledValue ?? defaultValue).trim())
  const onSearchRef = useRef(onSearch)
  useEffect(() => {
    onSearchRef.current = onSearch
  }, [onSearch])

  useEffect(() => {
    const trimmed = inner.trim()
    if (controlledValue !== undefined) {
      if (trimmed === controlledValue.trim()) return
    } else if (trimmed === lastEmittedRef.current) {
      return
    }
    const id = window.setTimeout(() => {
      lastEmittedRef.current = trimmed
      onSearchRef.current(trimmed)
    }, SEARCH_DEBOUNCE_MS)
    return () => window.clearTimeout(id)
  }, [inner, controlledValue])

  return (
    <Input
      allowClear
      prefix={<SearchOutlined />}
      placeholder={placeholder}
      value={inner}
      onChange={(e) => setInner(e.target.value)}
      style={{ minWidth: 260, maxWidth, flex: '1 1 320px', ...style }}
    />
  )
}
