import { InputNumber, type InputNumberProps } from 'antd'
import type { ReactNode } from 'react'
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

/** Ô nhập số. Ô trống trả về null (không phải 0). */
export function FormNumber<T extends FieldValues>({ control, name, label, extra, required, ...rest }: FormNumberProps<T>) {
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
          {...rest}
          value={field.value ?? null}
          onChange={(val) => field.onChange(val ?? null)}
          onBlur={field.onBlur}
        />
      )}
    />
  )
}
