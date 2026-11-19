import { SearchOutlined } from '@ant-design/icons'
import { Empty, Flex, Input, Skeleton } from 'antd'
import { useMemo, useState } from 'react'
import { DetailSection } from '@/components/feedback/detail'
import { ImpactTag } from '@/features/criteria/components/ImpactTag'
import type { Criterion } from '@/features/criteria/criteria.types'

export interface TemplateCriteriaPanelProps {
  criteria: Criterion[]
  loading: boolean
}

/** Tiêu chí của mẫu phiếu, gom theo nhóm, giữ đúng thứ tự chấm; có ô tìm nhanh. */
export function TemplateCriteriaPanel({ criteria, loading }: TemplateCriteriaPanelProps) {
  const [q, setQ] = useState('')
  const groups = useMemo(() => {
    const kw = q.trim().toLowerCase()
    const map = new Map<string, { name: string; items: { c: Criterion; order: number }[] }>()
    criteria.forEach((c, i) => {
      if (kw && !`${c.code} ${c.name} ${c.groupName}`.toLowerCase().includes(kw)) return
      const key = String(c.groupId)
      const g = map.get(key) ?? { name: c.groupName, items: [] }
      g.items.push({ c, order: i + 1 })
      map.set(key, g)
    })
    return [...map.values()]
  }, [criteria, q])

  if (loading) return <Skeleton active paragraph={{ rows: 6 }} />

  return (
    <Flex vertical gap={16}>
      <Input
        allowClear
        prefix={<SearchOutlined />}
        placeholder="Tìm theo mã, tên tiêu chí hoặc nhóm…"
        value={q}
        onChange={(e) => setQ(e.target.value)}
        style={{ maxWidth: 420 }}
      />
      {groups.length === 0 && (
        <Empty description={criteria.length ? 'Không có tiêu chí phù hợp' : 'Mẫu phiếu chưa có tiêu chí'} />
      )}
      {groups.map((g) => (
        <DetailSection key={g.name} title={g.name} extra={<span className="tpl-crit__count">{g.items.length} tiêu chí</span>}>
          {g.items.map(({ c, order }) => (
            <div key={c.id} className="tpl-crit">
              <span className="tpl-crit__order">{order}</span>
              <div className="tpl-crit__body">
                <div className="tpl-crit__name">{c.name}</div>
                <div className="tpl-crit__meta">
                  <code>{c.code}</code>
                  {c.checkMethod && <span>· {c.checkMethod}</span>}
                </div>
              </div>
              <ImpactTag value={c.baseImpact} />
            </div>
          ))}
        </DetailSection>
      ))}
    </Flex>
  )
}
