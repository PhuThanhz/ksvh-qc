import { PlusOutlined } from '@ant-design/icons'
import { Button, Card, Tabs, Typography } from 'antd'
import { useState } from 'react'
import { useConfirm } from '@/components/feedback/useConfirm'
import { useNotify } from '@/components/feedback/useNotify'
import { EscalationFormModal } from '@/features/criteria/components/EscalationFormModal'
import { EscalationVersionTable } from '@/features/criteria/components/EscalationVersionTable'
import { RISK_POLICIES, type EscalationRule, type RiskPolicy } from '@/features/criteria/criteria.types'
import { useDeleteEscalation, useEscalationRules } from '@/features/criteria/hooks/useRiskConfig'
import { getErrorMessage } from '@/lib/http'
import { PERMISSIONS, ProtectedAction } from '@/permissions'
import { formatDate } from '@/utils/format-date'

function Summary({ current, fallback }: { current?: EscalationRule; fallback: boolean }) {
  if (!current) {
    return (
      <Typography.Paragraph type="secondary" style={{ marginBottom: 12 }}>
        {fallback ? 'Chưa khai báo – nhà hàng thuộc chính sách này đang dùng quy tắc Tiêu chuẩn.' : 'Chưa khai báo quy tắc nâng mức.'}
      </Typography.Paragraph>
    )
  }
  return (
    <Typography.Paragraph type="secondary" style={{ marginBottom: 12 }}>
      Đang áp dụng từ {formatDate(current.effectiveFrom)}: tiêu chí vi phạm từ <b>{current.thresholdCount} lần</b> trong kỳ
      đếm sẽ nâng mức ảnh hưởng <b>+{current.stepIncrease}</b> bậc (tối đa mức {current.maxImpact}); sau{' '}
      <b>{current.resetPeriodMonths} tháng</b> liên tục không vi phạm thì hạ về mức gốc.
    </Typography.Paragraph>
  )
}

/** Danh mục 9: quy tắc nâng mức theo chính sách rủi ro của nhà hàng, mỗi chính sách có phiên bản theo ngày hiệu lực. */
export function EscalationCard() {
  const notify = useNotify()
  const confirm = useConfirm()
  const rules = useEscalationRules()
  const remove = useDeleteEscalation()
  const [policy, setPolicy] = useState<RiskPolicy>('STANDARD')
  const [open, setOpen] = useState(false)
  const byPolicy = (p: RiskPolicy) => rules.data?.filter((r) => r.riskPolicy === p) ?? []
  const currentOf = (p: RiskPolicy) => byPolicy(p).find((r) => r.status === 'CURRENT')

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
          <Button type="primary" icon={<PlusOutlined />} onClick={() => setOpen(true)}>
            Thêm phiên bản
          </Button>
        </ProtectedAction>
      }
    >
      <Typography.Paragraph type="secondary" style={{ marginBottom: 4 }}>
        Mỗi nhà hàng chọn một chính sách rủi ro (ở Danh mục cơ sở). Kỳ đếm tần suất dùng chung cho mọi chính sách.
      </Typography.Paragraph>
      <Tabs
        activeKey={policy}
        onChange={(k) => setPolicy(k as RiskPolicy)}
        items={RISK_POLICIES.map((p) => ({
          key: p.value,
          label: p.label,
          children: (
            <>
              <Typography.Text type="secondary" style={{ display: 'block', marginBottom: 8, fontSize: 12 }}>
                {p.hint}
              </Typography.Text>
              <Summary current={currentOf(p.value)} fallback={p.value !== 'STANDARD'} />
              <EscalationVersionTable rules={byPolicy(p.value)} loading={rules.isFetching} onDelete={(r) => void onDelete(r)} />
            </>
          ),
        }))}
      />
      <EscalationFormModal open={open} policy={policy} current={currentOf(policy)} onClose={() => setOpen(false)} />
    </Card>
  )
}
