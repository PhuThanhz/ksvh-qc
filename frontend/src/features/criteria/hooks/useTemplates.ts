import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { templatesApi } from '@/features/criteria/api/criteria.api'
import { criteriaKeys } from '@/features/criteria/api/criteria.keys'
import type { TemplateListParams, TemplatePayload } from '@/features/criteria/criteria.types'
import type { Id } from '@/types/common.types'

export function useTemplates(params: TemplateListParams) {
  return useQuery({
    queryKey: criteriaKeys.templateList(params),
    queryFn: () => templatesApi.list(params),
    placeholderData: keepPreviousData,
  })
}

/** Mọi mẫu phiếu (rút gọn, không phân trang) cho ô chọn mẫu. */
export function useTemplateOptions(enabled = true) {
  return useQuery({ queryKey: criteriaKeys.templateOptions(), queryFn: templatesApi.options, enabled })
}

export function useTemplate(id: Id | undefined) {
  return useQuery({
    queryKey: criteriaKeys.template(id ?? 0),
    queryFn: () => templatesApi.get(id ?? 0),
    enabled: id !== undefined,
  })
}

export function useSaveTemplate() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, body }: { id?: Id; body: TemplatePayload }) =>
      id === undefined ? templatesApi.create(body) : templatesApi.update(id, body),
    onSuccess: () => qc.invalidateQueries({ queryKey: criteriaKeys.templates() }),
  })
}

export function useDeleteTemplate() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: Id) => templatesApi.delete(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: criteriaKeys.templates() }),
  })
}
