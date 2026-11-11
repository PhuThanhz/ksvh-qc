import { DatePicker, type DatePickerProps } from 'antd'
import dayjs from 'dayjs'
import type { ReactNode } from 'react'
import type { Control, FieldValues, Path } from 'react-hook-form'
import { FormField } from '@/components/data-entry/FormField'

export interface FormDatePickerProps<T extends FieldValues>
  extends Omit<DatePickerProps, 'name' | 'value' | 'defaultValue' | 'onChange' | 'onBlur' | 'multiple' | 'onOk'> {
  control: Control<T>
  name: Path<T>
  label?: ReactNode
  extra?: ReactNode
  required?: boolean
  /** Định dạng chuỗi lưu vào form state (mặc định YYYY-MM-DD). */
  valueFormat?: string
}

export function FormDatePicker<T extends FieldValues>({
  control,
  name,
  label,
  extra,
  required,
  format = 'DD/MM/YYYY',
  valueFormat = 'YYYY-MM-DD',
  ...rest
}: FormDatePickerProps<T>) {
  return (
    <FormField
      control={control}
      name={name}
      label={label}
      extra={extra}
      required={required}
      render={(field) => (
        <DatePicker
          {...rest}
          format={format}
          style={{ width: '100%' }}
          value={field.value ? dayjs(field.value) : null}
          onChange={(d) => field.onChange(d && !Array.isArray(d) ? d.format(valueFormat) : undefined)}
          onBlur={field.onBlur}
        />
      )}
    />
  )
}
