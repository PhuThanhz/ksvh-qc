import { Switch, type SwitchProps } from 'antd'
import type { ReactNode } from 'react'
import type { Control, FieldValues, Path } from 'react-hook-form'
import { FormField } from '@/components/data-entry/FormField'

export interface FormSwitchProps<T extends FieldValues>
  extends Omit<SwitchProps, 'checked' | 'onChange'> {
  control: Control<T>
  name: Path<T>
  label?: ReactNode
  extra?: ReactNode
}

export function FormSwitch<T extends FieldValues>({ control, name, label, extra, ...rest }: FormSwitchProps<T>) {
  return (
    <FormField
      control={control}
      name={name}
      label={label}
      extra={extra}
      render={(field) => (
        <Switch
          {...rest}
          checked={Boolean(field.value)}
          onChange={(checked) => field.onChange(checked)}
        />
      )}
    />
  )
}
