import { Col, Row } from 'antd'
import { StatisticCard } from '@/components/data-display/StatisticCard'
import { PageContainer } from '@/components/layout/PageContainer'

const STATS = ['Lượt chấm hôm nay', 'Điểm trung bình', 'Lỗi cần xử lý', 'Điểm chấm'] as const

/** Tổng quan. Số liệu thật lấy từ module report sau khi chốt nghiệp vụ. */
export function DashboardPage() {
  return (
    <PageContainer title="Tổng quan" subtitle="Số liệu sẽ có khi hoàn thành module chấm điểm">
      <Row gutter={[16, 16]}>
        {STATS.map((title) => (
          <Col xs={24} sm={12} xl={6} key={title}>
            <StatisticCard title={title} value={null} />
          </Col>
        ))}
      </Row>
    </PageContainer>
  )
}
