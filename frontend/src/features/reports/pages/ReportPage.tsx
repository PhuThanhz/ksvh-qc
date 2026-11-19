import {
  BarChartOutlined,
  CalendarOutlined,
  CheckCircleOutlined,
  TeamOutlined,
  TrophyOutlined,
} from '@ant-design/icons'
import { Flex } from 'antd'
import { useState } from 'react'
import { PageContainer } from '@/components/layout/PageContainer'
import { ViewTabs } from '@/components/layout/ViewTabs'
import { CriteriaViolationTab } from '@/features/reports/components/CriteriaViolationTab'
import { InspectorProductivityTab } from '@/features/reports/components/InspectorProductivityTab'
import { MonthlySummaryTab } from '@/features/reports/components/MonthlySummaryTab'
import { RemediationStatusTab } from '@/features/reports/components/RemediationStatusTab'
import { RestaurantRankingTab } from '@/features/reports/components/RestaurantRankingTab'

export function ReportPage() {
  const [activeTab, setActiveTab] = useState('monthly')

  const tabItems = [
    {
      key: 'monthly',
      label: 'Tổng hợp tháng',
      icon: <CalendarOutlined />,
    },
    {
      key: 'ranking',
      label: 'Xếp hạng nhà hàng',
      icon: <TrophyOutlined />,
    },
    {
      key: 'pareto',
      label: 'Tiêu chí (Pareto 80/20)',
      icon: <BarChartOutlined />,
    },
    {
      key: 'remediation',
      label: 'Tiến độ khắc phục',
      icon: <CheckCircleOutlined />,
    },
    {
      key: 'productivity',
      label: 'Năng suất chuyên viên',
      icon: <TeamOutlined />,
    },
  ]

  return (
    <PageContainer
      title="Báo cáo & Phân tích kiểm soát"
      subtitle="Tổng hợp dữ liệu điều hành, đánh giá mức độ tuân thủ và phân tích chất lượng vận hành toàn hệ thống"
    >
      <Flex vertical gap={16}>
        <ViewTabs activeKey={activeTab} onChange={setActiveTab} items={tabItems} />

        {activeTab === 'monthly' && <MonthlySummaryTab />}
        {activeTab === 'ranking' && <RestaurantRankingTab />}
        {activeTab === 'pareto' && <CriteriaViolationTab />}
        {activeTab === 'remediation' && <RemediationStatusTab />}
        {activeTab === 'productivity' && <InspectorProductivityTab />}
      </Flex>
    </PageContainer>
  )
}
