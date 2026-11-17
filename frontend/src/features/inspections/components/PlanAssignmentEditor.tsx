import { DeleteOutlined, PlusOutlined } from '@ant-design/icons'
import { Button, DatePicker, Flex, Select, Table, Typography } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import dayjs from 'dayjs'
import { useMemo } from 'react'
import { useTemplates } from '@/features/criteria/hooks/useTemplates'
import { RestaurantPriorWarningTag } from '@/features/inspections/components/RestaurantPriorWarningTag'
import type { PlanAssignmentRequest } from '@/features/inspections/inspection.types'
import { useOrgUnits } from '@/features/organizations/hooks/useOrganizations'
import { useUsers } from '@/features/users/hooks/useUsers'
import { ROLES } from '@/permissions'

interface Props {
  value?: PlanAssignmentRequest[]
  onChange?: (assignments: PlanAssignmentRequest[]) => void
  dateRange?: [dayjs.Dayjs, dayjs.Dayjs] | null
  disabled?: boolean
}

interface RowItem extends PlanAssignmentRequest {
  _key: string
}

export function PlanAssignmentEditor({ value = [], onChange, dateRange, disabled }: Props) {
  const restaurants = useOrgUnits({ unitType: 'RESTAURANT', page: 0, size: 200, active: true })
  const templates = useTemplates({ page: 0, size: 200, active: true })
  const inspectors = useUsers({ page: 0, size: 200, active: true, role: ROLES.KSVH_INSPECTOR })

  const restMap = useMemo(() => {
    return new Map((restaurants.data?.items ?? []).map((r) => [r.id, r]))
  }, [restaurants.data])

  const rows: RowItem[] = useMemo(() => {
    return value.map((item, idx) => ({ ...item, _key: `row-${idx}` }))
  }, [value])

  const onAddRow = () => {
    const defaultDate = dateRange ? dateRange[0].format('YYYY-MM-DD') : dayjs().format('YYYY-MM-DD')
    const next: PlanAssignmentRequest = {
      restaurantId: undefined as unknown as number,
      inspectorId: undefined as unknown as number,
      templateId: undefined as unknown as number,
      scheduledDate: defaultDate,
    }
    onChange?.([...value, next])
  }

  const onRemoveRow = (idx: number) => {
    onChange?.(value.filter((_, i) => i !== idx))
  }

  const onUpdateField = <K extends keyof PlanAssignmentRequest>(idx: number, field: K, val: PlanAssignmentRequest[K]) => {
    const updated = value.map((item, i) => {
      if (i !== idx) return item
      const next = { ...item, [field]: val }
      if (field === 'restaurantId') {
        const rest = restMap.get(val as number)
        if (rest?.companyId && next.templateId) {
          const tpl = templates.data?.items.find((t) => t.id === next.templateId)
          if (tpl && tpl.companyId && tpl.companyId !== rest.companyId) {
            next.templateId = undefined as unknown as number
          }
        }
      }
      return next
    })
    onChange?.(updated)
  }

  const columns: ColumnsType<RowItem> = [
    {
      title: '#',
      width: 50,
      align: 'center',
      render: (_, __, i) => i + 1,
    },
    {
      title: 'Nhà hàng',
      key: 'restaurantId',
      width: 240,
      render: (_, r, idx) => {
        const chosenOtherIds = new Set(value.filter((_, i) => i !== idx).map((x) => x.restaurantId))
        const beforeDate = dateRange?.[0]?.format('YYYY-MM-DD')
        return (
          <Flex vertical gap={4}>
            <Select
              showSearch
              placeholder="Chọn nhà hàng..."
              value={r.restaurantId || undefined}
              onChange={(v) => onUpdateField(idx, 'restaurantId', v)}
              disabled={disabled}
              style={{ width: '100%' }}
              filterOption={(input, opt) => (opt?.label as string)?.toLowerCase().includes(input.toLowerCase())}
              options={restaurants.data?.items.map((res) => ({
                value: res.id,
                label: `${res.code} - ${res.name}`,
                disabled: chosenOtherIds.has(res.id),
              }))}
            />
            {r.restaurantId ? (
              <RestaurantPriorWarningTag restaurantId={r.restaurantId} beforeDate={beforeDate} />
            ) : null}
          </Flex>
        )
      },
    },
    {
      title: 'Chuyên viên KSVH',
      key: 'inspectorId',
      width: 180,
      render: (_, r, idx) => (
        <Select
          showSearch
          placeholder="Chọn chuyên viên..."
          value={r.inspectorId || undefined}
          onChange={(v) => onUpdateField(idx, 'inspectorId', v)}
          disabled={disabled}
          style={{ width: '100%' }}
          filterOption={(input, opt) => (opt?.label as string)?.toLowerCase().includes(input.toLowerCase())}
          options={inspectors.data?.items.map((u) => ({
            value: u.id,
            label: `${u.fullName} (${u.username})`,
          }))}
        />
      ),
    },
    {
      title: 'Mẫu phiếu chấm',
      key: 'templateId',
      width: 200,
      render: (_, r, idx) => {
        const rest = restMap.get(r.restaurantId)
        const tplList = (templates.data?.items ?? []).filter(
          (t) => !rest?.companyId || !t.companyId || t.companyId === rest.companyId,
        )
        return (
          <Select
            showSearch
            placeholder="Chọn mẫu phiếu..."
            value={r.templateId || undefined}
            onChange={(v) => onUpdateField(idx, 'templateId', v)}
            disabled={disabled}
            style={{ width: '100%' }}
            filterOption={(input, opt) => (opt?.label as string)?.toLowerCase().includes(input.toLowerCase())}
            options={tplList.map((t) => ({
              value: t.id,
              label: t.name,
            }))}
          />
        )
      },
    },
    {
      title: 'Ngày dự kiến',
      key: 'scheduledDate',
      width: 150,
      render: (_, r, idx) => (
        <DatePicker
          format="DD/MM/YYYY"
          value={r.scheduledDate ? dayjs(r.scheduledDate) : null}
          onChange={(d) => onUpdateField(idx, 'scheduledDate', d ? d.format('YYYY-MM-DD') : '')}
          disabled={disabled}
          disabledDate={(cur) => {
            if (!dateRange) return false
            return cur.isBefore(dateRange[0], 'day') || cur.isAfter(dateRange[1], 'day')
          }}
          style={{ width: '100%' }}
        />
      ),
    },
    {
      title: '',
      key: 'action',
      width: 50,
      align: 'center',
      render: (_, __, idx) =>
        disabled ? null : (
          <Button
            type="text"
            danger
            icon={<DeleteOutlined />}
            onClick={() => onRemoveRow(idx)}
            title="Xoá dòng phân công"
          />
        ),
    },
  ]

  return (
    <Flex vertical gap={8} style={{ width: '100%' }}>
      <Flex justify="space-between" align="center">
        <Typography.Text strong>
          Danh sách phân công kiểm tra ({value.length} nhà hàng)
        </Typography.Text>
        {!disabled && (
          <Button size="small" type="dashed" icon={<PlusOutlined />} onClick={onAddRow}>
            Thêm phân công
          </Button>
        )}
      </Flex>
      <Table
        dataSource={rows}
        columns={columns}
        rowKey="_key"
        pagination={false}
        size="small"
        scroll={{ y: 240 }}
        locale={{ emptyText: 'Chưa có phân công nào. Nhấn "Thêm phân công" để gán nhà hàng.' }}
      />
    </Flex>
  )
}
