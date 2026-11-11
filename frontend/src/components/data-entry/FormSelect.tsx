import { Select, type SelectProps } from 'antd'
import type { ReactNode } from 'react'
import type { Control, FieldValues, Path } from 'react-hook-form'
import { FormField } from '@/components/data-entry/FormField'

export interface FormSelectProps<T extends FieldValues, V = unknown>
  extends Omit<SelectProps<V>, 'name' | 'value' | 'onChange' | 'onBlur'> {
  control: Control<T>
  name: Path<T>
  label?: ReactNode
  extra?: ReactNode
  required?: boolean
}

export function FormSelect<T extends FieldValues, V = unknown>({
  control,
  name,
  label,
  extra,
  required,
  ...rest
}: FormSelectProps<T, V>) {
  return (
    <FormField
      control={control}
      name={name}
      label={label}
      extra={extra}
      required={required}
      render={(field) => (
        <Select<V>
          {...rest}
          value={field.value}
          onChange={(val) => field.onChange(val)}
          onBlur={field.onBlur}
        />
      )}
    />
  )
}
