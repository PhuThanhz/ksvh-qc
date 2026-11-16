import { zodResolver } from '@hookform/resolvers/zod'
import { Col, Form, Modal, Row } from 'antd'
import { useEffect, useMemo } from 'react'
import { useForm, useWatch } from 'react-hook-form'
import { FormInput } from '@/components/data-entry/FormInput'
import { FormSelect } from '@/components/data-entry/FormSelect'
import { FormSwitch } from '@/components/data-entry/FormSwitch'
import { useNotify } from '@/components/feedback/useNotify'
import { DEFAULT_CHECKIN_RADIUS_M } from '@/constants/app.constants'
import { RestaurantFormSection } from '@/features/organizations/components/RestaurantFormSection'
import { useCompanies, useSaveOrgUnit } from '@/features/organizations/hooks/useOrganizations'
import {
  ORG_UNIT_TYPE_LABEL,
  type OrgUnit,
  type OrgUnitPayload,
  type OrgUnitType,
} from '@/features/organizations/organizations.types'
import { orgUnitSchema, type OrgUnitFormValues } from '@/features/organizations/schemas/organization.schema'
import { applyFieldErrors, getErrorMessage } from '@/lib/http'

const COMPANY_OPTIONS_SIZE = 100
const TYPE_OPTIONS = (Object.keys(ORG_UNIT_TYPE_LABEL) as OrgUnitType[]).map((t) => ({
  value: t,
  label: ORG_UNIT_TYPE_LABEL[t],
}))

const EMPTY: OrgUnitFormValues = {
  companyId: null,
  unitType: 'RESTAURANT',
  code: '',
  name: '',
  address: '',
    storeManagerUserId: null,
  obmUserId: null,
  latitude: null,
  longitude: null,
  checkinRadiusM: DEFAULT_CHECKIN_RADIUS_M,
  active: true,
}

function toFormValues(u: OrgUnit): OrgUnitFormValues {
  return {
    companyId: u.companyId,
    unitType: u.unitType,
    code: u.code,
    name: u.name,
    address: u.address ?? '',
    storeManagerUserId: u.storeManager?.id ?? null,
    obmUserId: u.obm?.id ?? null,
    latitude: u.latitude,
    longitude: u.longitude,
    checkinRadiusM: u.checkinRadiusM ?? DEFAULT_CHECKIN_RADIUS_M,
    active: u.active,
  }
}

/** companyId đã được schema bảo đảm khác null. Trường trống gửi undefined; phòng ban: server tự bỏ trường của nhà hàng. */
function toPayload(v: OrgUnitFormValues): OrgUnitPayload {
  return {
    companyId: v.companyId ?? 0,
    unitType: v.unitType,
    code: v.code,
    name: v.name,
    address: v.address || undefined,
    storeManagerUserId: v.storeManagerUserId ?? undefined,
    obmUserId: v.obmUserId ?? undefined,
    latitude: v.latitude ?? undefined,
    longitude: v.longitude ?? undefined,
    checkinRadiusM: v.checkinRadiusM ?? undefined,
    active: v.active,
  }
}

export interface OrgUnitFormModalProps {
  open: boolean
  unit?: OrgUnit
  fixedUnitType?: OrgUnitType
  onClose: () => void
}

