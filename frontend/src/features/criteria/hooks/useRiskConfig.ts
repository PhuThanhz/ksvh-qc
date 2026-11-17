import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { riskConfigApi } from '@/features/criteria/api/criteria.api'
import { criteriaKeys } from '@/features/criteria/api/criteria.keys'
import type { EscalationRulePayload, FrequencyConfigPayload, RiskLevelVersionPayload } from '@/features/criteria/criteria.types'
import type { Id } from '@/types/common.types'

export function useRiskLevels() {
  return useQuery({ queryKey: criteriaKeys.riskLevels(), queryFn: riskConfigApi.riskLevels })
}

export function useRiskLevelVersions() {
  return useQuery({ queryKey: criteriaKeys.riskLevelVersions(), queryFn: riskConfigApi.riskLevelVersions })
}

/** Lưu bảng mức rủi ro thành phiên bản áp dụng từ ngày hiệu lực. */
export function useSaveRiskLevelVersion() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (body: RiskLevelVersionPayload) => riskConfigApi.saveRiskLevelVersion(body),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: criteriaKeys.riskLevels() })
      void qc.invalidateQueries({ queryKey: [...criteriaKeys.all, 'risk-preview'] })
    },
  })
}

export function useDeleteRiskLevelVersion() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (effectiveFrom: string) => riskConfigApi.deleteRiskLevelVersion(effectiveFrom),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: criteriaKeys.riskLevels() })
      void qc.invalidateQueries({ queryKey: [...criteriaKeys.all, 'risk-preview'] })
    },
  })
}

export function useFrequencyConfigs() {
  return useQuery({ queryKey: criteriaKeys.frequency(), queryFn: riskConfigApi.frequency })
}

export function useEscalationRules() {
  return useQuery({ queryKey: criteriaKeys.escalation(), queryFn: riskConfigApi.escalation })
}

export function useCreateFrequency() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (body: FrequencyConfigPayload) => riskConfigApi.createFrequency(body),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: criteriaKeys.frequency() })
      void qc.invalidateQueries({ queryKey: [...criteriaKeys.all, 'risk-preview'] })
    },
  })
}

export function useDeleteFrequency() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: Id) => riskConfigApi.deleteFrequency(id),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: criteriaKeys.frequency() })
      void qc.invalidateQueries({ queryKey: [...criteriaKeys.all, 'risk-preview'] })
    },
  })
}

export function useCreateEscalation() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (body: EscalationRulePayload) => riskConfigApi.createEscalation(body),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: criteriaKeys.escalation() })
      void qc.invalidateQueries({ queryKey: [...criteriaKeys.all, 'risk-preview'] })
    },
  })
}

export function useDeleteEscalation() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: Id) => riskConfigApi.deleteEscalation(id),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: criteriaKeys.escalation() })
      void qc.invalidateQueries({ queryKey: [...criteriaKeys.all, 'risk-preview'] })
    },
  })
}
