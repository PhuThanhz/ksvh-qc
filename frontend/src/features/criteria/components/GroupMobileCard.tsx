import { RightOutlined } from '@ant-design/icons'
import { Space, Tag } from 'antd'
import { TableActions } from '@/components/data-display/TableActions'
import { StatusBadge } from '@/components/data-display/StatusBadge'
import type { CriterionGroup } from '@/features/criteria/criteria.types'
import { PERMISSIONS } from '@/permissions'

const ACTIVE_META = {
  active: { label: 'Đang dùng', tone: 'success' as const },
  inactive: { label: 'Ngưng', tone: 'default' as const },
}

interface Props {
  group: CriterionGroup
  index: number
  onEdit: (group: CriterionGroup) => void
  onAddCriterion: (group: CriterionGroup) => void
  onViewCriteria: (group: CriterionGroup) => void
  onDelete: (group: CriterionGroup) => void
}

export function GroupMobileCard({
  group: g,
  index,
  onEdit,
  onAddCriterion,
  onViewCriteria,
  onDelete,
}: Props) {
  return (
    <div className="app-mobile-card">
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          gap: 8,
          marginBottom: 6,
        }}
      >
        <div style={{ flex: 1, minWidth: 0 }}>
          <Space size={6} align="center">
            <span style={{ fontSize: 12, color: 'var(--app-text-secondary)', fontWeight: 600 }}>
              #{index + 1}
            </span>
            <span className="code-tag--blue">
              {g.code}
            </span>
          </Space>
          <div
            onClick={() => onViewCriteria(g)}
            style={{
              fontWeight: 600,
              fontSize: 14,
              color: '#0f172a',
              cursor: 'pointer',
              marginTop: 4,
              textDecoration: g.active ? 'none' : 'line-through',
              wordBreak: 'break-word',
            }}
          >
            {g.name}
          </div>
        </div>
        <StatusBadge status={g.active ? 'active' : 'inactive'} meta={ACTIVE_META} />
      </div>

      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          fontSize: 12,
          color: 'var(--app-text-secondary)',
          margin: '8px 0',
        }}
      >
        <span>
          {g.companyName ? (
            <Tag style={{ margin: 0 }}>{g.companyName}</Tag>
          ) : (
            <Tag color="default" style={{ margin: 0 }}>
              Dùng chung hệ thống
            </Tag>
          )}
        </span>
        <Tag
          onClick={() => onViewCriteria(g)}
          style={{
            cursor: 'pointer',
            borderRadius: 999,
            margin: 0,
            fontWeight: 600,
            fontSize: 11.5,
          }}
        >
          {g.criterionCount ?? 0} tiêu chí <RightOutlined style={{ fontSize: 8, opacity: 0.7 }} />
        </Tag>
      </div>

      <div
        style={{
          borderTop: '1px solid var(--app-border)',
          paddingTop: 8,
          marginTop: 4,
          display: 'flex',
          justifyContent: 'flex-end',
        }}
      >
        <TableActions
          recordName={g.name}
          onView={() => onViewCriteria(g)}
          viewLabel="Xem chi tiết nhóm tiêu chí"
          onAdd={() => onAddCriterion(g)}
          addLabel="Thêm tiêu chí vào nhóm"
          addAccess={PERMISSIONS.CRITERIA.MANAGE}
          onEdit={() => onEdit(g)}
          editLabel="Sửa nhóm tiêu chí"
          editAccess={PERMISSIONS.CRITERIA.MANAGE}
          onDelete={() => onDelete(g)}
          deleteLabel="Xoá nhóm tiêu chí"
          deleteAccess={PERMISSIONS.CRITERIA.MANAGE}
        />
      </div>
    </div>
  )
}
