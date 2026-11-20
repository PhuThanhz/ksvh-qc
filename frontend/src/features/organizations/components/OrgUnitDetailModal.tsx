import { AlertOutlined, ApartmentOutlined, BankOutlined, BarcodeOutlined, EditOutlined, EnvironmentOutlined, ShopOutlined, UserOutlined } from '@ant-design/icons'
import { Button, Space, Typography } from 'antd'
import { DetailModal, type DetailField } from '@/components/feedback/DetailModal'
import { EscalationCell } from '@/features/organizations/components/EscalationCell'
import { ActiveBadge } from '@/features/organizations/components/ActiveBadge'
import { OrgUnitTypeTag } from '@/features/organizations/components/OrgUnitTypeTag'
import {
  escalationOverrideText,
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
      {
        label: 'Ngưỡng nâng mức',
        value: <EscalationCell unit={unit} />,
      },
    )
  }

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
      icon={isDepartment ? <ApartmentOutlined /> : <ShopOutlined />}
      subtitle={isDepartment ? 'Phòng ban nghiệp vụ' : 'Cơ sở được kiểm tra'}
      hero={{
        avatar: isDepartment ? <ApartmentOutlined /> : <ShopOutlined />,
        eyebrow: isDepartment ? 'Phòng ban' : 'Nhà hàng',
        title: unit.name,
        status: <ActiveBadge active={unit.active} />,
        description: unit.address,
        chips: [
          { icon: <BarcodeOutlined />, label: unit.code },
          { icon: <BankOutlined />, label: unit.companyName },
          ...(!isDepartment && unit.storeManager ? [{ icon: <UserOutlined />, label: `CHT: ${unit.storeManager.fullName}` }] : []),
          ...(!isDepartment && escalationOverrideText(unit) ? [{ icon: <AlertOutlined />, label: `Ngưỡng riêng: ${escalationOverrideText(unit)}` }] : []),
        ],
      }}
      audit={{ createdAt: formatDateTime(unit.createdAt), updatedAt: formatDateTime(unit.updatedAt) }}
      width={720}
      fields={fields}
      extraFooter={extraFooter}
      onClose={onClose}
    />
  )
}
