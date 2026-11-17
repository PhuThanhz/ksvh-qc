import { AppstoreAddOutlined, ArrowRightOutlined, EditOutlined, EyeOutlined, PlusOutlined, SearchOutlined } from '@ant-design/icons'
import { Badge, Button, Descriptions, Empty, Flex, Input, Modal, Space, Table, Tag, Typography } from 'antd'
import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router'
import { StatusBadge } from '@/components/data-display/StatusBadge'
import { ROUTES } from '@/constants/routes'
import { ImpactTag } from '@/features/criteria/components/ImpactTag'
import type { Criterion, CriterionGroup } from '@/features/criteria/criteria.types'
import { useCriteriaList } from '@/features/criteria/hooks/useCriteria'
import { PERMISSIONS, ProtectedAction } from '@/permissions'

const ACTIVE_META = {
  active: { label: 'Đang dùng', tone: 'success' as const },
  inactive: { label: 'Ngưng', tone: 'default' as const },
}

export interface GroupDetailModalProps {
  open: boolean
  group?: CriterionGroup
  onClose: () => void
  onEditGroup?: (group: CriterionGroup) => void
  onAddCriterion?: (group: CriterionGroup) => void
  onBatchAddCriteria?: (group: CriterionGroup) => void
  onViewCriterion?: (criterion: Criterion) => void
  onEditCriterion?: (criterion: Criterion) => void
}

