import { Flex, Space, Tag, Tooltip, Typography } from 'antd'
import { DataTable, type DataTableProps } from '@/components/data-display/DataTable'
import { TableActions } from '@/components/data-display/TableActions'
import { ActiveBadge } from '@/features/organizations/components/ActiveBadge'
import {
  ORG_UNIT_TYPE_LABEL,
  type OrgUnit,
  type OrgUnitType,
  type UserRef,
} from '@/features/organizations/organizations.types'
import { PERMISSIONS } from '@/permissions'

type OrgUnitTableProps = Omit<DataTableProps<OrgUnit>, 'columns' | 'rowKey'> & {
  onView: (unit: OrgUnit) => void
  onEdit: (unit: OrgUnit) => void
  onDelete: (unit: OrgUnit) => void
  onFilterType?: (type: OrgUnitType) => void
  fixedUnitType?: OrgUnitType
}

const userName = (u: UserRef | null) => u?.fullName ?? '—'

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
    { title: 'Mã', dataIndex: 'code', key: 'code', sorter: true, width: 110 },
    {
      title: isDepartment ? 'Tên phòng ban' : isRestaurant ? 'Tên nhà hàng' : 'Tên đơn vị',
      dataIndex: 'name',
      key: 'name',
      sorter: true,
      render: (name: string, row: OrgUnit) => (
        <Flex vertical style={{ maxWidth: 260 }}>
          <Typography.Link onClick={() => onView(row)} style={{ fontWeight: 500 }}>{name}</Typography.Link>
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
                    <Tag
                      style={{ cursor: onFilterType ? 'pointer' : 'default', fontWeight: 500 }}
                      onClick={onFilterType ? () => onFilterType(t) : undefined}
                    >
                      {ORG_UNIT_TYPE_LABEL[t]}
                    </Tag>
                  </Tooltip>
                </Space>
              )
            },
          },
        ]
      : []),
    { title: 'Công ty', dataIndex: 'companyName', width: 140 },
    ...(!isDepartment
      ? [
          { title: 'Cửa hàng trưởng', dataIndex: 'storeManager', width: 160, render: userName },
          { title: 'OBM', dataIndex: 'obm', width: 150, render: userName },
          {
            title: 'GPS',
            key: 'gps',
            width: 160,
            render: (_: unknown, row: OrgUnit) =>
              row.latitude !== null && row.longitude !== null ? (
                <Flex vertical>
                  <span>{`${row.latitude.toFixed(5)}, ${row.longitude.toFixed(5)}`}</span>
                  <Typography.Text type="secondary">{`Bán kính ${row.checkinRadiusM ?? '?'} m`}</Typography.Text>
                </Flex>
              ) : (
                '—'
              ),
          },
        ]
      : []),
    { title: 'Trạng thái', dataIndex: 'active', width: 110, render: (active: boolean) => <ActiveBadge active={active} /> },
    {
      title: 'Thao tác',
      key: 'actions',
      width: 140,
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
      scroll={{ x: 1250 }}
      columns={columns}
    />
  )
}
