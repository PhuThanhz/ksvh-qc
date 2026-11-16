import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { employeesApi } from '@/features/employees/api/employees.api'
import { employeeKeys } from '@/features/employees/api/employees.keys'
import type { EmployeeListParams, EmployeePayload } from '@/features/employees/employees.types'
import type { Id } from '@/types/common.types'

export function useEmployees(params: EmployeeListParams) {
  return useQuery({
    queryKey: employeeKeys.list(params),
    queryFn: () => employeesApi.list(params),
    placeholderData: keepPreviousData,
  })
}

export function useSaveEmployee() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, body }: { id?: Id; body: EmployeePayload }) =>
      id === undefined ? employeesApi.create(body) : employeesApi.update(id, body),
    onSuccess: () => qc.invalidateQueries({ queryKey: employeeKeys.all }),
  })
}

export function useDeleteEmployee() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: Id) => employeesApi.delete(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: employeeKeys.all }),
  })
}
