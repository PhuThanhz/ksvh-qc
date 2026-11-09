import { Card, Col, Row, Statistic, Typography } from 'antd'

/** Trang tổng quan. Số liệu thật sẽ lấy từ module report sau khi chốt nghiệp vụ. */
export function DashboardPage() {
  return (
    <>
      <Typography.Title level={3} style={{ marginTop: 0 }}>
        Tổng quan
      </Typography.Title>
      <Row gutter={[16, 16]}>
        {['Lượt chấm hôm nay', 'Điểm trung bình', 'Lỗi cần xử lý', 'Điểm chấm'].map((t) => (
          <Col xs={24} sm={12} lg={6} key={t}>
            <Card>
              <Statistic title={t} value="—" />
            </Card>
          </Col>
        ))}
      </Row>
    </>
  )
}
