import { ApartmentOutlined, ShopOutlined } from '@ant-design/icons'
import { zodResolver } from '@hookform/resolvers/zod'
import { Button, Col, Form, Row } from 'antd'
import { useEffect, useMemo, useRef } from 'react'
import { useForm, useWatch } from 'react-hook-form'
import { FormInput } from '@/components/data-entry/FormInput'
import { FormSelect } from '@/components/data-entry/FormSelect'
import { FormSwitch } from '@/components/data-entry/FormSwitch'
import { DetailDrawer } from '@/components/feedback/detail'
import { useNotify } from '@/components/feedback/useNotify'
import { EMPTY_ORG_UNIT, toOrgUnitFormValues, toOrgUnitPayload } from '@/features/organizations/components/orgUnitForm.mapper'
import { OrgUnitTypePicker } from '@/features/organizations/components/OrgUnitTypePicker'
import { RestaurantFormSection } from '@/features/organizations/components/RestaurantFormSection'
import { useCompanies, useOrgUnits, useSaveOrgUnit } from '@/features/organizations/hooks/useOrganizations'
import type { OrgUnit, OrgUnitType } from '@/features/organizations/organizations.types'
import { orgUnitSchema, type OrgUnitFormValues } from '@/features/organizations/schemas/organization.schema'
import { applyFieldErrors, getErrorMessage } from '@/lib/http'
import { nextSequentialCode, uniqueAcronymCode } from '@/utils/auto-code'

const COMPANY_OPTIONS_SIZE = 100

export interface OrgUnitFormModalProps {
  open: boolean
  unit?: OrgUnit
  fixedUnitType?: OrgUnitType
  onClose: () => void
}

