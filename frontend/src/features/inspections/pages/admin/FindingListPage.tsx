import { Card, Flex, Select } from 'antd'
import { useCallback, useState } from 'react'
import { AdvancedFilter } from '@/components/data-entry/AdvancedFilter'
import { PageContainer } from '@/components/layout/PageContainer'
import { FindingActionModal, type FindingActionType } from '@/features/inspections/components/FindingActionModal'
import { FindingTable } from '@/features/inspections/components/FindingTable'
import { useFindings } from '@/features/inspections/hooks/useInspectionData'
import type { FindingResponse, FindingStatus } from '@/features/inspections/inspection.types'
import { useOrgUnits } from '@/features/organizations/hooks/useOrganizations'
import { useListParams } from '@/hooks/useListParams'

interface Filters extends Record<string, unknown> {
  restaurantId?: number
  status?: FindingStatus
}

export function FindingListPage() {
  const { params, filters, setFilter, resetFilters, activeFilterCount } = useListParams<Filters>()
  const findings = useFindings(params)
  const restaurants = useOrgUnits({ unitType: 'RESTAURANT', page: 0, size: 200, active: true })

  const [actionState, setActionState] = useState<{
    open: boolean
    action?: FindingActionType
    finding?: FindingResponse
  }>({ open: false })

  const onTriggerAction = useCallback((finding: FindingResponse, action: FindingActionType) => {
    setActionState({ open: true, action, finding })
  }, [])

  return (
    <PageContainer
      title="Quản lý lỗi & Khắc phục"
      subtitle="Theo dõi chu trình xử lý lỗi vi phạm từ xác nhận, khiếu nại, khắc phục đến nghiệm thu đóng lỗi"
    >
      <Card>
        <Flex vertical gap={16}>
          <AdvancedFilter
            activeCount={activeFilterCount}
            onReset={resetFilters}
          >
            <Select
              placeholder="Nhà hàng"
              allowClear
              showSearch
              value={filters.restaurantId}
              onChange={(v) => setFilter('restaurantId', v)}
              style={{ width: 240 }}
              filterOption={(input, opt) => (opt?.label as string)?.toLowerCase().includes(input.toLowerCase())}
              options={restaurants.data?.items.map((r) => ({ value: r.id, label: `${r.code} - ${r.name}` }))}
            />

            <Select
              placeholder="Trạng thái xử lý"
              allowClear
              value={filters.status}
              onChange={(v) => setFilter('status', v)}
              style={{ width: 200 }}
              options={[
                { value: 'OPEN', label: 'Chờ phản hồi' },
                { value: 'CONFIRMED', label: 'Đã xác nhận' },
                { value: 'APPEALED', label: 'Đang khiếu nại' },
                { value: 'REMEDIATING', label: 'Đang khắc phục' },
                { value: 'PENDING_VERIFICATION', label: 'Chờ nghiệm thu' },
                { value: 'CLOSED', label: 'Đã đóng (Đạt)' },
                { value: 'DISMISSED', label: 'Đã huỷ bỏ' },
              ]}
            />
          </AdvancedFilter>

          <FindingTable
            data={findings.data?.items}
            loading={findings.isLoading}
            currentPage={params.page}
            pageSize={params.size}
            onAction={onTriggerAction}
          />
        </Flex>
      </Card>

      <FindingActionModal
        open={actionState.open}
        action={actionState.action}
        finding={actionState.finding}
        onClose={() => setActionState({ open: false })}
      />
    </PageContainer>
  )
}
