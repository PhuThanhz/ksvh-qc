import { Input, type InputProps } from 'antd'
import type { ReactNode } from 'react'
import type { Control, FieldValues, Path } from 'react-hook-form'
import { FormField } from '@/components/data-entry/FormField'

export interface FormInputProps<T extends FieldValues>
  extends Omit<InputProps, 'name' | 'value' | 'onChange' | 'onBlur' | 'type'> {
  control: Control<T>
  name: Path<T>
  label?: ReactNode
  type?: 'text' | 'password' | 'email' | 'tel'
}

export function FormInput<T extends FieldValues>({ control, name, label, type = 'text', required, ...rest }: FormInputProps<T>) {
  return (
    <FormField
      control={control}
      name={name}
      label={label}
      required={required}
      render={(field) =>
        type === 'password' ? (
          <Input.Password {...rest} {...field} value={field.value ?? ''} />
        ) : (
          <Input {...rest} {...field} type={type} value={field.value ?? ''} />
        )
      }
    />
  )
}
