import { AppstoreOutlined, ArrowRightOutlined, EditOutlined, PlusOutlined, SearchOutlined } from '@ant-design/icons'
import { Button, Col, Empty, Flex, Input, Row, Space, Table, Tag, Typography } from 'antd'
import { DetailDrawer } from '@/components/feedback/detail'
import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router'
import { StatusBadge } from '@/components/data-display/StatusBadge'
import { TableActions } from '@/components/data-display/TableActions'
import { ROUTES } from '@/constants/routes'
import { ImpactTag } from '@/features/criteria/components/ImpactTag'
import type { Criterion, CriterionGroup } from '@/features/criteria/criteria.types'
import { useCriteriaList } from '@/features/criteria/hooks/useCriteria'
import { PERMISSIONS, ProtectedAction } from '@/permissions'
import { actionColumnWidth } from '@/components/data-display/tableActions.utils'

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
    <DetailDrawer
      open={open}
      onClose={onClose}
      icon={<AppstoreOutlined />}
      title={
        <Flex align="center" gap={10} wrap="wrap">
          <span style={{ color: '#0f172a', fontWeight: 700 }}>Chi tiết nhóm tiêu chí: {group.name}</span>
          <span className="code-tag--blue">{group.code}</span>
          <StatusBadge status={group.active ? 'active' : 'inactive'} meta={ACTIVE_META} />
        </Flex>
      }
      actions={
        <Space wrap>
          <Button icon={<ArrowRightOutlined />} onClick={() => { onClose(); navigate(`${ROUTES.admin.criteria}?groupId=${group.id}`) }}>
            Xem toàn bộ danh sách tiêu chí
          </Button>
          {onAddCriterion && (
            <ProtectedAction access={PERMISSIONS.CRITERIA.MANAGE}>
              <Button icon={<PlusOutlined />} onClick={() => { onClose(); onAddCriterion(group) }}>
                Thêm tiêu chí
              </Button>
            </ProtectedAction>
          )}
          {onEditGroup && (
            <ProtectedAction access={PERMISSIONS.CRITERIA.MANAGE}>
              <Button type="primary" icon={<EditOutlined />} onClick={() => { onClose(); onEditGroup(group) }}>
                Chỉnh sửa nhóm
              </Button>
            </ProtectedAction>
          )}
        </Space>
      }
    >
      <div style={{ marginTop: 8 }}>
        {/* Khối tóm tắt thông tin nhóm chuẩn Apple card: Nền trắng tinh, nhãn xám nét, chữ đen tuyền */}
        <div
          style={{
            background: '#ffffff',
            borderRadius: 16,
            border: '1px solid rgba(15, 23, 42, 0.08)',
            padding: '18px 22px',
            marginBottom: 18,
            boxShadow: '0 2px 8px -2px rgba(15, 23, 42, 0.04), 0 1px 2px rgba(15, 23, 42, 0.02)',
          }}
        >
          <Row gutter={[24, 14]} align="middle">
            <Col xs={12} sm={5}>
              <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', color: '#64748b', marginBottom: 4 }}>
                Mã nhóm
              </div>
              <div>
                <span className="code-tag--blue">{group.code}</span>
              </div>
            </Col>
            <Col xs={12} sm={4}>
              <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', color: '#64748b', marginBottom: 4 }}>
                Thứ tự
              </div>
              <div style={{ fontSize: 14, fontWeight: 700, color: '#0f172a' }}>
                #{group.sortOrder}
              </div>
            </Col>
            <Col xs={12} sm={5}>
              <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', color: '#64748b', marginBottom: 4 }}>
                Số lượng tiêu chí
              </div>
              <div style={{ fontSize: 14, fontWeight: 700, color: '#0f172a' }}>
                {totalCount} tiêu chí
              </div>
            </Col>
            <Col xs={12} sm={6}>
              <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', color: '#64748b', marginBottom: 4 }}>
                Công ty áp dụng
              </div>
              <div style={{ fontSize: 13.5, fontWeight: 600, color: '#0f172a' }}>
                {group.companyName ? (
                  <Tag style={{ margin: 0, fontWeight: 600, color: '#0f172a', background: '#f8fafc', border: '1px solid #e2e8f0' }}>
                    {group.companyName}
                  </Tag>
                ) : (
                  <Tag style={{ margin: 0, fontWeight: 600, color: '#475569', background: '#f1f5f9', border: '1px solid #e2e8f0' }}>
                    Dùng chung toàn hệ thống
                  </Tag>
                )}
              </div>
            </Col>
            <Col xs={12} sm={4}>
              <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', color: '#64748b', marginBottom: 4 }}>
                Trạng thái
              </div>
              <div>
                <StatusBadge status={group.active ? 'active' : 'inactive'} meta={ACTIVE_META} />
              </div>
            </Col>
          </Row>
        </div>

        {/* Khối danh sách tiêu chí */}
        <div
          style={{
            background: '#ffffff',
            borderRadius: 16,
            border: '1px solid rgba(15, 23, 42, 0.08)',
            padding: '18px 20px',
            boxShadow: '0 2px 8px -2px rgba(15, 23, 42, 0.04)',
          }}
        >
          <Flex justify="space-between" align="center" style={{ marginBottom: 14 }} wrap="wrap" gap={12}>
            <Typography.Text strong style={{ fontSize: 15, color: '#0f172a' }}>
              Danh sách tiêu chí thuộc nhóm ({totalCount})
            </Typography.Text>
            <Input
              size="middle"
              prefix={<SearchOutlined style={{ color: '#94a3b8' }} />}
              placeholder="Tìm theo mã hoặc tên tiêu chí..."
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              allowClear
              style={{ width: 280, borderRadius: 8 }}
            />
          </Flex>

          <Table<Criterion>
            rowKey="id"
            size="small"
            loading={isLoading}
            dataSource={filteredList}
            pagination={{ pageSize: 20, showSizeChanger: true, size: 'small' }}
            locale={{ emptyText: <Empty description="Nhóm này chưa có tiêu chí nào" image={Empty.PRESENTED_IMAGE_SIMPLE} /> }}
            columns={[
              { title: '#', key: 'idx', width: 44, align: 'center', render: (_, __, i) => i + 1 },
              {
                title: 'Mã tiêu chí',
                dataIndex: 'code',
                key: 'code',
                width: 120,
                className: 'col-code',
                render: (code: string) => <span className="code-tag--blue">{code}</span>,
              },
              {
                title: 'Nội dung tiêu chí kiểm soát',
                dataIndex: 'name',
                key: 'name',
                render: (name: string, c) => (
                  <div>
                    <div style={{ fontWeight: 600, color: c.active ? '#0f172a' : '#94a3b8', fontSize: 13.5, textDecoration: c.active ? 'none' : 'line-through' }}>
                      {name}
                    </div>
                    {c.checkMethod && (
                      <div style={{ fontSize: 12, color: '#64748b', marginTop: 3 }}>
                        {c.checkMethod}
                      </div>
                    )}
                  </div>
                ),
              },
              {
                title: 'Mức độ ảnh hưởng',
                dataIndex: 'baseImpact',
                key: 'baseImpact',
                width: 130,
                align: 'center',
                render: (val: number) => <ImpactTag value={val} />,
              },
              {
                title: 'Trạng thái',
                dataIndex: 'active',
                key: 'active',
                width: 140,
                render: (act: boolean) => <StatusBadge status={act ? 'active' : 'inactive'} meta={ACTIVE_META} />,
              },
              {
                title: 'Thao tác',
                key: 'actions',
                width: actionColumnWidth(2),
                className: 'col-actions',
                align: 'center' as const,
                render: (_, c) => (
                  <TableActions
                    recordName={c.name}
                    onView={onViewCriterion ? () => onViewCriterion(c) : undefined}
                    viewLabel="Xem chi tiết tiêu chí"
                    onEdit={onEditCriterion ? () => { onClose(); onEditCriterion(c) } : undefined}
                    editLabel="Chỉnh sửa tiêu chí"
                    editAccess={PERMISSIONS.CRITERIA.MANAGE}
                  />
                ),
              },
            ]}
          />
        </div>
      </div>
    </DetailDrawer>
  )
}
