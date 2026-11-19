import { ArrowRightOutlined, CalendarOutlined, ExclamationCircleOutlined } from '@ant-design/icons'
import { Badge, Button, Card, Col, Empty, Flex, Row, Space, Tag, Typography } from 'antd'
import { useNavigate } from 'react-router'
import { RiskLevelTag } from '@/components/data-display/RiskLevelTag'
import { useApprovalQueue } from '@/features/dashboard/hooks/useDashboard'
import { PERMISSIONS, usePermission } from '@/permissions'
import { formatDate } from '@/utils/format-date'

export function ApprovalQueueSection() {
  const navigate = useNavigate()
  const { can, canAny } = usePermission()
  const canApprovePlan = can(PERMISSIONS.PLAN.APPROVE)
  const canConcludeAppeal = can(PERMISSIONS.FINDING.CONCLUDE_APPEAL)
  const isManager = canAny([PERMISSIONS.PLAN.APPROVE, PERMISSIONS.FINDING.CONCLUDE_APPEAL])

  const { data, isLoading } = useApprovalQueue(isManager)

  if (!isManager) return null

  const pendingPlans = data?.pendingPlans ?? []
  const appealMeetings = data?.appealMeetings ?? []
  const totalWaiting = pendingPlans.length + appealMeetings.length

  if (!isLoading && totalWaiting === 0) {
    return (
      <Card
        size="small"
        style={{
          background: 'var(--app-surface)',
          borderColor: 'var(--app-border)',
          borderRadius: 8,
        }}
      >
        <Flex align="center" justify="space-between">
          <Space>
            <Tag color="success">✓ Không có công việc chờ duyệt</Tag>
            <Typography.Text type="secondary" style={{ fontSize: 13 }}>
              Tất cả kế hoạch kiểm tra và khiếu nại đã được xử lý xong.
            </Typography.Text>
          </Space>
          <Button type="link" size="small" onClick={() => navigate('/admin/plans')}>
            Xem danh sách kế hoạch
          </Button>
        </Flex>
      </Card>
    )
  }

  return (
    <Row gutter={[16, 16]}>
      {canApprovePlan && (
        <Col xs={24} lg={12}>
          <Card
            title={
              <Flex align="center" justify="space-between">
                <Space>
                  <CalendarOutlined style={{ color: 'var(--app-primary)' }} />
                  <span>Kế hoạch chờ duyệt</span>
                </Space>
                <Badge count={pendingPlans.length} overflowCount={99} color="#1677ff" />
              </Flex>
            }
            size="small"
            loading={isLoading}
            extra={
              <Button type="link" size="small" onClick={() => navigate('/admin/plans')}>
                Tất cả <ArrowRightOutlined />
              </Button>
            }
          >
            {pendingPlans.length === 0 ? (
              <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="Không có kế hoạch chờ duyệt" />
            ) : (
              <Flex vertical gap={8}>
                {pendingPlans.slice(0, 3).map((p) => (
                  <Flex
                    key={p.id}
                    justify="space-between"
                    align="center"
                    style={{
                      padding: '8px 12px',
                      background: 'var(--app-surface-sunken)',
                      borderRadius: 6,
                    }}
                  >
                    <div>
                      <Typography.Text strong style={{ fontSize: 13 }}>
                        {p.planCode} - {p.title}
                      </Typography.Text>
                      <div style={{ fontSize: 12, color: 'var(--app-text-secondary)' }}>
                        {formatDate(p.startDate)} → {formatDate(p.endDate)} · {p.restaurantCount} nhà hàng
                      </div>
                    </div>
                    <Button size="small" type="primary" ghost onClick={() => navigate('/admin/plans')}>
                      Duyệt
                    </Button>
                  </Flex>
                ))}
              </Flex>
            )}
          </Card>
        </Col>
      )}

      {canConcludeAppeal && (
        <Col xs={24} lg={12}>
          <Card
            title={
              <Flex align="center" justify="space-between">
                <Space>
                  <ExclamationCircleOutlined style={{ color: '#faad14' }} />
                  <span>Họp kết luận khiếu nại</span>
                </Space>
                <Badge count={appealMeetings.length} overflowCount={99} color="#faad14" />
              </Flex>
            }
            size="small"
            loading={isLoading}
            extra={
              <Button
                type="link"
                size="small"
                onClick={() => navigate('/admin/findings?status=APPEAL_MEETING')}
              >
                Tất cả <ArrowRightOutlined />
              </Button>
            }
          >
            {appealMeetings.length === 0 ? (
              <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="Không có khiếu nại cần họp chốt" />
            ) : (
              <Flex vertical gap={8}>
                {appealMeetings.slice(0, 3).map((f) => (
                  <Flex
                    key={f.id}
                    justify="space-between"
                    align="center"
                    style={{
                      padding: '8px 12px',
                      background: 'var(--app-surface-sunken)',
                      borderRadius: 6,
                    }}
                  >
                    <div style={{ maxWidth: '75%' }}>
                      <Flex align="center" orientation="horizontal" gap={6}>
                        <RiskLevelTag code={f.riskLevelCode} />
                        <Typography.Text strong style={{ fontSize: 13 }}>
                          #{f.id} · {f.restaurantName}
                        </Typography.Text>
                      </Flex>
                      <Typography.Paragraph
                        ellipsis={{ rows: 1 }}
                        style={{ margin: '2px 0 0', fontSize: 12, color: 'var(--app-text-secondary)' }}
                      >
                        {f.appealReason || 'Chờ kết luận sau họp'}
                      </Typography.Paragraph>
                    </div>
                    <Button
                      size="small"
                      type="primary"
                      ghost
                      onClick={() => navigate('/admin/findings?status=APPEAL_MEETING')}
                    >
                      Kết luận
                    </Button>
                  </Flex>
                ))}
              </Flex>
            )}
          </Card>
        </Col>
      )}
    </Row>
  )
}