/** Thêm / sửa đơn vị (nhà hàng, phòng ban) trong drawer dùng chung toàn hệ thống. */
export function OrgUnitFormModal({ open, unit, fixedUnitType, onClose }: OrgUnitFormModalProps) {
  const notify = useNotify()
  const save = useSaveOrgUnit()
  const companies = useCompanies({ page: 0, size: COMPANY_OPTIONS_SIZE, active: true })
  const allUnits = useOrgUnits({ page: 0, size: 200 })
  const { control, handleSubmit, reset, setError, setValue, getValues } = useForm<OrgUnitFormValues>({
    resolver: zodResolver(orgUnitSchema),
    defaultValues: EMPTY_ORG_UNIT,
  })
  const unitType = useWatch({ control, name: 'unitType' }) ?? 'RESTAURANT'
  const isRestaurant = unitType === 'RESTAURANT'
  const prefix = isRestaurant ? 'NH' : 'PB'

  const existingCodes = useMemo(() => (allUnits.data?.items ?? []).map((u) => u.code), [allUnits.data])
  /** Mã tự sinh gần nhất – để phân biệt với mã người dùng gõ tay. */
  const lastAutoCode = useRef<string | undefined>(undefined)
  const defaultCode = useMemo(() => nextSequentialCode(prefix, existingCodes, 2, '-'), [prefix, existingCodes])

  useEffect(() => {
    if (open) {
      const initialType = unit ? unit.unitType : (fixedUnitType ?? 'RESTAURANT')
      const initPrefix = initialType === 'RESTAURANT' ? 'NH' : 'PB'
      const initCode = nextSequentialCode(initPrefix, existingCodes, 2, '-')
      reset(
        unit
          ? toOrgUnitFormValues(unit)
          : { ...EMPTY_ORG_UNIT, unitType: initialType, code: initCode },
      )
      lastAutoCode.current = unit ? undefined : initCode
    }
  }, [open, unit, fixedUnitType, existingCodes, reset])

  const watchedName = useWatch({ control, name: 'name' })
  useEffect(() => {
    if (!open || unit) return
    // Người dùng đã gõ tay mã (khác mã tự sinh lần trước) → giữ nguyên. Không dựa vào dirtyFields:
    // đổi Nhà hàng ↔ Phòng ban làm mã tự sinh khác mặc định nên bị coi là "đã sửa" và kẹt ở PB-…
    if (lastAutoCode.current !== undefined && getValues('code') !== lastAutoCode.current) return
    const trimmed = (watchedName ?? '').trim()
    const generated = trimmed ? uniqueAcronymCode(trimmed, existingCodes, prefix, prefix) : defaultCode
    lastAutoCode.current = generated
    setValue('code', generated, { shouldValidate: false })
  }, [open, unit, watchedName, existingCodes, prefix, defaultCode, getValues, setValue])

  // Công ty đã ngưng hoạt động không nằm trong danh sách chọn nhưng vẫn phải hiện tên khi sửa đơn vị cũ.
  const companyOptions = useMemo(() => {
    const list = (companies.data?.items ?? []).map((c) => ({ value: c.id, label: `${c.code} – ${c.name}` }))
    if (unit && !list.some((o) => o.value === unit.companyId)) {
      list.unshift({ value: unit.companyId, label: `${unit.companyCode} – ${unit.companyName}` })
    }
    return list
  }, [companies.data, unit])

  const itemLabel = isRestaurant ? 'nhà hàng' : 'phòng ban'

  const onSubmit = handleSubmit((values) =>
    save.mutate(
      { id: unit?.id, body: toOrgUnitPayload(values) },
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
    <DetailDrawer
      open={open}
      onClose={onClose}
      fit
      maskClosable={false}
      closeText="Huỷ"
      icon={isRestaurant ? <ShopOutlined /> : <ApartmentOutlined />}
      title={unit ? `Chỉnh sửa ${itemLabel}` : 'Thêm đơn vị & cơ sở vận hành'}
      subtitle={unit ? `Cập nhật thông tin ${unit.code} – ${unit.name}` : 'Chọn phân loại Nhà hàng hoặc Phòng ban và điền thông tin quản lý'}
      actions={
        <Button type="primary" loading={save.isPending} onClick={() => void onSubmit()}>
          {unit ? 'Lưu thay đổi' : isRestaurant ? 'Tạo nhà hàng' : 'Tạo phòng ban'}
        </Button>
      }
    >
      <Form layout="vertical" onFinish={() => void onSubmit()} className="org-unit-form">
        <button type="submit" hidden />

        {/* Bước 1: Chọn phân loại đơn vị (Nhà hàng vs Phòng ban) */}
        <div style={{ marginBottom: 16 }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: '#334155', marginBottom: 8 }}>
            Phân loại đơn vị <span style={{ color: '#ef4444' }}>*</span>
          </div>
          <OrgUnitTypePicker
            value={unitType}
            onChange={(v) => setValue('unitType', v, { shouldDirty: true, shouldValidate: true })}
          />
        </div>

        {/* Bước 2: Thông tin định danh cơ bản */}
        <div
          style={{
            padding: '14px 16px 4px',
            borderRadius: 12,
            border: '1px solid #e2e8f0',
            background: '#ffffff',
            marginBottom: 14,
          }}
        >
          <Row gutter={12}>
            <Col xs={24} sm={15}>
              <FormSelect<OrgUnitFormValues, number>
                control={control}
                name="companyId"
                label="Công ty trực thuộc"
                required
                showSearch={{ optionFilterProp: 'label' }}
                placeholder="Chọn công ty quản lý"
                loading={companies.isFetching}
                options={companyOptions}
              />
            </Col>
            <Col xs={24} sm={9}>
              <FormInput
                control={control}
                name="code"
                label={isRestaurant ? 'Mã nhà hàng (Tự sinh)' : 'Mã phòng ban (Tự sinh)'}
                required
                maxLength={30}
                placeholder="Tự động sinh theo tên"
              />
            </Col>
            <Col xs={24} sm={15}>
              <FormInput
                control={control}
                name="name"
                label={isRestaurant ? 'Tên nhà hàng / Cơ sở vận hành' : 'Tên phòng ban / Bộ phận'}
                required
                autoFocus={!unit}
                maxLength={200}
                placeholder={isRestaurant ? 'VD: Marukame Udon Bến Thành' : 'VD: Phòng Đảm bảo Chất lượng & KSVH'}
              />
            </Col>
            <Col xs={24} sm={9}>
              <FormSwitch
                control={control}
                name="active"
                label="Trạng thái vận hành"
                checkedChildren="Đang hoạt động"
                unCheckedChildren="Tạm ngưng"
              />
            </Col>
            <Col span={24}>
              <FormInput
                control={control}
                name="address"
                label={isRestaurant ? 'Địa chỉ kinh doanh' : 'Địa chỉ / Vị trí văn phòng'}
                maxLength={500}
                placeholder={
                  isRestaurant
                    ? 'VD: 215-217 Lý Tự Trọng, Phường Bến Thành, Quận 1, TP.HCM'
                    : 'VD: Tầng 5, Tòa nhà V-Lotus Holdings, 9-9A Nơ Trang Long, Bình Thạnh'
                }
              />
            </Col>
          </Row>
        </div>

        {/* Bước 3: Cấu hình chuyên biệt cho Nhà hàng (GPS + Ngưỡng nâng mức) */}
        {isRestaurant && <RestaurantFormSection control={control} setValue={setValue} unit={unit} />}
      </Form>
    </DetailDrawer>
  )
}
