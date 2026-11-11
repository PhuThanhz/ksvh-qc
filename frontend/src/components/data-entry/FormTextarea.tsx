import { Input } from 'antd'
import type { TextAreaProps } from 'antd/es/input'
import type { ReactNode } from 'react'
import type { Control, FieldValues, Path } from 'react-hook-form'
import { FormField } from '@/components/data-entry/FormField'

export interface FormTextareaProps<T extends FieldValues>
  extends Omit<TextAreaProps, 'name' | 'value' | 'onChange' | 'onBlur'> {
  control: Control<T>
  name: Path<T>
  label?: ReactNode
  extra?: ReactNode
  required?: boolean
}

export function FormTextarea<T extends FieldValues>({
  control,
  name,
  label,
  extra,
  required,
  rows = 3,
  ...rest
}: FormTextareaProps<T>) {
  return (
    <FormField
      control={control}
      name={name}
      label={label}
      extra={extra}
      required={required}
      render={(field) => <Input.TextArea rows={rows} {...rest} {...field} value={field.value ?? ''} />}
    />
  )
}
