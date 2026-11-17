import { Form, Modal } from 'antd'
import dayjs from 'dayjs'
import { type ChangeEvent, useEffect, useRef } from 'react'
import {
  FindingMeetingConcludeSection,
  FindingReviewFormSection,
} from '@/features/inspections/components/FindingAppealReviewSections'
import { FindingAppealFormSection } from '@/features/inspections/components/FindingAppealFormSection'
import {
  FindingRemediationPlanSection,
  FindingRemediationSubmitSection,
  FindingVerifySection,
} from '@/features/inspections/components/FindingRemediationFormSections'
import {
  FINDING_ACTION_TITLES,
  type FindingActionType,
  useFindingActionSubmit,
} from '@/features/inspections/hooks/useFindingActionSubmit'
import type { FindingResponse } from '@/features/inspections/inspection.types'
import { usePhotoCapture } from '@/features/media'
import { useNotify } from '@/hooks/useNotify'

export type { FindingActionType }

interface Props {
  open: boolean
  action?: FindingActionType
  finding?: FindingResponse
  onClose: () => void
}

export function FindingActionModal({ open, action, finding, onClose }: Props) {
  const [form] = Form.useForm()
  const notify = useNotify()
  const photo = usePhotoCapture()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const currentUploadFieldRef = useRef<'appealEvidenceUrls' | 'remediationEvidenceUrls'>('remediationEvidenceUrls')

  const today = dayjs()
  const remediationDays = finding?.remediationDays ?? 7
  const initialDeadline = finding?.deadlineDate ? dayjs(finding.deadlineDate) : null
  const maxDeadline =
    !initialDeadline || initialDeadline.isBefore(today, 'day') ? today.add(remediationDays, 'day') : initialDeadline

  const { onSubmit, isPending } = useFindingActionSubmit(finding, action, form, onClose)

  useEffect(() => {
    if (open) {
      form.resetFields()
      if (action === 'REMEDIATION_PLAN') form.setFieldValue('remediationDeadline', maxDeadline)
      else if (action === 'CONCLUDE_APPEAL') form.setFieldValue('conclusion', 'UPHELD')
      else if (action === 'SUBMIT_REVIEW') form.setFieldValue('verdict', 'FINDING_VALID')
      else if (action === 'VERIFY') form.setFieldValue('passed', true)
    }
  }, [open, action, finding, form, maxDeadline])

  const onSelectFile = (field: 'appealEvidenceUrls' | 'remediationEvidenceUrls') => {
    currentUploadFieldRef.current = field
    fileInputRef.current?.click()
  }

  const onFileChange = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !finding) return
    try {
      const captured = await photo.process(file, [
        finding.restaurantName || 'Nhà hàng',
        finding.criterionCode || 'QC',
      ])
      if (captured) {
        const fieldName = currentUploadFieldRef.current
        const current = form.getFieldValue(fieldName) as string | undefined
        const next = current ? `${current}, ${captured.objectKey}` : captured.objectKey
        form.setFieldValue(fieldName, next)
        notify.success('Đã tải ảnh lên kho lưu trữ thành công')
      }
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  return (
    <Modal
      open={open}
      title={action ? FINDING_ACTION_TITLES[action] : ''}
      onCancel={onClose}
      onOk={onSubmit}
      confirmLoading={isPending}
      destroyOnClose
      width={600}
    >
      <Form form={form} layout="vertical" style={{ marginTop: 16 }}>
        {action === 'CONFIRM' && (
          <p>
            Bạn xác nhận cửa hàng đồng ý với lỗi <b>{finding?.criterionName}</b> và sẽ tiến hành lập kế hoạch khắc
            phục trong vòng <b>{finding?.remediationDays} ngày</b>?
          </p>
        )}

        {action === 'APPEAL' && (
          <FindingAppealFormSection
            findingId={finding?.id}
            onSelectPhoto={() => onSelectFile('appealEvidenceUrls')}
            isPhotoProcessing={photo.step === 'processing' || photo.step === 'uploading'}
          />
        )}

        {action === 'SUBMIT_REVIEW' && <FindingReviewFormSection finding={finding} />}

        {action === 'CONCLUDE_APPEAL' && <FindingMeetingConcludeSection />}

        {action === 'REMEDIATION_PLAN' && (
          <FindingRemediationPlanSection
            today={today}
            maxDeadline={maxDeadline}
            remediationDays={remediationDays}
            riskLevelCode={finding?.riskLevelCode}
          />
        )}

        {action === 'SUBMIT_REMEDIATION' && (
          <FindingRemediationSubmitSection
            isPhotoProcessing={photo.step === 'processing' || photo.step === 'uploading'}
            onSelectPhoto={() => onSelectFile('remediationEvidenceUrls')}
          />
        )}

        {action === 'VERIFY' && <FindingVerifySection />}
      </Form>
      <input type="file" ref={fileInputRef} onChange={onFileChange} style={{ display: 'none' }} accept="image/*" />
    </Modal>
  )
}
