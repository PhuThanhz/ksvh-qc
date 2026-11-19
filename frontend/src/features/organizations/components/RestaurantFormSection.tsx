import { AimOutlined } from '@ant-design/icons'
import { Button, Col, Divider, Flex, Row, Typography } from 'antd'
import { useEffect } from 'react'
import type { Control, UseFormSetValue } from 'react-hook-form'
import { FormNumber } from '@/components/data-entry/FormNumber'
import { FormSelect } from '@/components/data-entry/FormSelect'
import { useNotify } from '@/components/feedback/useNotify'
import { RISK_POLICY_OPTIONS, type OrgUnit } from '@/features/organizations/organizations.types'
import type { OrgUnitFormValues } from '@/features/organizations/schemas/organization.schema'
import { useGeolocation } from '@/hooks/useGeolocation'

export interface RestaurantFormSectionProps {
  control: Control<OrgUnitFormValues>
  setValue?: UseFormSetValue<OrgUnitFormValues>
  unit?: OrgUnit
}

/**
 * Nhóm trường nhập liệu riêng cho đơn vị Nhà hàng (GPS, bán kính – GPS chưa bắt buộc).
 * CHT / OBM không chọn ở đây: gán ở màn Người dùng (chọn nhà hàng phụ trách) hoặc file Excel.
 */
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
          <span>Vị trí & GPS</span>
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
        {unit && (
          <Col span={24} style={{ marginBottom: 12 }}>
            <Typography.Text type="secondary">
              Cửa hàng trưởng: <b>{unit.storeManager?.fullName ?? 'Chưa gán'}</b> · OBM: <b>{unit.obm?.fullName ?? 'Chưa gán'}</b>
              {' '}(đổi ở màn Người dùng)
            </Typography.Text>
          </Col>
        )}
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
        <Col span={24}>
          <FormSelect
            control={control}
            name="riskPolicy"
            label="Chính sách kiểm soát rủi ro"
            options={RISK_POLICY_OPTIONS}
            extra="Áp dụng ngưỡng vi phạm khắt khe hơn (2 lần) đối với các chuỗi Fine Dining như Tenku, Ussina"
          />
        </Col>
      </Row>
    </>
  )
}

