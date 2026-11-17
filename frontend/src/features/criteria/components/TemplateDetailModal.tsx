import { EditOutlined, SearchOutlined } from '@ant-design/icons'
import { Badge, Button, Flex, Input, List, Spin, Tag, Typography } from 'antd'
import { useMemo, useState } from 'react'
import { StatusBadge } from '@/components/data-display/StatusBadge'
import { DetailModal, type DetailField } from '@/components/feedback/DetailModal'
import { ImpactTag } from '@/features/criteria/components/ImpactTag'
import type { Criterion, Template } from '@/features/criteria/criteria.types'
import { useTemplate } from '@/features/criteria/hooks/useTemplates'
import { formatDateTime } from '@/utils/format-date'

const ACTIVE_META = {
  active: { label: 'Đang dùng', tone: 'success' as const },
  inactive: { label: 'Ngưng dùng', tone: 'default' as const },
}

export interface TemplateDetailModalProps {
  open: boolean
  template?: Template
  onClose: () => void
  onEdit?: (template: Template) => void
}

export function TemplateDetailModal({ open, template, onClose, onEdit }: TemplateDetailModalProps) {
  const [filterText, setFilterText] = useState('')
  const detail = useTemplate(open && template?.id ? template.id : undefined)
  const fullTemplate = detail.data ?? template

  const criteriaList = useMemo<Criterion[]>(() => {
    const list = fullTemplate?.criteria ?? []
    if (!filterText.trim()) return list
    const q = filterText.trim().toLowerCase()
    return list.filter(
      (c) =>
        c.code.toLowerCase().includes(q) ||
        c.name.toLowerCase().includes(q) ||
        (c.groupName && c.groupName.toLowerCase().includes(q)),
    )
  }, [fullTemplate?.criteria, filterText])

  if (!template) return null

  const fields: DetailField[] = [
    { label: 'Mã mẫu phiếu', value: fullTemplate?.code ?? template.code },
    { label: 'Tên mẫu phiếu', value: fullTemplate?.name ?? template.name },
    {
      label: 'Công ty áp dụng',
      value: fullTemplate?.companyName ?? 'Dùng chung toàn hệ thống (mọi công ty)',
    },
    { label: 'Loại kiểm tra', value: fullTemplate?.inspectionType ?? '—' },
    { label: 'Mô tả', span: 2, value: fullTemplate?.description || '—' },
    {
      label: 'Trạng thái',
      value: <StatusBadge status={fullTemplate?.active ?? template.active ? 'active' : 'inactive'} meta={ACTIVE_META} />,
    },
    { label: 'Cập nhật lần cuối', value: formatDateTime(fullTemplate?.updatedAt ?? template.updatedAt) },
    {
      label: (
        <Flex vertical gap={4}>
          <span>Danh sách tiêu chí ({fullTemplate?.criterionCount ?? fullTemplate?.criteria?.length ?? 0})</span>
          {fullTemplate?.criteria && fullTemplate.criteria.length > 5 && (
            <Input
              size="small"
              prefix={<SearchOutlined style={{ color: 'var(--app-text-secondary)' }} />}
              placeholder="Tìm nhanh tiêu chí..."
              value={filterText}
              onChange={(e) => setFilterText(e.target.value)}
              allowClear
              style={{ maxWidth: 200, fontWeight: 'normal' }}
            />
          )}
        </Flex>
      ),
      span: 2,
      value: detail.isLoading ? (
        <div style={{ textAlign: 'center', padding: 24 }}>
          <Spin tip="Đang tải danh sách tiêu chí..." />
        </div>
      ) : criteriaList.length > 0 ? (
        <List
          size="small"
          bordered
          style={{ maxHeight: 280, overflowY: 'auto' }}
          dataSource={criteriaList}
          renderItem={(c, index) => (
            <List.Item
              extra={<ImpactTag value={c.baseImpact} />}
              style={{ padding: '6px 12px' }}
            >
              <List.Item.Meta
                title={
                  <Flex align="center" gap={8} wrap="wrap">
                    <Badge count={index + 1} style={{ backgroundColor: 'var(--app-text-secondary)' }} />
                    <Typography.Text strong code>[{c.code}]</Typography.Text>
                    <span>{c.name}</span>
                    {c.groupName && <Tag style={{ fontSize: 11 }}>{c.groupName}</Tag>}
                  </Flex>
                }
              />
            </List.Item>
          )}
        />
      ) : (
        <Typography.Text type="secondary">
          {fullTemplate?.criteria?.length ? 'Không tìm thấy tiêu chí phù hợp' : 'Chưa có tiêu chí nào trong mẫu phiếu này'}
        </Typography.Text>
      ),
    },
  ]

  const extraFooter = onEdit ? (
    <Button
      key="edit"
      icon={<EditOutlined />}
      onClick={() => {
        onClose()
        onEdit(fullTemplate ?? template)
      }}
    >
      Chỉnh sửa
    </Button>
  ) : undefined

  return (
    <DetailModal
      open={open}
      title={`Chi tiết mẫu phiếu chấm: ${template.code}`}
      width={740}
      fields={fields}
      extraFooter={extraFooter}
      onClose={() => {
        setFilterText('')
        onClose()
      }}
    />
  )
}
