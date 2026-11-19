import { PlusOutlined } from '@ant-design/icons'
import { Button, Card, Typography } from 'antd'
import { useState } from 'react'
import { useConfirm } from '@/components/feedback/useConfirm'
import { useNotify } from '@/components/feedback/useNotify'
import { EscalationFormModal } from '@/features/criteria/components/EscalationFormModal'
import { EscalationVersionTable } from '@/features/criteria/components/EscalationVersionTable'
import type { EscalationRule } from '@/features/criteria/criteria.types'
import { useDeleteEscalation, useEscalationRules } from '@/features/criteria/hooks/useRiskConfig'
import { getErrorMessage } from '@/lib/http'
import { PERMISSIONS, ProtectedAction } from '@/permissions'
import { formatDate } from '@/utils/format-date'

/**
 * Danh mục 9: quy tắc nâng / hạ mức chung cho cả chuỗi, phiên bản theo ngày hiệu lực.
 * Nhà hàng cần khác (vd fine dining) khai báo ngưỡng riêng ở Danh mục cơ sở.
 */
export function EscalationCard() {
  const notify = useNotify()
  const confirm = useConfirm()
  const rules = useEscalationRules()
  const remove = useDeleteEscalation()
  const [open, setOpen] = useState(false)
  const current = rules.data?.find((r) => r.status === 'CURRENT')

  const onDelete = async (r: EscalationRule) => {
    if (!(await confirm({ title: `Xoá phiên bản hiệu lực từ ${formatDate(r.effectiveFrom)}?`, okText: 'Xoá', danger: true }))) return
    remove.mutate(r.id, {
      onSuccess: () => notify.success('Đã xoá phiên bản'),
      onError: (err) => notify.error(getErrorMessage(err)),
    })
  }

  return (
    <Card
      title="Quy tắc nâng / hạ mức khi tái phạm"
      extra={
        <ProtectedAction access={PERMISSIONS.CRITERIA.MANAGE}>
          <Button icon={<PlusOutlined />} onClick={() => setOpen(true)}>
            Thêm phiên bản
          </Button>
        </ProtectedAction>
      }
    >
      <Typography.Paragraph type="secondary" style={{ marginBottom: 12 }}>
        {current ? (
          <>
            Đang áp dụng từ {formatDate(current.effectiveFrom)}: tiêu chí vi phạm từ <b>{current.thresholdCount} lần</b> trong
            kỳ đếm sẽ nâng mức ảnh hưởng <b>+{current.stepIncrease}</b> bậc (tối đa mức {current.maxImpact}); sau{' '}
            <b>{current.resetPeriodMonths} tháng</b> liên tục không vi phạm thì hạ về mức gốc.{' '}
          </>
        ) : (
          'Chưa khai báo quy tắc nâng mức. '
        )}
        Nhà hàng cần khắt khe hơn (vd fine dining) đặt ngưỡng riêng trong Danh mục cơ sở.
      </Typography.Paragraph>
      <EscalationVersionTable rules={rules.data ?? []} loading={rules.isFetching} onDelete={(r) => void onDelete(r)} />
      <EscalationFormModal open={open} current={current} onClose={() => setOpen(false)} />
    </Card>
  )
}
