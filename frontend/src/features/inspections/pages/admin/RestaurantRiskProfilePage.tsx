import { FireOutlined, ShopOutlined } from '@ant-design/icons'
import { Tabs } from 'antd'
import { useState } from 'react'
import { useSearchParams } from 'react-router'
import { PageContainer } from '@/components/layout/PageContainer'
import { RestaurantRiskProfileTab } from '@/features/inspections/components/risk-profile/RestaurantRiskProfileTab'
import { SystemEscalatedCriteriaTab } from '@/features/inspections/components/risk-profile/SystemEscalatedCriteriaTab'

export function RestaurantRiskProfilePage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const initialRestId = searchParams.get('restaurantId') ? Number(searchParams.get('restaurantId')) : undefined

  const [activeTab, setActiveTab] = useState<string>('profile')
  const [selectedRestId, setSelectedRestId] = useState<number | undefined>(initialRestId)

  const handleSelectRestaurant = (id: number) => {
    setSelectedRestId(id)
    setSearchParams({ restaurantId: String(id) })
    setActiveTab('profile')
  }

  const tabItems = [
    {
      key: 'profile',
      label: (
        <span>
          <ShopOutlined /> Hồ sơ rủi ro nhà hàng
        </span>
      ),
      children: <RestaurantRiskProfileTab initialRestaurantId={selectedRestId} />,
    },
    {
      key: 'system',
      label: (
        <span>
          <FireOutlined /> Điểm nóng nâng mức toàn hệ thống
        </span>
      ),
      children: <SystemEscalatedCriteriaTab onSelectRestaurant={handleSelectRestaurant} />,
    },
  ]

  return (
    <PageContainer
      title="Hồ sơ rủi ro & Hạ mức ảnh hưởng"
      subtitle="Theo dõi mức độ ảnh hưởng hiệu lực, tần suất vi phạm lũy tiến và thời điểm dự kiến hạ mức cho từng nhà hàng"
    >
      <Tabs
        activeKey={activeTab}
        onChange={setActiveTab}
        items={tabItems}
        size="large"
        tabBarStyle={{ marginBottom: 20 }}
      />
    </PageContainer>
  )
}
