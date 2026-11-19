import { AimOutlined } from '@ant-design/icons'
import { Button, Col, Divider, Flex, Row, Typography } from 'antd'
import { useEffect } from 'react'
import type { Control, UseFormSetValue } from 'react-hook-form'
import { FormNumber } from '@/components/data-entry/FormNumber'
import { useNotify } from '@/components/feedback/useNotify'
import type { OrgUnit } from '@/features/organizations/organizations.types'
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
      </Row>
      <Divider titlePlacement="start" plain style={{ margin: '4px 0 12px' }}>
        Ngưỡng nâng mức riêng
      </Divider>
      <Typography.Paragraph type="secondary" style={{ fontSize: 12.5, marginTop: -4 }}>
        Chỉ nhập khi nhà hàng cần khắt khe hơn quy tắc chung (vd fine dining). Để trống = theo quy tắc chung.
      </Typography.Paragraph>
      <Row gutter={16}>
        <Col xs={24} md={12}>
          <FormNumber
            control={control}
            name="escalationThreshold"
            label="Nâng mức từ lần thứ"
            min={2}
            max={50}
            precision={0}
            placeholder="Theo quy tắc chung"
          />
        </Col>
        <Col xs={24} md={12}>
          <FormNumber
            control={control}
            name="escalationResetMonths"
            label="Hạ mức sau (tháng không lỗi)"
            min={1}
            max={24}
            precision={0}
            placeholder="Theo quy tắc chung"
          />
        </Col>
      </Row>
    </>
  )
}

