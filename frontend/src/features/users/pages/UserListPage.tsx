import { Card, Flex } from 'antd'
import { useCallback } from 'react'
import { FilterBar } from '@/components/data-entry/FilterBar'
import { PageContainer } from '@/components/layout/PageContainer'
import { UserTable } from '@/features/users/components/UserTable'
import { useUsers } from '@/features/users/hooks/useUsers'
import { useListParams } from '@/hooks/useListParams'

interface UserFilters extends Record<string, unknown> {
  keyword?: string
}

export function UserListPage() {
  const { params, filters, setFilter, onTableChange, resetFilters, activeFilterCount } = useListParams<UserFilters>()
  const users = useUsers(params)

  const onSearch = useCallback(
    (keyword: string) => setFilter('keyword', keyword || undefined),
    [setFilter],
  )

  return (
    <PageContainer title="Người dùng" subtitle="Danh sách tài khoản và vai trò">
      <Card>
        <Flex vertical gap={16}>
          <FilterBar
            search={{
              value: filters.keyword ?? '',
              placeholder: 'Tìm theo tên đăng nhập hoặc họ tên',
              onSearch,
            }}
            activeCount={activeFilterCount}
            onReset={resetFilters}
          />
          <UserTable
            data={users.data}
            loading={users.isFetching}
            error={users.error}
            onRetry={() => void users.refetch()}
            params={params}
            onParamsChange={onTableChange}
          />
        </Flex>
      </Card>
    </PageContainer>
  )
}
