import { InputNumber, type InputNumberProps } from 'antd'
import type { ClipboardEvent, FormEvent, KeyboardEvent, ReactNode } from 'react'
import type { Control, FieldValues, Path } from 'react-hook-form'
import { FormField } from '@/components/data-entry/FormField'

export interface FormNumberProps<T extends FieldValues>
  extends Omit<InputNumberProps<number>, 'name' | 'value' | 'onChange' | 'onBlur'> {
  control: Control<T>
  name: Path<T>
  label?: ReactNode
  extra?: ReactNode
  required?: boolean
}

/**
 * Ô nhập số. Ô trống trả về null (không phải 0).
 * antd InputNumber vẫn cho gõ chữ (chỉ xoá khi rời ô) → chặn ngay từ phím gõ / dán:
 * chỉ nhận chữ số, dấu "." khi được phép số lẻ (precision ≠ 0), dấu "-" khi được phép số âm (min < 0).
 */
export function FormNumber<T extends FieldValues>({ control, name, label, extra, required, ...rest }: FormNumberProps<T>) {
  const allowDecimal = rest.precision !== 0
  const allowNegative = rest.min == null || Number(rest.min) < 0
  const allowedChar = (ch: string) => /\d/.test(ch) || (allowDecimal && ch === '.') || (allowNegative && ch === '-')
  const valid = (text: string) => [...text].every(allowedChar)

  const onKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    rest.onKeyDown?.(e)
    // Phím điều khiển (Backspace, mũi tên, Tab, Ctrl/Cmd+…) giữ nguyên
    if (e.ctrlKey || e.metaKey || e.altKey || e.key.length !== 1) return
    if (!allowedChar(e.key)) e.preventDefault()
  }
  // Bắt cả ký tự từ bộ gõ tiếng Việt (Telex/VNI) vốn không đi qua keydown như phím thường
  const onBeforeInput = (e: FormEvent<HTMLInputElement>) => {
    const data = (e.nativeEvent as InputEvent).data
    if (data && !valid(data)) e.preventDefault()
  }
  const onPaste = (e: ClipboardEvent<HTMLInputElement>) => {
    if (!valid(e.clipboardData.getData('text').trim())) e.preventDefault()
  }

  return (
    <FormField
      control={control}
      name={name}
      label={label}
      extra={extra}
      required={required}
      render={(field) => (
        <InputNumber<number>
          style={{ width: '100%' }}
          inputMode={allowDecimal ? 'decimal' : 'numeric'}
          spellCheck={false}
          {...rest}
          onKeyDown={onKeyDown}
          onBeforeInput={onBeforeInput}
          onPaste={onPaste}
          value={field.value ?? null}
          onChange={(val) => field.onChange(val ?? null)}
          onBlur={field.onBlur}
        />
      )}
    />
  )
}
