import { zodResolver } from '@hookform/resolvers/zod'
import { Col, Form, Modal, Row } from 'antd'
import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { FormField } from '@/components/data-entry/FormField'
import { FormInput } from '@/components/data-entry/FormInput'
import { FormSwitch } from '@/components/data-entry/FormSwitch'
import { useNotify } from '@/components/feedback/useNotify'
import type { Employee, EmployeePayload } from '@/features/employees/employees.types'
import { useSaveEmployee } from '@/features/employees/hooks/useEmployees'
import { employeeSchema, type EmployeeFormValues } from '@/features/employees/schemas/employee.schema'
import { OrgUnitPicker } from '@/features/organizations'
import { UserPicker } from '@/features/users'
import { applyFieldErrors, getErrorMessage } from '@/lib/http'

const EMPTY: EmployeeFormValues = {
  employeeCode: '',
  fullName: '',
  jobTitle: '',
  orgUnitId: null,
  phone: '',
  email: '',
  userId: null,
  active: true,
}

function toFormValues(e: Employee): EmployeeFormValues {
  return {
    employeeCode: e.employeeCode,
    fullName: e.fullName,
    jobTitle: e.jobTitle ?? '',
    orgUnitId: e.orgUnitId,
    phone: e.phone ?? '',
    email: e.email ?? '',
    userId: e.userId,
    active: e.active,
  }
}

function toPayload(v: EmployeeFormValues): EmployeePayload {
  return {
    employeeCode: v.employeeCode,
    fullName: v.fullName,
    jobTitle: v.jobTitle || undefined,
    orgUnitId: v.orgUnitId ?? undefined,
    phone: v.phone || undefined,
    email: v.email || undefined,
    userId: v.userId ?? undefined,
    active: v.active,
  }
}

export interface EmployeeFormModalProps {
  open: boolean
  employee?: Employee
  onClose: () => void
}

export function EmployeeFormModal({ open, employee, onClose }: EmployeeFormModalProps) {
  const notify = useNotify()
  const save = useSaveEmployee()
  const { control, handleSubmit, reset, setError } = useForm<EmployeeFormValues>({
    resolver: zodResolver(employeeSchema),
    defaultValues: EMPTY,
  })

  useEffect(() => {
    if (open) reset(employee ? toFormValues(employee) : EMPTY)
  }, [open, employee, reset])

  const onSubmit = handleSubmit((values) =>
    save.mutate(
      { id: employee?.id, body: toPayload(values) },
      {
        onSuccess: () => {
          notify.success(employee ? 'Đã cập nhật nhân viên' : 'Đã thêm nhân viên')
          onClose()
        },
        onError: (err) => {
          if (!applyFieldErrors(err, setError)) notify.error(getErrorMessage(err))
        },
      },
    ),
  )

  const currentUnit = employee?.orgUnitId && employee.orgUnitName ? { id: employee.orgUnitId, name: employee.orgUnitName } : null
  const currentAccount =
    employee?.userId && employee.username
      ? { id: employee.userId, username: employee.username, fullName: employee.fullName }
      : null

  return (
    <Modal
      open={open}
      title={employee ? `Sửa nhân viên: ${employee.fullName}` : 'Thêm nhân viên'}
      okText="Lưu"
      cancelText="Huỷ"
      width={720}
      centered
      styles={{ body: { maxHeight: 'calc(100vh - 180px)', overflowY: 'auto', paddingRight: 4 } }}
      confirmLoading={save.isPending}
      onOk={() => void onSubmit()}
      onCancel={onClose}
      destroyOnHidden
    >
      <Form layout="vertical" onFinish={() => void onSubmit()}>
        {/* Nút submit ẩn: nhấn Enter trong ô nhập sẽ lưu (nút Lưu nằm ở footer, ngoài form). */}
        <button type="submit" hidden />
        <Row gutter={16}>
          <Col xs={24} md={8}>
            <FormInput control={control} name="employeeCode" label="Mã nhân viên" required maxLength={30} placeholder="VD: NV0123" />
          </Col>
          <Col xs={24} md={16}>
            <FormInput control={control} name="fullName" label="Họ tên" required maxLength={150} placeholder="VD: Trần Thị Mai" />
          </Col>
          <Col xs={24} md={12}>
            <FormInput control={control} name="jobTitle" label="Chức danh" maxLength={150} placeholder="VD: Bếp trưởng, Quản lý sảnh..." />
          </Col>
          <Col xs={24} md={12}>
            <FormField
              control={control}
              name="orgUnitId"
              label="Nhà hàng / phòng ban"
              render={(field) => (
                <OrgUnitPicker value={field.value as number | null} onChange={field.onChange} current={currentUnit} />
              )}
            />
          </Col>
          <Col xs={24} md={12}>
            <FormInput control={control} name="phone" label="Số điện thoại" type="tel" maxLength={20} placeholder="VD: 0912345678" />
          </Col>
          <Col xs={24} md={12}>
            <FormInput control={control} name="email" label="Email" type="email" maxLength={150} placeholder="VD: mai.tran@lotusgroup.vn" />
          </Col>
          <Col span={24}>
            <FormField
              control={control}
              name="userId"
              label="Tài khoản đăng nhập"
              extra="Không bắt buộc. Mỗi tài khoản chỉ liên kết với một nhân viên. Tạo tài khoản ở trang Người dùng."
              render={(field) => (
                <UserPicker
                  value={field.value as number | null}
                  onChange={field.onChange}
                  current={currentAccount}
                  placeholder="Chọn tài khoản"
                />
              )}
            />
          </Col>
        </Row>
        <FormSwitch control={control} name="active" label="Đang làm việc" />
      </Form>
    </Modal>
  )
}
