import type { FormInstance } from 'antd'
import { useFindingMutations } from './useInspectionData'
import type { FindingResponse } from '../inspection.types'
import { useNotify } from '@/hooks/useNotify'

export type FindingActionType =
  | 'CONFIRM'
  | 'APPEAL'
  | 'SUBMIT_REVIEW'
  | 'CONCLUDE_APPEAL'
  | 'REMEDIATION_PLAN'
  | 'SUBMIT_REMEDIATION'
  | 'VERIFY'

export const FINDING_ACTION_TITLES: Record<FindingActionType, string> = {
  CONFIRM: 'Xác nhận lỗi vi phạm',
  APPEAL: 'Gửi khiếu nại lỗi vi phạm',
  SUBMIT_REVIEW: 'Thẩm định khiếu nại',
  CONCLUDE_APPEAL: 'Kết luận họp khiếu nại (Quản lý KSVH)',
  REMEDIATION_PLAN: 'Lập kế hoạch khắc phục lỗi',
  SUBMIT_REMEDIATION: 'Báo cáo hoàn thành & Gửi bằng chứng khắc phục',
  VERIFY: 'Nghiệm thu kết quả khắc phục',
}

export function useFindingActionSubmit(
  finding: FindingResponse | undefined,
  action: FindingActionType | undefined,
  form: FormInstance,
  onClose: () => void,
) {
  const { confirm, appeal, submitReview, concludeAppeal, remediationPlan, submitRemediation, verify } =
    useFindingMutations()
  const notify = useNotify()

  const isPending =
    confirm.isPending ||
    appeal.isPending ||
    submitReview.isPending ||
    concludeAppeal.isPending ||
    remediationPlan.isPending ||
    submitRemediation.isPending ||
    verify.isPending

  const onSubmit = async () => {
    if (!finding || !action) return
    try {
      const vals = await form.validateFields()
      if (action === 'CONFIRM') {
        await confirm.mutateAsync(finding.id)
        notify.success('Đã xác nhận lỗi vi phạm')
      } else if (action === 'APPEAL') {
        await appeal.mutateAsync({
          id: finding.id,
          body: {
            appealReason: vals.appealReason,
            appealEvidenceUrls: vals.appealEvidenceUrls,
            reviewerIds: vals.reviewerIds,
          },
        })
        notify.success('Đã gửi khiếu nại tới hội đồng thẩm định')
      } else if (action === 'SUBMIT_REVIEW') {
        await submitReview.mutateAsync({
          id: finding.id,
          body: { verdict: vals.verdict, comment: vals.comment },
        })
        notify.success('Đã gửi ý kiến thẩm định khiếu nại')
      } else if (action === 'CONCLUDE_APPEAL') {
        await concludeAppeal.mutateAsync({
          id: finding.id,
          body: { conclusion: vals.conclusion, meetingNotes: vals.meetingNotes },
        })
        notify.success('Đã kết luận họp thẩm định khiếu nại')
      } else if (action === 'REMEDIATION_PLAN') {
        const deadline = vals.remediationDeadline.format('YYYY-MM-DD')
        await remediationPlan.mutateAsync({
          id: finding.id,
          body: { remediationPlan: vals.remediationPlan, remediationDeadline: deadline },
        })
        notify.success('Đã lập kế hoạch khắc phục')
      } else if (action === 'SUBMIT_REMEDIATION') {
        await submitRemediation.mutateAsync({
          id: finding.id,
          body: { remediationEvidenceUrls: vals.remediationEvidenceUrls },
        })
        notify.success('Đã gửi bằng chứng khắc phục để nghiệm thu')
      } else if (action === 'VERIFY') {
        await verify.mutateAsync({ id: finding.id, body: { passed: vals.passed, comment: vals.comment } })
        notify.success('Đã nghiệm thu kết quả khắc phục')
      }
      onClose()
    } catch (err: unknown) {
      notify.error((err as { message?: string })?.message ?? 'Đã xảy ra lỗi')
    }
  }

  return { onSubmit, isPending }
}
