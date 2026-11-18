import {
  BarChartOutlined,
  CalendarOutlined,
  CheckCircleOutlined,
  TeamOutlined,
  TrophyOutlined,
} from '@ant-design/icons'
import { Tabs, Tooltip } from 'antd'
import { useState } from 'react'
import { PageContainer } from '@/components/layout/PageContainer'
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
      label: (
        <span>
          <CalendarOutlined /> Tổng hợp tháng
        </span>
      ),
      children: <MonthlySummaryTab />,
    },
    {
      key: 'ranking',
      label: (
        <span>
          <TrophyOutlined /> Xếp hạng nhà hàng
        </span>
      ),
      children: <RestaurantRankingTab />,
    },
    {
      key: 'pareto',
      label: (
        <Tooltip title="Lỗi theo tiêu chí (Phân tích Pareto 80/20)">
          <span>
            <BarChartOutlined /> Tiêu chí (Pareto)
          </span>
        </Tooltip>
      ),
      children: <CriteriaViolationTab />,
    },
    {
      key: 'remediation',
      label: (
        <span>
          <CheckCircleOutlined /> Tiến độ khắc phục
        </span>
      ),
      children: <RemediationStatusTab />,
    },
    {
      key: 'productivity',
      label: (
        <span>
          <TeamOutlined /> Năng suất chuyên viên
        </span>
      ),
      children: <InspectorProductivityTab />,
    },
  ]

  return (
    <PageContainer
      title="Báo cáo & Thống kê kiểm soát"
      subtitle="Tổng hợp số liệu điều hành, đánh giá tuân thủ và xuất báo cáo nghiệp vụ cho Phòng KSVH"
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
