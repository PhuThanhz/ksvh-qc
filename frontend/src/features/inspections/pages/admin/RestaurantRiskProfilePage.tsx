import { FireOutlined, ShopOutlined } from '@ant-design/icons'
import { Flex } from 'antd'
import { useState } from 'react'
import { useSearchParams } from 'react-router'
import { PageContainer } from '@/components/layout/PageContainer'
import { ViewTabs } from '@/components/layout/ViewTabs'
import { RestaurantRiskProfileTab } from '@/features/inspections/components/risk-profile/RestaurantRiskProfileTab'
import { SystemEscalatedCriteriaTab } from '@/features/inspections/components/risk-profile/SystemEscalatedCriteriaTab'
import { useEscalatedCriteria } from '@/features/inspections/hooks/useRiskProfile'

export function RestaurantRiskProfilePage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const initialRestId = searchParams.get('restaurantId') ? Number(searchParams.get('restaurantId')) : undefined

  const [activeTab, setActiveTab] = useState<string>('profile')
  const [selectedRestId, setSelectedRestId] = useState<number | undefined>(initialRestId)
  const escalatedCount = useEscalatedCriteria().data?.length

  const handleSelectRestaurant = (id: number) => {
    setSelectedRestId(id)
    setSearchParams({ restaurantId: String(id) })
    setActiveTab('profile')
  }

  return (
    <PageContainer
      title="Hồ sơ rủi ro cơ sở"
      subtitle="Theo dõi diễn biến rủi ro, tần suất vi phạm lũy tiến và chu kỳ hoàn nguyên mức độ ảnh hưởng theo cơ sở"
    >
      <Flex vertical gap={16}>
        <ViewTabs
          activeKey={activeTab}
          onChange={setActiveTab}
          items={[
            {
              key: 'profile',
              label: 'Hồ sơ rủi ro nhà hàng',
              icon: <ShopOutlined />,
            },
            {
              key: 'system',
              label: 'Điểm nóng nâng mức toàn hệ thống',
              icon: <FireOutlined />,
              count: escalatedCount,
            },
          ]}
        />
        {activeTab === 'profile' ? (
          <RestaurantRiskProfileTab initialRestaurantId={selectedRestId} />
        ) : (
          <SystemEscalatedCriteriaTab onSelectRestaurant={handleSelectRestaurant} />
        )}
      </Flex>
    </PageContainer>
  )
}
