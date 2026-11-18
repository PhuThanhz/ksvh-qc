import { AppstoreAddOutlined, RightOutlined } from '@ant-design/icons'
import { Space, Tag, Typography } from 'antd'
import { ActionButton, TableActions } from '@/components/data-display/TableActions'
import { StatusBadge } from '@/components/data-display/StatusBadge'
import type { CriterionGroup } from '@/features/criteria/criteria.types'
import { PERMISSIONS, ProtectedAction } from '@/permissions'

const ACTIVE_META = {
  active: { label: 'Đang dùng', tone: 'success' as const },
  inactive: { label: 'Ngưng', tone: 'default' as const },
}

interface Props {
  group: CriterionGroup
  index: number
  onEdit: (group: CriterionGroup) => void
  onAddCriterion: (group: CriterionGroup) => void
  onBatchAddCriteria?: (group: CriterionGroup) => void
  onViewCriteria: (group: CriterionGroup) => void
}

export function GroupMobileCard({
  group: g,
  index,
  onEdit,
  onAddCriterion,
  onBatchAddCriteria,
  onViewCriteria,
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
            <Typography.Text code strong style={{ fontSize: 12 }}>
              {g.code}
            </Typography.Text>
          </Space>
          <div
            onClick={() => onViewCriteria(g)}
            style={{
              fontWeight: 600,
              fontSize: 14,
              color: 'var(--app-primary)',
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
          viewLabel="Xem chi tiết nhóm"
          onAdd={() => onAddCriterion(g)}
          addLabel="Thêm 1 tiêu chí con"
          addAccess={PERMISSIONS.CRITERIA.MANAGE}
          onEdit={() => onEdit(g)}
          editLabel="Sửa thông tin nhóm"
          editAccess={PERMISSIONS.CRITERIA.MANAGE}
          extra={
            onBatchAddCriteria && (
              <ProtectedAction access={PERMISSIONS.CRITERIA.MANAGE}>
                <ActionButton
                  tone="add"
                  icon={<AppstoreAddOutlined />}
                  tooltip="Thêm nhanh nhiều tiêu chí con"
                  ariaLabel={`Thêm nhanh nhiều tiêu chí vào nhóm ${g.name}`}
                  onClick={() => onBatchAddCriteria(g)}
                />
              </ProtectedAction>
            )
          }
        />
      </div>
    </div>
  )
}
