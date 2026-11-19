import { EnvironmentOutlined } from '@ant-design/icons'
import { Flex, Space, Tag, Tooltip, Typography } from 'antd'
import { DataTable, type DataTableProps } from '@/components/data-display/DataTable'
import { TableActions } from '@/components/data-display/TableActions'
import { ActiveBadge } from '@/features/organizations/components/ActiveBadge'
import { OrgUnitTypeTag } from '@/features/organizations/components/OrgUnitTypeTag'
import {
  ORG_UNIT_TYPE_LABEL,
  RISK_POLICY_LABEL,
  type RiskPolicy,
  type OrgUnit,
  type OrgUnitType,
} from '@/features/organizations/organizations.types'
import { PERMISSIONS } from '@/permissions'
import { actionColumnWidth } from '@/components/data-display/tableActions.utils'

type OrgUnitTableProps = Omit<DataTableProps<OrgUnit>, 'columns' | 'rowKey'> & {
  onView: (unit: OrgUnit) => void
  onEdit: (unit: OrgUnit) => void
  onDelete: (unit: OrgUnit) => void
  onFilterType?: (type: OrgUnitType) => void
  fixedUnitType?: OrgUnitType
}

export function OrgUnitTable({ onView, onEdit, onDelete, onFilterType, fixedUnitType, ...props }: OrgUnitTableProps) {
  const isDepartment = fixedUnitType === 'DEPARTMENT'
  const isRestaurant = fixedUnitType === 'RESTAURANT'

  const columns = [
    {
      title: '#',
      key: 'index',
      width: 60,
      align: 'center' as const,
      render: (_: unknown, __: unknown, index: number) =>
        ((props.params?.page ?? 0) * (props.params?.size ?? 20)) + index + 1,
    },
    { title: 'Mã đơn vị', dataIndex: 'code', key: 'code', sorter: true, width: 130, className: 'col-code', render: (code: string) => <span className="code-tag--blue">{code}</span> },
    {
      title: isDepartment ? 'Tên phòng ban' : isRestaurant ? 'Tên nhà hàng / cơ sở' : 'Tên đơn vị / cơ sở',
      dataIndex: 'name',
      key: 'name',
      sorter: true,
      render: (name: string, row: OrgUnit) => (
        <Flex vertical style={{ maxWidth: 260 }}>
          <span className="cell-title-link" onClick={() => onView(row)} title="Nhấp để xem chi tiết">
            {name}
          </span>
          {row.address && (
            <Typography.Text type="secondary" ellipsis={{ tooltip: row.address }}>
              {row.address}
            </Typography.Text>
          )}
        </Flex>
      ),
    },
    ...(!fixedUnitType
      ? [
          {
            title: 'Loại đơn vị',
            dataIndex: 'unitType',
            key: 'unitType',
            sorter: true,
            width: 170,
            render: (t: OrgUnitType) => {
              return (
                <Space size={4} wrap>
                  <Tooltip title={onFilterType ? `Nhấp để lọc riêng ${ORG_UNIT_TYPE_LABEL[t]}` : undefined}>
                    <OrgUnitTypeTag
                      type={t}
                      onClick={onFilterType ? () => onFilterType(t) : undefined}
                    />
                  </Tooltip>
                </Space>
              )
            },
          },
        ]
      : []),
    // Tên công ty dài: xuống tối đa 2 dòng theo từ (không bẻ từng chữ), rê chuột xem đủ.
    // Không dùng `ellipsis` của antd (nó chuyển cả bảng sang table-layout: fixed, bóp cột không khai báo độ rộng).
    {
      title: 'Công ty thành viên',
      dataIndex: 'companyName',
      width: 240,
      render: (v: string) => (
        <span className="cell-clamp-2" title={v}>
          {v}
        </span>
      ),
    },
    ...(!isDepartment
      ? [
          {
            title: 'Định vị GPS / Check-in',
            key: 'gps',
            width: 200,
            // Toạ độ trên một dòng (bấm để mở Google Maps), bán kính check-in là dòng phụ.
            render: (_: unknown, row: OrgUnit) =>
              row.latitude !== null && row.longitude !== null ? (
                <Flex vertical gap={2}>
                  <Typography.Link
                    href={`https://www.google.com/maps?q=${row.latitude},${row.longitude}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="cell-nowrap cell-num"
                  >
                    <EnvironmentOutlined style={{ marginRight: 4 }} />
                    {`${row.latitude.toFixed(5)}, ${row.longitude.toFixed(5)}`}
                  </Typography.Link>
                  <span className="cell-sub">{`Bán kính ${row.checkinRadiusM ?? '?'} m`}</span>
                </Flex>
              ) : (
                <span className="cell-sub">Chưa có toạ độ</span>
              ),
          },
          {
            title: 'Chính sách rủi ro',
            dataIndex: 'riskPolicy',
            key: 'riskPolicy',
            width: 170,
            render: (policy: RiskPolicy) => (
              <Tag color={policy === 'STRICT' ? 'error' : 'default'}>{RISK_POLICY_LABEL[policy]}</Tag>
            ),
          },
        ]
      : []),
    { title: 'Trạng thái', dataIndex: 'active', width: 160, render: (active: boolean) => <ActiveBadge active={active} /> },
    {
      title: 'Thao tác',
      key: 'actions',
      width: actionColumnWidth(3),
      // Ghim mép phải bằng CSS sticky (.col-actions), không làm đổi bố cục các cột khác.
      className: 'col-actions',
      align: 'center' as const,
      render: (_: unknown, row: OrgUnit) => (
        <TableActions
          onView={() => onView(row)}
          onEdit={() => onEdit(row)}
          editAccess={PERMISSIONS.ORGANIZATION.MANAGE}
          onDelete={() => onDelete(row)}
          deleteAccess={PERMISSIONS.ORGANIZATION.MANAGE}
          recordName={row.name}
        />
      ),
    },
  ]

  return (
    <DataTable<OrgUnit>
      {...props}
      rowKey="id"
      // Độ rộng các cột phù hợp sau khi ẩn 2 cột CHT và OBM ra modal chi tiết
      scroll={{ x: 1390 }}
      columns={columns}
    />
  )
}