/** Modal xem chi tiết nhóm tiêu chí và toàn bộ các tiêu chí nhỏ bên trong. */
export function GroupDetailModal({
  open,
  group,
  onClose,
  onEditGroup,
  onAddCriterion,
  onBatchAddCriteria,
  onViewCriterion,
  onEditCriterion,
}: GroupDetailModalProps) {
  const navigate = useNavigate()
  const [keyword, setKeyword] = useState('')

  const { data: criteriaData, isLoading } = useCriteriaList({
    groupId: group?.id,
    page: 0,
    size: 100,
  })

  const filteredList = useMemo(() => {
    const list = criteriaData?.items ?? []
    if (!keyword.trim()) return list
    const q = keyword.trim().toLowerCase()
    return list.filter(
      (c) =>
        c.code.toLowerCase().includes(q) ||
        c.name.toLowerCase().includes(q) ||
        (c.checkMethod && c.checkMethod.toLowerCase().includes(q)),
    )
  }, [criteriaData?.items, keyword])

  if (!group) return null
  const totalCount = criteriaData?.items.length ?? group.criterionCount ?? 0

  return (
    <Modal
      open={open}
      title={
        <Flex align="center" gap={10} wrap="wrap">
          <Typography.Title level={5} style={{ margin: 0 }}>
            Chi tiết nhóm: {group.name}
          </Typography.Title>
          <Tag style={{ fontFamily: 'monospace', fontWeight: 600 }}>{group.code}</Tag>
          <StatusBadge status={group.active ? 'active' : 'inactive'} meta={ACTIVE_META} />
        </Flex>
      }
      width={900}
      centered
      styles={{ body: { maxHeight: 'calc(100vh - 160px)', overflowY: 'auto' } }}
      onCancel={onClose}
      destroyOnHidden
      footer={
        <Flex justify="space-between" align="center" wrap="wrap" gap={8}>
          <Button icon={<ArrowRightOutlined />} onClick={() => { onClose(); navigate(`${ROUTES.admin.criteria}?groupId=${group.id}`) }}>
            Mở trang tiêu chí đầy đủ
          </Button>
          <Space>
            {onBatchAddCriteria && (
              <ProtectedAction access={PERMISSIONS.CRITERIA.MANAGE}>
                <Button
                  icon={<AppstoreAddOutlined />}
                  onClick={() => {
                    onClose()
                    onBatchAddCriteria(group)
                  }}
                >
                  Thêm nhanh nhiều tiêu chí
                </Button>
              </ProtectedAction>
            )}
            {onAddCriterion && (
              <ProtectedAction access={PERMISSIONS.CRITERIA.MANAGE}>
                <Button type="dashed" icon={<PlusOutlined />} onClick={() => { onClose(); onAddCriterion(group) }}>
                  Thêm 1 tiêu chí con
                </Button>
              </ProtectedAction>
            )}
            {onEditGroup && (
              <ProtectedAction access={PERMISSIONS.CRITERIA.MANAGE}>
                <Button type="primary" icon={<EditOutlined />} onClick={() => { onClose(); onEditGroup(group) }}>
                  Sửa nhóm
                </Button>
              </ProtectedAction>
            )}
            <Button onClick={onClose}>Đóng</Button>
          </Space>
        </Flex>
      }
    >
      <div style={{ marginTop: 12 }}>
        <Descriptions bordered size="small" column={{ xs: 1, sm: 3 }} style={{ marginBottom: 16 }}>
          <Descriptions.Item label="Mã nhóm"><Typography.Text code strong>{group.code}</Typography.Text></Descriptions.Item>
          <Descriptions.Item label="Thứ tự">#{group.sortOrder}</Descriptions.Item>
          <Descriptions.Item label="Tiêu chí con"><Badge count={totalCount} showZero color="var(--app-text-secondary)" /></Descriptions.Item>
          <Descriptions.Item label="Công ty áp dụng" span={2}>
            {group.companyName ? <Tag>{group.companyName}</Tag> : <Tag color="default">Dùng chung toàn hệ thống</Tag>}
          </Descriptions.Item>
          <Descriptions.Item label="Trạng thái">
            <StatusBadge status={group.active ? 'active' : 'inactive'} meta={ACTIVE_META} />
          </Descriptions.Item>
        </Descriptions>

        <Flex justify="space-between" align="center" style={{ marginBottom: 10 }}>
          <Typography.Text strong style={{ fontSize: 14 }}>Danh sách tiêu chí con trong nhóm ({totalCount})</Typography.Text>
          <Input
            size="small"
            prefix={<SearchOutlined style={{ color: 'var(--app-text-secondary)' }} />}
            placeholder="Tìm theo mã hoặc tên tiêu chí..."
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            allowClear
            style={{ width: 250 }}
          />
        </Flex>

        <Table<Criterion>
          rowKey="id"
          size="small"
          loading={isLoading}
          dataSource={filteredList}
          pagination={{ pageSize: 20, showSizeChanger: true, size: 'small' }}
          locale={{ emptyText: <Empty description="Nhóm này chưa có tiêu chí con nào" image={Empty.PRESENTED_IMAGE_SIMPLE} /> }}
          columns={[
            { title: '#', key: 'idx', width: 44, align: 'center', render: (_, __, i) => i + 1 },
            { title: 'Mã tiêu chí', dataIndex: 'code', key: 'code', width: 110, render: (c: string) => <Typography.Text code strong>{c}</Typography.Text> },
            {
              title: 'Tên tiêu chí đánh giá',
              dataIndex: 'name',
              key: 'name',
              render: (name: string, c) => (
                <div>
                  <Typography.Text strong={c.active} delete={!c.active}>{name}</Typography.Text>
                  {c.checkMethod && <div style={{ fontSize: 11, color: 'var(--app-text-secondary)' }}>{c.checkMethod}</div>}
                </div>
              ),
            },
            { title: 'Mức ảnh hưởng', dataIndex: 'baseImpact', key: 'baseImpact', width: 120, align: 'center', render: (val: number) => <ImpactTag value={val} /> },
            { title: 'Trạng thái', dataIndex: 'active', key: 'active', width: 95, render: (act: boolean) => <StatusBadge status={act ? 'active' : 'inactive'} meta={ACTIVE_META} /> },
            {
              title: 'Thao tác',
              key: 'actions',
              width: 90,
              align: 'center',
              render: (_, c) => (
                <Space size={4}>
                  {onViewCriterion && (
                    <button type="button" className="action-btn action-btn-view" title="Xem chi tiết tiêu chí" onClick={() => onViewCriterion(c)}>
                      <EyeOutlined />
                    </button>
                  )}
                  {onEditCriterion && (
                    <ProtectedAction access={PERMISSIONS.CRITERIA.MANAGE}>
                      <button type="button" className="action-btn action-btn-edit" title="Sửa tiêu chí" onClick={() => { onClose(); onEditCriterion(c) }}>
                        <EditOutlined />
                      </button>
                    </ProtectedAction>
                  )}
                </Space>
              ),
            },
          ]}
        />
      </div>
    </Modal>
  )
}
