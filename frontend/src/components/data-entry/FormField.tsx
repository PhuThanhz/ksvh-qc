import { Form } from 'antd'
import type { ReactNode } from 'react'
import { Controller, type Control, type ControllerRenderProps, type FieldValues, type Path } from 'react-hook-form'

export interface FormFieldProps<T extends FieldValues> {
  control: Control<T>
  name: Path<T>
  label?: ReactNode
  extra?: ReactNode
  required?: boolean
  render: (field: ControllerRenderProps<T, Path<T>>) => ReactNode
}

/** Nối react-hook-form với Form.Item của antd: lỗi zod/server hiện ngay dưới ô nhập. */
export function FormField<T extends FieldValues>({ control, name, label, extra, required, render }: FormFieldProps<T>) {
  return (
    <Controller
      control={control}
      name={name}
      render={({ field, fieldState }) => (
        <Form.Item
          label={label}
          extra={extra}
          required={required}
          validateStatus={fieldState.error ? 'error' : undefined}
          help={fieldState.error?.message}
        >
          {render(field)}
        </Form.Item>
      )}
    />
  )
}
