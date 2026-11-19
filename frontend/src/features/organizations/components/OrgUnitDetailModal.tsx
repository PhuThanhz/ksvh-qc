import { EditOutlined, EnvironmentOutlined } from '@ant-design/icons'
import { Button, Space, Typography } from 'antd'
import { DetailModal, type DetailField } from '@/components/feedback/DetailModal'
import { ActiveBadge } from '@/features/organizations/components/ActiveBadge'
import { OrgUnitTypeTag } from '@/features/organizations/components/OrgUnitTypeTag'
import {
  type OrgUnit,
  type OrgUnitType,
  type UserRef,
} from '@/features/organizations/organizations.types'
import { formatDateTime } from '@/utils/format-date'

export interface OrgUnitDetailModalProps {
  open: boolean
  unit?: OrgUnit
  fixedUnitType?: OrgUnitType
  onClose: () => void
  onEdit?: (unit: OrgUnit) => void
}

const formatUser = (u: UserRef | null) => (u ? `${u.fullName} (${u.username})` : '—')

export function OrgUnitDetailModal({ open, unit, fixedUnitType, onClose, onEdit }: OrgUnitDetailModalProps) {
  if (!unit) return null
  const isDepartment = (fixedUnitType ?? unit.unitType) === 'DEPARTMENT'
  const title = isDepartment ? `Chi tiết phòng ban: ${unit.name}` : `Chi tiết nhà hàng: ${unit.name}`

  const hasCoords = unit.latitude !== null && unit.longitude !== null
  const mapUrl = hasCoords ? `https://www.google.com/maps?q=${unit.latitude},${unit.longitude}` : null

  const fields: DetailField[] = [
    { label: 'Mã đơn vị', value: <span className="code-tag--blue">{unit.code}</span> },
    { label: 'Trạng thái', value: <ActiveBadge active={unit.active} /> },
    { label: 'Tên đơn vị', value: unit.name },
    { label: 'Công ty', value: `${unit.companyCode} – ${unit.companyName}` },
    { label: 'Loại đơn vị', value: <OrgUnitTypeTag type={unit.unitType} /> },
  ]

  if (isDepartment) {
    fields.push({ label: 'Địa chỉ / Vị trí', value: unit.address ?? '—', span: 2 })
  } else {
    fields.push(
      { label: 'Địa chỉ', value: unit.address ?? '—', span: 2 },
      { label: 'Cửa hàng trưởng', value: formatUser(unit.storeManager) },
      { label: 'OBM', value: formatUser(unit.obm) },
      {
        label: 'Toạ độ GPS',
        value: hasCoords ? (
          <Space>
            <span>{`${unit.latitude?.toFixed(6)}, ${unit.longitude?.toFixed(6)}`}</span>
            <Typography.Link href={mapUrl!} target="_blank" rel="noopener noreferrer">
              <EnvironmentOutlined /> Bản đồ
            </Typography.Link>
          </Space>
        ) : (
          '—'
        ),
      },
      {
        label: 'Bán kính check-in',
        value: unit.checkinRadiusM ? `${unit.checkinRadiusM} mét` : '—',
      },
    )
  }

  fields.push(
    { label: 'Ngày tạo', value: formatDateTime(unit.createdAt) },
    { label: 'Cập nhật lần cuối', value: formatDateTime(unit.updatedAt) },
  )

  const extraFooter = onEdit ? (
    <Button
      key="edit"
      icon={<EditOutlined />}
      onClick={() => {
        onClose()
        onEdit(unit)
      }}
    >
      Chỉnh sửa
    </Button>
  ) : undefined

  return (
    <DetailModal
      open={open}
      title={title}
      width={720}
      fields={fields}
      extraFooter={extraFooter}
      onClose={onClose}
    />
  )
}
