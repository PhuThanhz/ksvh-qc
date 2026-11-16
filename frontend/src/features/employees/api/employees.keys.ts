import type { EmployeeListParams } from '@/features/employees/employees.types'

/** Query key của module employees. Sau khi ghi: invalidateQueries({ queryKey: employeeKeys.all }). */
export const employeeKeys = {
  all: ['employees'] as const,
  list: (params: EmployeeListParams) => [...employeeKeys.all, 'list', params] as const,
}
