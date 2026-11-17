import {
  AppstoreAddOutlined,
  EditOutlined,
  EyeOutlined,
  PlusCircleOutlined,
  RightOutlined,
} from '@ant-design/icons'
import { Space, Tag, Tooltip, Typography } from 'antd'
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
          gap: 8,
        }}
      >
        <Tooltip title="Xem chi tiết nhóm">
          <button
            type="button"
            className="action-btn action-btn-view"
            aria-label={`Xem chi tiết nhóm ${g.name}`}
            onClick={() => onViewCriteria(g)}
          >
            <EyeOutlined />
          </button>
        </Tooltip>
        <ProtectedAction access={PERMISSIONS.CRITERIA.MANAGE}>
          <Tooltip title="Thêm 1 tiêu chí con">
            <button
              type="button"
              className="action-btn action-btn-add"
              aria-label={`Thêm tiêu chí con vào nhóm ${g.name}`}
              onClick={() => onAddCriterion(g)}
            >
              <PlusCircleOutlined />
            </button>
          </Tooltip>
        </ProtectedAction>
        {onBatchAddCriteria && (
          <ProtectedAction access={PERMISSIONS.CRITERIA.MANAGE}>
            <Tooltip title="Thêm nhanh nhiều tiêu chí con">
              <button
                type="button"
                className="action-btn action-btn-add"
                aria-label={`Thêm nhanh nhiều tiêu chí vào nhóm ${g.name}`}
                onClick={() => onBatchAddCriteria(g)}
              >
                <AppstoreAddOutlined />
              </button>
            </Tooltip>
          </ProtectedAction>
        )}
        <ProtectedAction access={PERMISSIONS.CRITERIA.MANAGE}>
          <Tooltip title="Sửa thông tin nhóm">
            <button
              type="button"
              className="action-btn action-btn-edit"
              aria-label={`Sửa nhóm ${g.name}`}
              onClick={() => onEdit(g)}
            >
              <EditOutlined />
            </button>
          </Tooltip>
        </ProtectedAction>
      </div>
    </div>
  )
}
