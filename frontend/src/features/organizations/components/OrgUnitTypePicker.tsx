import { ApartmentOutlined, CheckCircleFilled, ShopOutlined } from '@ant-design/icons'
import { Col, Row } from 'antd'
import type { ReactNode } from 'react'
import type { OrgUnitType } from '@/features/organizations/organizations.types'

const UNIT_TYPE_CARDS: {
  value: OrgUnitType
  title: string
  subtitle: string
  icon: ReactNode
  accent: string
  bgActive: string
}[] = [
  {
    value: 'RESTAURANT',
    title: 'Nhà hàng / Cơ sở vận hành',
    subtitle: 'Cơ sở kinh doanh F&B được kiểm tra định kỳ, đột xuất & định vị GPS',
    icon: <ShopOutlined />,
    accent: '#2563eb',
    bgActive: 'rgba(37, 99, 235, 0.06)',
  },
  {
    value: 'DEPARTMENT',
    title: 'Phòng ban / Khối văn phòng',
    subtitle: 'Phòng ban nghiệp vụ, Bếp trung tâm hoặc Trung tâm điều hành trực thuộc công ty',
    icon: <ApartmentOutlined />,
    accent: '#0891b2',
    bgActive: 'rgba(8, 145, 178, 0.06)',
  },
]

export interface OrgUnitTypePickerProps {
  value: OrgUnitType
  onChange: (value: OrgUnitType) => void
}

/** Hai thẻ chọn phân loại đơn vị: Nhà hàng / Phòng ban. */
export function OrgUnitTypePicker({ value, onChange }: OrgUnitTypePickerProps) {
  const unitType = value
  return (
    <Row gutter={12}>
      {UNIT_TYPE_CARDS.map((card) => {
        const selected = unitType === card.value
        return (
          <Col xs={24} sm={12} key={card.value}>
            <div
              role="button"
              tabIndex={0}
              onClick={() => onChange(card.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault()
                  onChange(card.value)
                }
              }}
              style={{
                position: 'relative',
                padding: '12px 14px',
                borderRadius: 12,
                border: selected ? `2px solid ${card.accent}` : '1px solid #e2e8f0',
                background: selected ? card.bgActive : '#ffffff',
                cursor: 'pointer',
                transition: 'all 0.16s ease',
                display: 'flex',
                alignItems: 'flex-start',
                gap: 12,
              }}
            >
              <span
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: 10,
                  background: selected ? card.accent : '#f1f5f9',
                  color: selected ? '#ffffff' : '#475569',
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 17,
                  flexShrink: 0,
                  transition: 'all 0.16s ease',
                }}
              >
                {card.icon}
              </span>
              <div style={{ flex: 1, minWidth: 0, paddingRight: 16 }}>
                <div
                  style={{
                    fontSize: 13.5,
                    fontWeight: 700,
                    color: selected ? '#0f172a' : '#334155',
                    marginBottom: 2,
                  }}
                >
                  {card.title}
                </div>
                <div style={{ fontSize: 12, color: '#64748b', lineHeight: 1.35 }}>
                  {card.subtitle}
                </div>
              </div>
              {selected && (
                <CheckCircleFilled
                  style={{
                    position: 'absolute',
                    top: 12,
                    right: 12,
                    fontSize: 16,
                    color: card.accent,
                  }}
                />
              )}
            </div>
          </Col>
        )
      })}
    </Row>
  )
}
