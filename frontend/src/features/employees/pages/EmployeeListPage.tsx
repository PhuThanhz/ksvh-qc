import { PlusOutlined } from '@ant-design/icons'
import { Button, Card, Flex, Space } from 'antd'
import { useCallback, useMemo, useState } from 'react'
import { AdvancedFilter, type FilterTagItem } from '@/components/data-entry/AdvancedFilter'
import { ActiveFilter } from '@/components/data-entry/ActiveFilter'
import { PageContainer } from '@/components/layout/PageContainer'
import { EmployeeDetailModal } from '@/features/employees/components/EmployeeDetailModal'
import { EmployeeFormModal } from '@/features/employees/components/EmployeeFormModal'
import { EmployeeTable } from '@/features/employees/components/EmployeeTable'
import type { Employee } from '@/features/employees/employees.types'
import { useDeleteEmployee, useEmployees } from '@/features/employees/hooks/useEmployees'
import { OrgUnitPicker } from '@/features/organizations'
import { useConfirm } from '@/hooks/useConfirm'
import { useListParams } from '@/hooks/useListParams'
import { useNotify } from '@/hooks/useNotify'
import { PERMISSIONS, ProtectedAction } from '@/permissions'
import { EmployeeExcelActions } from '@/features/employees/components/EmployeeExcelActions'

interface EmployeeFilters extends Record<string, unknown> {
  keyword?: string
  orgUnitId?: number
  active?: boolean
}

export function EmployeeListPage() {
  const { params, filters, setFilter, onTableChange, resetFilters, activeFilterCount } = useListParams<EmployeeFilters>()
  const employees = useEmployees(params)
  const remove = useDeleteEmployee()
  const confirm = useConfirm()
  const notify = useNotify()

  const [editing, setEditing] = useState<{ open: boolean; employee?: Employee }>({ open: false })
  const [viewing, setViewing] = useState<Employee>()

  const onSearch = useCallback((keyword: string) => setFilter('keyword', keyword || undefined), [setFilter])

  const onDelete = useCallback(
    async (employee: Employee) => {
      const ok = await confirm({
        title: 'Xoá nhân viên',
        content: `Bạn có chắc chắn muốn xoá nhân viên "${employee.fullName}" (${employee.employeeCode})? Hành động này không thể hoàn tác.`,
        okText: 'Xoá',
        danger: true,
      })
      if (!ok) return
      try {
        await remove.mutateAsync(employee.id)
        notify.success(`Đã xoá nhân viên ${employee.fullName}`)
      } catch (err: unknown) {
        const msg = (err as { message?: string })?.message ?? 'Không thể xoá nhân viên'
        notify.error(msg)
      }
    },
    [confirm, notify, remove],
  )


  const activeTags = useMemo<FilterTagItem[]>(() => {
    const tags: FilterTagItem[] = []
    if (filters.keyword) {
      tags.push({ key: 'keyword', label: `Từ khoá: ${filters.keyword}`, onClose: () => setFilter('keyword', undefined) })
    }
    if (filters.orgUnitId) {
      tags.push({ key: 'orgUnitId', label: `Đơn vị ID: ${filters.orgUnitId}`, onClose: () => setFilter('orgUnitId', undefined) })
    }
    if (filters.active !== undefined) {
      tags.push({
        key: 'active',
        label: filters.active ? 'Đang làm việc' : 'Nghỉ việc',
        onClose: () => setFilter('active', undefined),
      })
    }
    return tags
  }, [filters, setFilter])

  return (
    <PageContainer
      title="Nhân viên"
      subtitle="Hồ sơ nhân sự: mã NV, chức danh, đơn vị; có thể liên kết một tài khoản đăng nhập"
      extra={
        <Space size={8}>
          <EmployeeExcelActions />
          <ProtectedAction access={PERMISSIONS.EMPLOYEE.MANAGE}>
            <Button type="primary" icon={<PlusOutlined />} onClick={() => setEditing({ open: true })}>
              Thêm nhân viên
            </Button>
          </ProtectedAction>
        </Space>
      }
    >
      <Card>
        <Flex vertical gap={16}>
          <AdvancedFilter
            search={{ value: filters.keyword ?? '', placeholder: 'Tìm theo mã, họ tên, SĐT, email', onSearch }}
            activeCount={activeFilterCount}
            onReset={resetFilters}
            activeTags={activeTags}
          >
            <OrgUnitPicker
              style={{ minWidth: 240 }}
              value={filters.orgUnitId}
              onChange={(v) => setFilter('orgUnitId', v ?? undefined)}
              includeInactive
            />
            <ActiveFilter
              value={filters.active}
              onChange={(v) => setFilter('active', v)}
              activeLabel="Đang làm việc"
              inactiveLabel="Nghỉ việc"
            />
          </AdvancedFilter>
          <EmployeeTable
            data={employees.data}
            loading={employees.isFetching}
            error={employees.error}
            onRetry={() => void employees.refetch()}
            params={params}
            onParamsChange={onTableChange}
            onView={setViewing}
            onEdit={(employee) => setEditing({ open: true, employee })}
            onDelete={onDelete}
          />
        </Flex>
      </Card>
      <EmployeeFormModal open={editing.open} employee={editing.employee} onClose={() => setEditing({ open: false })} />
      <EmployeeDetailModal
        open={Boolean(viewing)}
        employee={viewing}
        onClose={() => setViewing(undefined)}
        onEdit={(employee) => {
          setViewing(undefined)
          setEditing({ open: true, employee })
        }}
      />
    </PageContainer>
  )
}
