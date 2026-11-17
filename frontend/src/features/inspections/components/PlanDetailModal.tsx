import { Descriptions, Flex, Modal, Spin, Table, Tag, Typography } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import { StatusBadge } from '@/components/data-display/StatusBadge'
import { INSPECTION_STATUS_META, PLAN_STATUS_META } from '../constants/status'
import { RestaurantPriorWarningTag } from '@/features/inspections/components/RestaurantPriorWarningTag'
import { usePlan } from '@/features/inspections/hooks/useInspectionData'
import type { PlanAssignmentResponse } from '@/features/inspections/inspection.types'
import { formatDate } from '@/utils/format-date'

interface Props {
  planId?: number
  open: boolean
  onClose: () => void
}

export function PlanDetailModal({ planId, open, onClose }: Props) {
  const planQuery = usePlan(open ? planId : undefined)
  const plan = planQuery.data

  const columns: ColumnsType<PlanAssignmentResponse> = [
    {
      title: '#',
      width: 50,
      align: 'center',
      render: (_, __, i) => i + 1,
    },
    {
      title: 'Nhà hàng',
      key: 'restaurant',
      render: (_, r) => (
        <Flex gap={8} align="center" wrap="wrap">
          <span>
            <strong>{r.restaurantCode}</strong> - {r.restaurantName}
          </span>
          {r.priorUnresolvedCount && r.priorUnresolvedCount > 0 ? (
            <RestaurantPriorWarningTag
              restaurantId={r.restaurantId}
              count={r.priorUnresolvedCount}
              beforeDate={plan?.startDate}
            />
          ) : null}
        </Flex>
      ),
    },
    {
      title: 'Chuyên viên KSVH',
      dataIndex: 'inspectorName',
      key: 'inspectorName',
      width: 170,
    },
    {
      title: 'Mẫu phiếu',
      dataIndex: 'templateName',
      key: 'templateName',
      width: 180,
    },
    {
      title: 'Ngày dự kiến',
      dataIndex: 'scheduledDate',
      key: 'scheduledDate',
      width: 120,
      render: (d: string) => formatDate(d),
    },
    {
      title: 'Phiếu kiểm tra đã tạo',
      key: 'inspection',
      width: 220,
      render: (_, r) => {
        if (!r.inspectionId) {
          return <Tag color="default">Chưa tạo (tạo khi duyệt)</Tag>
        }
        return (
          <Flex gap={6} align="center">
            <Typography.Text strong style={{ fontFamily: 'monospace' }}>
              {r.inspectionCode}
            </Typography.Text>
            {r.inspectionStatus && <StatusBadge status={r.inspectionStatus} meta={INSPECTION_STATUS_META} />}
          </Flex>
        )
      },
    },
  ]

  return (
    <Modal
      open={open}
      title={`Chi tiết kế hoạch: ${plan?.planCode ?? ''}`}
      onCancel={onClose}
      footer={null}
      width={860}
      destroyOnClose
    >
      <Spin spinning={planQuery.isLoading}>
        {plan && (
          <Flex vertical gap={16} style={{ marginTop: 12 }}>
            <Descriptions bordered size="small" column={{ xs: 1, sm: 2, md: 3 }}>
              <Descriptions.Item label="Mã kế hoạch">{plan.planCode}</Descriptions.Item>
              <Descriptions.Item label="Tiêu đề">{plan.title}</Descriptions.Item>
              <Descriptions.Item label="Trạng thái">
                <StatusBadge status={plan.status} meta={PLAN_STATUS_META} />
              </Descriptions.Item>
              <Descriptions.Item label="Thời gian thực hiện">
                {`${formatDate(plan.startDate)} - ${formatDate(plan.endDate)}`}
              </Descriptions.Item>
              <Descriptions.Item label="Người tạo">{plan.createdByName || '—'}</Descriptions.Item>
              <Descriptions.Item label="Ngày tạo">{formatDate(plan.createdAt)}</Descriptions.Item>
              <Descriptions.Item label="Người duyệt">{plan.approvedByName || '—'}</Descriptions.Item>
              <Descriptions.Item label="Ngày duyệt">
                {plan.approvedAt ? formatDate(plan.approvedAt) : '—'}
              </Descriptions.Item>
              <Descriptions.Item label="Số phân công">
                <strong>{plan.assignmentCount ?? plan.assignments?.length ?? 0}</strong> nhà hàng
              </Descriptions.Item>
              {plan.rejectionReason && (
                <Descriptions.Item label="Lý do từ chối" span={3}>
                  <Typography.Text type="danger">{plan.rejectionReason}</Typography.Text>
                </Descriptions.Item>
              )}
              {plan.notes && (
                <Descriptions.Item label="Ghi chú" span={3}>
                  {plan.notes}
                </Descriptions.Item>
              )}
            </Descriptions>

            <Flex vertical gap={8}>
              <Typography.Text strong>
                Danh sách phân công ({plan.assignments?.length ?? 0} nhà hàng)
              </Typography.Text>
              <Table
                columns={columns}
                dataSource={plan.assignments ?? []}
                rowKey="id"
                pagination={false}
                size="small"
                locale={{ emptyText: 'Kế hoạch chưa có dòng phân công nào' }}
              />
            </Flex>
          </Flex>
        )}
      </Spin>
    </Modal>
  )
}
