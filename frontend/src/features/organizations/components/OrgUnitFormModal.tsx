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
import { useCompanies, useOrgUnits, useSaveOrgUnit } from '@/features/organizations/hooks/useOrganizations'
import {
  ORG_UNIT_TYPE_LABEL,
  type OrgUnit,
  type OrgUnitPayload,
  type OrgUnitType,
} from '@/features/organizations/organizations.types'
import { orgUnitSchema, type OrgUnitFormValues } from '@/features/organizations/schemas/organization.schema'
import { applyFieldErrors, getErrorMessage } from '@/lib/http'
import { nextSequentialCode, uniqueAcronymCode } from '@/utils/auto-code'

const COMPANY_OPTIONS_SIZE = 100
const TYPE_OPTIONS = (Object.keys(ORG_UNIT_TYPE_LABEL) as OrgUnitType[]).map((t) => ({
  value: t,
  label: ORG_UNIT_TYPE_LABEL[t],
}))

const EMPTY: OrgUnitFormValues = {
  companyId: null, unitType: 'RESTAURANT', code: '', name: '', address: '',
  latitude: null, longitude: null,
  checkinRadiusM: DEFAULT_CHECKIN_RADIUS_M, active: true,
  escalationThreshold: null,
  escalationResetMonths: null,
}

function toFormValues(u: OrgUnit): OrgUnitFormValues {
  return {
    companyId: u.companyId,
    unitType: u.unitType,
    code: u.code,
    name: u.name,
    address: u.address ?? '',
    latitude: u.latitude,
    longitude: u.longitude,
    checkinRadiusM: u.checkinRadiusM ?? DEFAULT_CHECKIN_RADIUS_M,
    active: u.active,
    escalationThreshold: u.escalationThreshold ?? null,
    escalationResetMonths: u.escalationResetMonths ?? null,
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
    latitude: v.latitude ?? undefined,
    longitude: v.longitude ?? undefined,
    checkinRadiusM: v.checkinRadiusM ?? undefined,
    active: v.active,
    escalationThreshold: v.escalationThreshold ?? undefined,
    escalationResetMonths: v.escalationResetMonths ?? undefined,
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
  const allUnits = useOrgUnits({ page: 0, size: 200 })
  const { control, handleSubmit, reset, setError, setValue, formState } = useForm<OrgUnitFormValues>({
    resolver: zodResolver(orgUnitSchema),
    defaultValues: EMPTY,
  })
  const unitType = useWatch({ control, name: 'unitType' })
  const isRestaurant = (fixedUnitType ?? unitType) === 'RESTAURANT'
  const prefix = isRestaurant ? 'NH' : 'PB'

  const existingCodes = useMemo(() => (allUnits.data?.items ?? []).map((u) => u.code), [allUnits.data])
  const defaultCode = useMemo(() => nextSequentialCode(prefix, existingCodes, 2, '-'), [prefix, existingCodes])

  useEffect(() => {
    if (open) {
      reset(
        unit
          ? toFormValues(unit)
          : { ...EMPTY, unitType: fixedUnitType ?? 'RESTAURANT', code: defaultCode },
      )
    }
  }, [open, unit, fixedUnitType, defaultCode, reset])

  const watchedName = useWatch({ control, name: 'name' })
  useEffect(() => {
    if (!open || unit || formState.dirtyFields.code) return
    const trimmed = (watchedName ?? '').trim()
    const generated = trimmed ? uniqueAcronymCode(trimmed, existingCodes, prefix, prefix) : defaultCode
    setValue('code', generated, { shouldValidate: false })
  }, [open, unit, watchedName, existingCodes, prefix, defaultCode, formState.dirtyFields.code, setValue])

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
        <Row gutter={16}>
          {!fixedUnitType && (
            <Col xs={24} md={12}>
              <FormSelect<OrgUnitFormValues, OrgUnitType>
                control={control}
                name="unitType"
                label="Loại đơn vị"
                required
                options={TYPE_OPTIONS}
              />
            </Col>
          )}
          <Col xs={24} md={fixedUnitType ? 12 : 12}>
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
          <Col xs={24} md={fixedUnitType ? 12 : 8}>
            <FormInput
              control={control}
              name="code"
              label={isRestaurant ? 'Mã nhà hàng (Tự sinh)' : 'Mã phòng ban (Tự sinh)'}
              required
              maxLength={30}
              placeholder="Tự động sinh"
            />
          </Col>
          <Col xs={24} md={fixedUnitType ? 24 : 16}>
            <FormInput
              control={control}
              name="name"
              label={isRestaurant ? 'Tên nhà hàng' : 'Tên phòng ban'}
              required
              autoFocus={!unit}
              maxLength={200}
              placeholder={isRestaurant ? 'VD: Nhà hàng Chi nhánh Quận 1' : 'VD: Phòng KSVH'}
            />
          </Col>
          <Col span={24}>
            <FormInput
              control={control}
              name="address"
              label={isRestaurant ? 'Địa chỉ' : 'Địa chỉ / Vị trí'}
              maxLength={500}
              placeholder={isRestaurant ? 'VD: 123 Nguyễn Huệ, P. Bến Nghé, Q.1' : 'VD: Tầng 4, Toà nhà Lotus'}
            />
          </Col>
        </Row>

        {isRestaurant && <RestaurantFormSection control={control} setValue={setValue} unit={unit} />}

        <FormSwitch control={control} name="active" label="Đang hoạt động" />
      </Form>
    </Modal>
  )
}
