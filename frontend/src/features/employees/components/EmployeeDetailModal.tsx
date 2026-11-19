import { EditOutlined, IdcardOutlined, ShopOutlined, SolutionOutlined } from '@ant-design/icons'
import { Button, Tag } from 'antd'
import { StatusBadge, type BadgeTone } from '@/components/data-display/StatusBadge'
import { DetailModal, type DetailField } from '@/components/feedback/DetailModal'
import type { Employee } from '@/features/employees/employees.types'
import { formatDateTime } from '@/utils/format-date'

const ACTIVE_META: Record<'active' | 'inactive', { label: string; tone: BadgeTone }> = {
  active: { label: 'Đang làm việc', tone: 'success' },
  inactive: { label: 'Nghỉ việc', tone: 'default' },
}

export interface EmployeeDetailModalProps {
  open: boolean
  employee?: Employee
  onClose: () => void
  onEdit?: (employee: Employee) => void
}

export function EmployeeDetailModal({ open, employee, onClose, onEdit }: EmployeeDetailModalProps) {
  if (!employee) return null

  const fields: DetailField[] = [
    { label: 'Mã nhân viên', value: employee.employeeCode },
    { label: 'Họ và tên', value: employee.fullName },
    { label: 'Chức danh', value: employee.jobTitle ?? '—' },
    { label: 'Đơn vị trực thuộc', value: employee.orgUnitName ?? '—' },
    { label: 'Số điện thoại', value: employee.phone ?? '—' },
    { label: 'Email', value: employee.email ?? '—' },
    {
      label: 'Tài khoản người dùng',
      value: employee.username ? <Tag>{employee.username}</Tag> : 'Chưa liên kết',
    },
    {
      label: 'Trạng thái',
      value: <StatusBadge status={employee.active ? 'active' : 'inactive'} meta={ACTIVE_META} />,
    },
  ]

  const extraFooter = onEdit ? (
    <Button
      key="edit"
      icon={<EditOutlined />}
      onClick={() => {
        onClose()
        onEdit(employee)
      }}
    >
      Chỉnh sửa
    </Button>
  ) : undefined

  return (
    <DetailModal
      open={open}
      title="Chi tiết nhân viên"
      icon={<IdcardOutlined />}
      hero={{
        avatar: employee.fullName.trim().split(/\s+/).at(-1)?.charAt(0).toUpperCase(),
        eyebrow: 'Hồ sơ nhân viên',
        title: employee.fullName,
        status: <StatusBadge status={employee.active ? 'active' : 'inactive'} meta={ACTIVE_META} />,
        chips: [
          { icon: <IdcardOutlined />, label: employee.employeeCode },
          ...(employee.jobTitle ? [{ icon: <SolutionOutlined />, label: employee.jobTitle }] : []),
          ...(employee.orgUnitName ? [{ icon: <ShopOutlined />, label: employee.orgUnitName }] : []),
        ],
      }}
      audit={{ createdAt: formatDateTime(employee.createdAt) }}
      fields={fields}
      extraFooter={extraFooter}
      onClose={onClose}
    />
  )
}

