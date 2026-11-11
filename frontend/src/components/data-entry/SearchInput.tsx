import { SearchOutlined } from '@ant-design/icons'
import { Input } from 'antd'
import { useEffect, useRef, useState } from 'react'
import { SEARCH_DEBOUNCE_MS } from '@/constants/app.constants'
import { useDebounce } from '@/hooks/useDebounce'

export interface SearchInputProps {
  value?: string
  defaultValue?: string
  placeholder?: string
  maxWidth?: number
  /** Gọi sau khi người dùng ngừng gõ SEARCH_DEBOUNCE_MS. */
  onSearch: (keyword: string) => void
}

export function SearchInput({
  value: controlledValue,
  defaultValue = '',
  placeholder = 'Tìm kiếm…',
  maxWidth = 320,
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

  const debounced = useDebounce(inner.trim(), SEARCH_DEBOUNCE_MS)
  const lastEmittedRef = useRef((controlledValue ?? defaultValue).trim())

  useEffect(() => {
    if (controlledValue !== undefined) {
      if (debounced !== controlledValue.trim()) {
        onSearch(debounced)
      }
      return
    }
    if (debounced === lastEmittedRef.current) return
    lastEmittedRef.current = debounced
    onSearch(debounced)
  }, [debounced, controlledValue, onSearch])

  return (
    <Input
      allowClear
      prefix={<SearchOutlined />}
      placeholder={placeholder}
      value={inner}
      onChange={(e) => setInner(e.target.value)}
      style={{ maxWidth, minWidth: 220 }}
    />
  )
}