export function OrgUnitFormModal({ open, unit, fixedUnitType, onClose }: OrgUnitFormModalProps) {
  const notify = useNotify()
  const save = useSaveOrgUnit()
  const companies = useCompanies({ page: 0, size: COMPANY_OPTIONS_SIZE, active: true })
  const { control, handleSubmit, reset, setError, setValue } = useForm<OrgUnitFormValues>({
    resolver: zodResolver(orgUnitSchema),
    defaultValues: EMPTY,
  })
  const unitType = useWatch({ control, name: 'unitType' })
  const isRestaurant = (fixedUnitType ?? unitType) === 'RESTAURANT'

  useEffect(() => {
    if (open) {
      reset(unit ? toFormValues(unit) : { ...EMPTY, unitType: fixedUnitType ?? 'RESTAURANT' })
    }
  }, [open, unit, fixedUnitType, reset])

  // Công ty đã ngưng hoạt động không nằm trong danh sách chọn nhưng vẫn phải hiện tên khi sửa đơn vị cũ.
  const companyOptions = useMemo(() => {
    const list = (companies.data?.items ?? []).map((c) => ({ value: c.id, label: `${c.code} – ${c.name}` }))
    if (unit && !list.some((o) => o.value === unit.companyId)) {
      list.unshift({ value: unit.companyId, label: `${unit.companyCode} – ${unit.companyName}` })
    }
    return list
  }, [companies.data, unit])

  const itemLabel =
    fixedUnitType === 'RESTAURANT' ? 'nhà hàng' : fixedUnitType === 'DEPARTMENT' ? 'phòng ban' : 'đơn vị'
  const titleText = `${unit ? 'Sửa' : 'Thêm'} ${itemLabel}`

  const onSubmit = handleSubmit((values) =>
    save.mutate(
      { id: unit?.id, body: toPayload(values) },
      {
        onSuccess: () => {
          notify.success(unit ? `Đã cập nhật ${itemLabel}` : `Đã thêm ${itemLabel}`)
          onClose()
        },
        onError: (err) => {
          if (!applyFieldErrors(err, setError)) notify.error(getErrorMessage(err))
        },
      },
    ),
  )

  return (
    <Modal
      open={open}
      title={titleText}
      okText="Lưu"
      cancelText="Huỷ"
      width={720}
      confirmLoading={save.isPending}
      onOk={() => void onSubmit()}
      onCancel={onClose}
      destroyOnHidden
    >
      <Form layout="vertical" onFinish={() => void onSubmit()}>
        {/* Nút submit ẩn: nhấn Enter trong ô nhập sẽ lưu (nút Lưu nằm ở footer, ngoài form). */}
        <button type="submit" hidden />
        {fixedUnitType ? (
          <Row gutter={16}>
            <Col xs={24} md={12}>
              <FormSelect<OrgUnitFormValues, number>
                control={control}
                name="companyId"
                label="Công ty"
                required
                showSearch={{ optionFilterProp: 'label' }}
                placeholder="Chọn công ty"
                loading={companies.isFetching}
                options={companyOptions}
              />
            </Col>
            <Col xs={24} md={12}>
              <FormInput
                control={control}
                name="code"
                label={isRestaurant ? 'Mã nhà hàng' : 'Mã phòng ban'}
                required
                maxLength={30}
              />
            </Col>
            <Col span={24}>
              <FormInput
                control={control}
                name="name"
                label={isRestaurant ? 'Tên nhà hàng' : 'Tên phòng ban'}
                required
                maxLength={200}
              />
            </Col>
            <Col span={24}>
              <FormInput
                control={control}
                name="address"
                label={isRestaurant ? 'Địa chỉ' : 'Địa chỉ / Vị trí'}
                maxLength={500}
              />
            </Col>
          </Row>
        ) : (
          <Row gutter={16}>
            <Col xs={24} md={12}>
              <FormSelect<OrgUnitFormValues, OrgUnitType>
                control={control}
                name="unitType"
                label="Loại đơn vị"
                required
                options={TYPE_OPTIONS}
              />
            </Col>
            <Col xs={24} md={12}>
              <FormSelect<OrgUnitFormValues, number>
                control={control}
                name="companyId"
                label="Công ty"
                required
                showSearch={{ optionFilterProp: 'label' }}
                placeholder="Chọn công ty"
                loading={companies.isFetching}
                options={companyOptions}
              />
            </Col>
            <Col xs={24} md={8}>
              <FormInput control={control} name="code" label="Mã" required maxLength={30} />
            </Col>
            <Col xs={24} md={16}>
              <FormInput control={control} name="name" label="Tên" required maxLength={200} />
            </Col>
            <Col span={24}>
              <FormInput control={control} name="address" label="Địa chỉ" maxLength={500} />
            </Col>
          </Row>
        )}

        {isRestaurant && <RestaurantFormSection control={control} setValue={setValue} unit={unit} />}

        <FormSwitch control={control} name="active" label="Đang hoạt động" />
      </Form>
    </Modal>
  )
}
