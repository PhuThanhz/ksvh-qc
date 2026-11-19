import { CalendarOutlined, RiseOutlined } from '@ant-design/icons'
import { Button } from 'antd'
import { useState, type ReactNode } from 'react'
import { useSearchParams } from 'react-router'
import { PageContainer } from '@/components/layout/PageContainer'
import { ViewTabs } from '@/components/layout/ViewTabs'
import { EscalationCard } from '@/features/criteria/components/EscalationCard'
import { FrequencyCard } from '@/features/criteria/components/FrequencyCard'
import { useEscalationRules, useFrequencyConfigs } from '@/features/criteria/hooks/useRiskConfig'
import { PERMISSIONS, ProtectedAction } from '@/permissions'

const TAB_PARAM = 'tab'
const TABS: { key: 'frequency' | 'escalation'; label: string; addLabel: string; icon: ReactNode }[] = [
  {
    key: 'frequency',
    label: 'Kỳ đếm tần suất',
    addLabel: 'Thêm phiên bản kỳ đếm',
    icon: <CalendarOutlined />,
  },
  {
    key: 'escalation',
    label: 'Quy tắc nâng / hạ mức',
    addLabel: 'Thêm phiên bản quy tắc',
    icon: <RiseOutlined />,
  },
]

/** Danh mục 8–9: kỳ đếm tần suất và quy tắc nâng / hạ mức (phiên bản theo ngày áp dụng). */
export function RiskRulesPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const [createOpen, setCreateOpen] = useState(false)
  const active = TABS.find((t) => t.key === searchParams.get(TAB_PARAM)) ?? TABS[0]!

  const frequencyConfigs = useFrequencyConfigs()
  const escalationRules = useEscalationRules()

  const counts: Record<'frequency' | 'escalation', number | undefined> = {
    frequency: frequencyConfigs.data?.length,
    escalation: escalationRules.data?.length,
  }

  const tabsNode = (
    <ViewTabs
      items={TABS.map((t) => ({ key: t.key, label: t.label, icon: t.icon, count: counts[t.key] }))}
      activeKey={active.key}
      onChange={(key) => {
        setCreateOpen(false)
        setSearchParams({ [TAB_PARAM]: key }, { replace: true })
      }}
    />
  )

  return (
    <PageContainer
      title="Quy tắc tái phạm & Nâng mức rủi ro"
      subtitle="Thiết lập kỳ đếm tần suất vi phạm lũy tiến, ngưỡng nâng bậc mức ảnh hưởng và chu kỳ hoàn nguyên mức gốc"
      extra={
        <ProtectedAction access={PERMISSIONS.CRITERIA.MANAGE}>
          <Button type="primary" onClick={() => setCreateOpen(true)}>
            {active.addLabel}
          </Button>
        </ProtectedAction>
      }
    >
      {active.key === 'frequency' ? (
        <FrequencyCard
          createOpen={createOpen}
          onCreateClose={() => setCreateOpen(false)}
          tabs={tabsNode}
        />
      ) : (
        <EscalationCard
          createOpen={createOpen}
          onCreateClose={() => setCreateOpen(false)}
          tabs={tabsNode}
        />
      )}
    </PageContainer>
  )
}
