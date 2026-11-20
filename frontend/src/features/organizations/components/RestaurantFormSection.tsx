import { AimOutlined, AlertOutlined, CompassOutlined, EnvironmentOutlined } from '@ant-design/icons'
import { Button, Col, Flex, Row, Typography } from 'antd'
import { useEffect } from 'react'
import type { Control, UseFormSetValue } from 'react-hook-form'
import { FormNumber } from '@/components/data-entry/FormNumber'
import { useNotify } from '@/components/feedback/useNotify'
import { GoogleMapsCoordsInput } from '@/features/organizations/components/GoogleMapsCoordsInput'
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
    <Flex vertical gap={14} style={{ marginTop: 4 }}>
      {/* Khối 1: Định vị GPS & Bán kính Check-in */}
      <div
        style={{
          padding: '14px 16px 4px',
          borderRadius: 12,
          border: '1px solid #e2e8f0',
          background: '#f8fafc',
        }}
      >
        <Flex align="center" justify="space-between" style={{ marginBottom: 12 }}>
          <Flex align="center" gap={8}>
            <span
              style={{
                width: 28,
                height: 28,
                borderRadius: 8,
                background: '#eff6ff',
                color: '#2563eb',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 14,
              }}
            >
              <CompassOutlined />
            </span>
            <div>
              <div style={{ fontSize: 13.5, fontWeight: 700, color: '#0f172a', lineHeight: 1.25 }}>
                Định vị GPS & Bán kính Check-in
              </div>
              <div style={{ fontSize: 12, color: '#64748b' }}>
                Xác thực vị trí thực tế khi chuyên viên KSVH bắt đầu kiểm tra tại cơ sở
              </div>
            </div>
          </Flex>
          {setValue && (
            <Button
              size="small"
              icon={<AimOutlined />}
              loading={status === 'locating'}
              onClick={locate}
              style={{ borderRadius: 8, fontWeight: 600 }}
            >
              Lấy toạ độ hiện tại
            </Button>
          )}
        </Flex>

        {unit && (
          <div
            style={{
              marginBottom: 12,
              padding: '8px 12px',
              borderRadius: 8,
              background: '#ffffff',
              border: '1px dashed #cbd5e1',
              fontSize: 12.5,
              color: '#475569',
            }}
          >
            <EnvironmentOutlined style={{ color: '#2563eb', marginRight: 6 }} />
            Cửa hàng trưởng: <b style={{ color: '#0f172a' }}>{unit.storeManager?.fullName ?? 'Chưa gán'}</b>
            {' · '}
            OBM phụ trách: <b style={{ color: '#0f172a' }}>{unit.obm?.fullName ?? 'Chưa gán'}</b>
            <span style={{ color: '#94a3b8' }}> (phân công tại trang Người dùng)</span>
          </div>
        )}

        {setValue && <GoogleMapsCoordsInput control={control} setValue={setValue} />}

        <Row gutter={12}>
          <Col xs={24} sm={8}>
            <FormNumber
              control={control}
              name="latitude"
              label="Vĩ độ (Latitude)"
              min={-90}
              max={90}
              step={0.000001}
              precision={6}
              placeholder="VD: 10.772400"
            />
          </Col>
          <Col xs={24} sm={8}>
            <FormNumber
              control={control}
              name="longitude"
              label="Kinh độ (Longitude)"
              min={-180}
              max={180}
              step={0.000001}
              precision={6}
              placeholder="VD: 106.696100"
            />
          </Col>
          <Col xs={24} sm={8}>
            <FormNumber
              control={control}
              name="checkinRadiusM"
              label="Bán kính hợp lệ (mét)"
              min={10}
              max={5000}
              step={10}
              precision={0}
              placeholder="Mặc định 100m"
            />
          </Col>
        </Row>
      </div>

      {/* Khối 2: Cấu hình ngưỡng nâng mức rủi ro riêng */}
      <div
        style={{
          padding: '14px 16px 4px',
          borderRadius: 12,
          border: '1px solid #fed7aa',
          background: '#fffaf5',
        }}
      >
        <Flex align="center" gap={8} style={{ marginBottom: 12 }}>
          <span
            style={{
              width: 28,
              height: 28,
              borderRadius: 8,
              background: '#ffedd5',
              color: '#ea580c',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 14,
            }}
          >
            <AlertOutlined />
          </span>
          <div>
            <div style={{ fontSize: 13.5, fontWeight: 700, color: '#0f172a', lineHeight: 1.25 }}>
              Quy tắc nâng mức rủi ro riêng (Tuỳ chọn)
            </div>
            <Typography.Text type="secondary" style={{ fontSize: 12 }}>
              Dành cho cơ sở đặc thù (VD: Fine Dining). Để trống để áp dụng quy tắc chung toàn hệ thống.
            </Typography.Text>
          </div>
        </Flex>

        <Row gutter={12}>
          <Col xs={24} sm={8}>
            <FormNumber
              control={control}
              name="escalationThreshold"
              label="Nâng mức từ lần tái phạm"
              min={2}
              max={50}
              precision={0}
              placeholder="Theo quy tắc chung"
            />
          </Col>
          <Col xs={24} sm={8}>
            <FormNumber
              control={control}
              name="escalationStep"
              label="Số bậc nâng mỗi lần (+)"
              min={1}
              max={4}
              precision={0}
              placeholder="Theo quy tắc chung"
            />
          </Col>
          <Col xs={24} sm={8}>
            <FormNumber
              control={control}
              name="escalationResetMonths"
              label="Chu kỳ hoàn nguyên (tháng)"
              min={1}
              max={24}
              precision={0}
              placeholder="Theo quy tắc chung"
            />
          </Col>
        </Row>
      </div>
    </Flex>
  )
}
