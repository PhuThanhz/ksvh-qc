import { AimOutlined } from '@ant-design/icons'
import { Button, Col, Divider, Flex, Row } from 'antd'
import { useEffect } from 'react'
import type { Control, UseFormSetValue } from 'react-hook-form'
import { FormField } from '@/components/data-entry/FormField'
import { FormNumber } from '@/components/data-entry/FormNumber'
import { useNotify } from '@/components/feedback/useNotify'
import type { OrgUnit } from '@/features/organizations/organizations.types'
import type { OrgUnitFormValues } from '@/features/organizations/schemas/organization.schema'
import { UserPicker } from '@/features/users'
import { useGeolocation } from '@/hooks/useGeolocation'
import { ROLES } from '@/permissions'

export interface RestaurantFormSectionProps {
  control: Control<OrgUnitFormValues>
  setValue?: UseFormSetValue<OrgUnitFormValues>
  unit?: OrgUnit
}

/** Nhóm trường nhập liệu riêng cho đơn vị Nhà hàng (CHT, OBM, GPS, bán kính – GPS chưa bắt buộc). */
export function RestaurantFormSection({ control, setValue, unit }: RestaurantFormSectionProps) {
  const { status, fix, error, locate } = useGeolocation()
  const notify = useNotify()

  useEffect(() => {
    if (fix && setValue) {
      setValue('latitude', Number(fix.lat.toFixed(6)), { shouldDirty: true, shouldValidate: true })
      setValue('longitude', Number(fix.lng.toFixed(6)), { shouldDirty: true, shouldValidate: true })
      notify.success(`Đã lấy toạ độ: ${fix.lat.toFixed(6)}, ${fix.lng.toFixed(6)} (sai số ±${Math.round(fix.accuracy)}m)`)
    }
  }, [fix, setValue, notify])

  useEffect(() => {
    if (error) notify.error(error)
  }, [error, notify])

  return (
    <>
      <Divider titlePlacement="start">
        <Flex align="center" gap={12}>
          <span>Thông tin vận hành & GPS</span>
          {setValue && (
            <Button
              size="small"
              icon={<AimOutlined />}
              loading={status === 'locating'}
              onClick={locate}
            >
              Lấy GPS hiện tại
            </Button>
          )}
        </Flex>
      </Divider>
      <Row gutter={16}>
        <Col xs={24} md={12}>
          <FormField
            control={control}
            name="storeManagerUserId"
            label="Cửa hàng trưởng"
            render={(field) => (
              <UserPicker
                role={ROLES.STORE_MANAGER}
                value={field.value as number | null}
                onChange={field.onChange}
                current={unit?.storeManager}
                placeholder="Chọn CHT"
              />
            )}
          />
        </Col>
        <Col xs={24} md={12}>
          <FormField
            control={control}
            name="obmUserId"
            label="OBM"
            render={(field) => (
              <UserPicker
                role={ROLES.OBM}
                value={field.value as number | null}
                onChange={field.onChange}
                current={unit?.obm}
                placeholder="Chọn OBM"
              />
            )}
          />
        </Col>
        <Col xs={24} md={8}>
          <FormNumber control={control} name="latitude" label="Vĩ độ" min={-90} max={90} step={0.000001} precision={6} />
        </Col>
        <Col xs={24} md={8}>
          <FormNumber control={control} name="longitude" label="Kinh độ" min={-180} max={180} step={0.000001} precision={6} />
        </Col>
        <Col xs={24} md={8}>
          <FormNumber
            control={control}
            name="checkinRadiusM"
            label="Bán kính check-in (m)"
            min={10}
            max={5000}
            step={10}
            precision={0}
            extra="Không bắt buộc. Hệ thống chỉ ghi nhận vị trí khi bắt đầu kiểm tra, không chặn"
          />
        </Col>
      </Row>
    </>
  )
}

