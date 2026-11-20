import { DeleteOutlined } from '@ant-design/icons'
import { Empty, Select, Table } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import dayjs from 'dayjs'
import { useEffect, useMemo } from 'react'
import { ActionButton } from '@/components/data-display/TableActions'
import { useCriteriaList, useCriterionGroups } from '@/features/criteria/hooks/useCriteria'
import { useTemplates } from '@/features/criteria/hooks/useTemplates'
import { PlanBoardToolbar } from '@/features/inspections/components/PlanBoardToolbar'
import { PlanSurpriseScopeCell } from '@/features/inspections/components/PlanSurpriseScopeCell'
import { RestaurantPriorWarningTag } from '@/features/inspections/components/RestaurantPriorWarningTag'
import type { PlanAssignmentRequest } from '@/features/inspections/inspection.types'
import { useOrgUnits } from '@/features/organizations/hooks/useOrganizations'
import { useUsers } from '@/features/users/hooks/useUsers'
import { ROLES } from '@/permissions'

interface Props {
  /** Định kỳ: mỗi dòng chọn mẫu phiếu; đột xuất: mỗi dòng chọn chuyên đề (nhóm tiêu chí). */
  kind: 'PERIODIC' | 'SURPRISE'
  value?: PlanAssignmentRequest[]
  onChange?: (assignments: PlanAssignmentRequest[]) => void
  /** Chuyên viên đang chọn ở cột trái: tô sáng dòng của người đó. */
  inspectorId?: number
  /** Nhà hàng đang tick trong bảng – bấm chuyên viên ở cột trái sẽ giao các dòng này. */
  selectedRestaurantIds: number[]
  onSelectRestaurants: (ids: number[]) => void
  onOpenCopy: () => void
}

type Row = PlanAssignmentRequest & { _idx: number }

