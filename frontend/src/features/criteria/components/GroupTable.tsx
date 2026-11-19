import { Table } from 'antd'
import { EmptyState } from '@/components/data-display/EmptyState'
import { TableCard } from '@/components/data-display/TableCard'
import { LoadingState } from '@/components/feedback/LoadingState'
import { GroupMobileCard } from '@/features/criteria/components/GroupMobileCard'
import { useGroupTableColumns } from '@/features/criteria/components/useGroupTableColumns'
import type { CriterionGroup } from '@/features/criteria/criteria.types'
import { useIsMobile } from '@/hooks/useIsMobile'

export interface GroupTableProps {
  groups: readonly CriterionGroup[] | undefined
  loading: boolean
  onEdit: (group: CriterionGroup) => void
  onAddCriterion: (group: CriterionGroup) => void
  onViewCriteria: (group: CriterionGroup) => void
  onDelete: (group: CriterionGroup) => void
}

export function GroupTable({
  groups,
  loading,
  onEdit,
  onAddCriterion,
  onViewCriteria,
  onDelete,
}: GroupTableProps) {
  const isMobile = useIsMobile()
  const columns = useGroupTableColumns({ onEdit, onAddCriterion, onViewCriteria, onDelete })

  if (isMobile) {
    return (
      <TableCard>
        {loading && !groups?.length ? (
          <LoadingState />
        ) : !groups?.length ? (
          <EmptyState description="Chưa có nhóm tiêu chí nào" />
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, padding: '4px 0' }}>
            {groups.map((g, idx) => (
              <GroupMobileCard
                key={g.id}
                group={g}
                index={idx}
                onEdit={onEdit}
                onAddCriterion={onAddCriterion}
                onViewCriteria={onViewCriteria}
                onDelete={onDelete}
              />
            ))}
          </div>
        )}
      </TableCard>
    )
  }

  return (
    <TableCard>
      <Table<CriterionGroup>
        rowKey="id"
        loading={loading}
        dataSource={groups as CriterionGroup[]}
        pagination={false}
        scroll={{ x: 960 }}
        onRow={(record) => ({
          onDoubleClick: () => onViewCriteria(record),
          style: { cursor: 'pointer' },
        })}
        columns={columns}
      />
    </TableCard>
  )
}