/** Cột phải: bảng phân công nhà hàng – chuyên viên – mẫu phiếu – ngày dự kiến. */
export function PlanAssignmentEditor({
  kind, value = [], onChange, inspectorId, selectedRestaurantIds, onSelectRestaurants, onOpenCopy,
}: Props) {
  const surprise = kind === 'SURPRISE'
  const restaurants = useOrgUnits({ unitType: 'RESTAURANT', page: 0, size: 200, active: true })
  const templates = useTemplates({ page: 0, size: 200, active: true })
  const inspectors = useUsers({ page: 0, size: 200, active: true, role: ROLES.KSVH_INSPECTOR })
  const groups = useCriterionGroups()
  const criteria = useCriteriaList({ page: 0, size: 500, active: true })
  const groupList = (groups.data ?? []).filter((g) => g.active)
  const restList = useMemo(() => restaurants.data?.items ?? [], [restaurants.data])
  const tplList = templates.data?.items ?? []
  const restMap = useMemo(() => new Map(restList.map((r) => [r.id, r])), [restList])
  const takenIds = useMemo(() => new Set(value.map((a) => a.restaurantId)), [value])
  /** Tên chuyên viên bỏ phần chức danh trong ngoặc cho gọn. */
  const inspectorOptions = (inspectors.data?.items ?? []).map((u) => ({ value: u.id, label: u.fullName.replace(/\s*\(.*\)\s*$/, '') }))
  /** Mốc cảnh báo lỗi tồn đọng trước kế hoạch: hôm nay (kế hoạch chỉ còn hạn hoàn thành). */
  const today = dayjs().format('YYYY-MM-DD')
  const templatesFor = (restaurantId?: number) => {
    const companyId = restaurantId ? restMap.get(restaurantId)?.companyId : undefined
    return tplList
      .filter((t) => !companyId || !t.companyId || t.companyId === companyId)
      .sort((a, b) => Number(!!b.companyId) - Number(!!a.companyId)) // mẫu riêng của công ty lên trước
  }
  const topicsFor = (restaurantId?: number) => {
    const companyId = restaurantId ? restMap.get(restaurantId)?.companyId : undefined
    return groupList.filter((g) => !companyId || !g.companyId || g.companyId === companyId)
  }

  const update = (idx: number, patch: Partial<PlanAssignmentRequest>) =>
    onChange?.(value.map((a, i) => (i === idx ? { ...a, ...patch } : a)))

  /** Dòng định kỳ chưa có mẫu (thêm lúc đang ở đột xuất, hoặc trước khi danh sách mẫu tải xong) → tự điền mẫu mặc định. */
  const missingTemplate = !surprise && tplList.length > 0 && value.some((a) => !a.templateId && templatesFor(a.restaurantId).length > 0)
  useEffect(() => {
    if (!missingTemplate) return
    onChange?.(value.map((a) => (a.templateId ? a : { ...a, templateId: templatesFor(a.restaurantId)[0]?.id ?? null })))
    // eslint-disable-next-line react-hooks/exhaustive-deps -- chỉ chạy khi xuất hiện dòng thiếu mẫu
  }, [missingTemplate])

  const addRestaurants = (ids: number[]) => {
    const lastTemplate = value.at(-1)?.templateId
    const lastTopics = value.at(-1)?.topicGroupIds ?? []
    const lastCriteria = value.at(-1)?.criterionIds ?? []
    const groupOf = new Map((criteria.data?.items ?? []).map((c) => [c.id, c.groupId]))
    onChange?.([
      ...value,
      ...ids.map((restaurantId) => {
        if (surprise) {
          const allowed = new Set(topicsFor(restaurantId).map((g) => g.id))
          // Dòng mới dùng lại phạm vi (chuyên đề + tiêu chí) của dòng trước, trong giới hạn công ty của nhà hàng
          const topicGroupIds = lastTopics.filter((id) => allowed.has(id))
          const criterionIds = lastCriteria.filter((id) => { const g = groupOf.get(id); return g != null && topicGroupIds.includes(g) })
          return { restaurantId, inspectorId: undefined as unknown as number, templateId: null, topicGroupIds, criterionIds }
        }
        const allowed = templatesFor(restaurantId)
        const templateId = allowed.some((t) => t.id === lastTemplate) ? lastTemplate : allowed[0]?.id
        return { restaurantId, inspectorId: undefined as unknown as number, templateId: templateId ?? null }
      }),
    ])
    // Chọn nhà hàng trước, giao chuyên viên sau: nhà hàng vừa thêm được tick sẵn để bấm chuyên viên là giao luôn
    onSelectRestaurants([...new Set([...selectedRestaurantIds, ...ids])])
  }

  const removeRestaurants = (ids: number[]) => {
    const drop = new Set(ids)
    onChange?.(value.filter((a) => !drop.has(a.restaurantId)))
    onSelectRestaurants(selectedRestaurantIds.filter((id) => !drop.has(id)))
  }

  const applyTemplateToAll = (templateId: number) =>
    onChange?.(value.map((a) => (templatesFor(a.restaurantId).some((t) => t.id === templateId) ? { ...a, templateId } : a)))
  /** Thêm chuyên đề cho mọi dòng; dòng đã tick tiêu chí riêng thì cộng thêm toàn bộ tiêu chí của chuyên đề mới. */
  const addTopicToAll = (groupId: number) => {
    const groupCriteria = (criteria.data?.items ?? []).filter((c) => c.groupId === groupId).map((c) => c.id)
    onChange?.(value.map((a) => {
      const current = a.topicGroupIds ?? []
      const ok = topicsFor(a.restaurantId).some((g) => g.id === groupId)
      if (!ok || current.includes(groupId)) return a
      const picked = a.criterionIds ?? []
      return { ...a, topicGroupIds: [...current, groupId], criterionIds: picked.length ? [...picked, ...groupCriteria] : picked }
    }))
  }

  const columns: ColumnsType<Row> = [
    { title: '#', width: 44, align: 'center', render: (_, r) => r._idx + 1 },
    {
      title: 'Nhà hàng',
      key: 'restaurant',
      width: 260,
      render: (_, r) => {
        const rest = restMap.get(r.restaurantId)
        return (
          <div className="plan-rest">
            <strong>{rest ? rest.name : `#${r.restaurantId}`}</strong>
            <small>{rest ? `${rest.code} · ${rest.companyCode}` : ''}</small>
            <RestaurantPriorWarningTag restaurantId={r.restaurantId} beforeDate={today} />
          </div>
        )
      },
    },
    {
      title: <>Chuyên viên KSVH <span className="req-mark">*</span></>,
      key: 'inspector',
      width: 250,
      // Chỉ hiển thị: chuyên viên được chọn duy nhất ở cột bên trái (bấm người → giao các dòng đang trống)
      render: (_, r) => (
        <div className="plan-assignee">
          {r.inspectorId
            ? <span className="plan-assignee__name">{inspectorOptions.find((o) => o.value === r.inspectorId)?.label ?? `#${r.inspectorId}`}</span>
            : <span className="plan-assignee__empty">Chưa giao – chọn người ở cột trái</span>}
        </div>
      ),
    },
    surprise
      ? {
          title: <>Mẫu đột xuất / Chuyên đề <span className="req-mark">*</span></>,
          key: 'topics',
          width: 290,
          render: (_, r) => (
            <PlanSurpriseScopeCell
              restaurantName={restMap.get(r.restaurantId)?.name}
              groups={topicsFor(r.restaurantId)}
              templates={templatesFor(r.restaurantId)}
              templateId={r.templateId}
              topicGroupIds={r.topicGroupIds ?? []}
              criterionIds={r.criterionIds ?? []}
              onChange={(criterionIds, topicGroupIds, templateId) =>
                update(r._idx, { criterionIds, topicGroupIds, templateId })
              }
            />
          ),
        }
      : {
          title: <>Mẫu phiếu <span className="req-mark">*</span></>,
          key: 'template',
          width: 250,
          render: (_, r) => (
            <Select
              showSearch={{ optionFilterProp: 'label' }}
              placeholder="Chọn mẫu phiếu"
              variant={r.templateId ? 'borderless' : 'outlined'}
              status={r.templateId ? undefined : 'warning'}
              popupMatchSelectWidth={480}
              optionRender={(o) => <span title={String(o.label)}>{o.label}</span>}
              value={r.templateId || undefined}
              onChange={(v) => update(r._idx, { templateId: v })}
              options={templatesFor(r.restaurantId).map((t) => ({ value: t.id, label: t.name }))}
              style={{ width: '100%' }}
            />
          ),
        },
    {
      key: 'action',
      width: 52,
      align: 'center',
      render: (_, r) => (
        <ActionButton tone="delete" icon={<DeleteOutlined />} tooltip="Bỏ nhà hàng khỏi kế hoạch"
          onClick={() => removeRestaurants([r.restaurantId])} />
      ),
    },
  ]

  return (
    <section className="plan-board">
      <PlanBoardToolbar
        surprise={surprise}
        rowCount={value.length}
        restaurants={restList}
        takenIds={takenIds}
        selectedCount={selectedRestaurantIds.length}
        scopeOptions={surprise ? groupList.map((g) => ({ value: g.id, label: g.name })) : tplList.map((t) => ({ value: t.id, label: t.name }))}
        onAdd={addRestaurants}
        onRemove={removeRestaurants}
        onApplyScopeToAll={(v) => (surprise ? addTopicToAll(v) : applyTemplateToAll(v))}
        onClearSelection={() => onSelectRestaurants([])}
        onOpenCopy={onOpenCopy}
      />
      <Table<Row>
        dataSource={value.map((a, i) => ({ ...a, _idx: i }))}
        columns={columns}
        rowKey="restaurantId"
        rowSelection={{
          selectedRowKeys: selectedRestaurantIds,
          onChange: (keys) => onSelectRestaurants(keys.map(Number)),
          columnWidth: 40,
        }}
        rowClassName={(r) => (inspectorId && r.inspectorId === inspectorId ? 'plan-row--mine' : '')}
        pagination={false}
        tableLayout="fixed"
        scroll={{ x: 1040 }}
        loading={restaurants.isLoading}
        locale={{
          emptyText: (
            <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="Tick nhà hàng ở ô phía trên, bấm chuyên viên ở cột trái để giao, kiểm tra mẫu phiếu rồi lưu." />
          ),
        }}
      />
    </section>
  )
}
