import { AlertOutlined, ThunderboltOutlined } from '@ant-design/icons'
import { Alert, Empty, Flex, Modal, Spin, Table, Tag, Typography } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import { useSurpriseSuggestions } from '@/features/inspections/hooks/useVerificationAndSurprise'
import type { SurpriseInspectionSuggestion } from '@/features/inspections/inspection.types'
import { ActionButton } from '@/components/data-display/TableActions'

interface Props {
  open: boolean
  onClose: () => void
  onCreateSurprise: (suggestion: SurpriseInspectionSuggestion) => void
}

const RISK_COLOR: Record<string, string> = {
  M4: 'red',
  M3: 'orange',
  M2: 'gold',
  M1: 'green',
}

export function SurpriseSuggestionsModal({ open, onClose, onCreateSurprise }: Props) {
  const { data: suggestions, isLoading } = useSurpriseSuggestions()

  const columns: ColumnsType<SurpriseInspectionSuggestion> = [
    {
      title: 'Nhà hàng',
      key: 'restaurant',
      width: 200,
      render: (_, r) => (
        <div>
          <Typography.Text strong>{r.restaurantCode}</Typography.Text> - {r.restaurantName}
          {r.companyName && (
            <div style={{ fontSize: 12, color: 'var(--app-text-secondary)' }}>{r.companyName}</div>
          )}
        </div>
      ),
    },
    {
      title: 'Mức rủi ro',
      key: 'risk',
      width: 140,
      render: (_, r) => (
        <div>
          <Tag color={RISK_COLOR[r.highestRiskLevel] ?? 'default'}>Mức {r.highestRiskLevel}</Tag>
          <div style={{ fontSize: 12, marginTop: 2, color: 'var(--app-text-secondary)' }}>
            Điểm rủi ro: <strong>{r.totalRiskScore}</strong>
          </div>
        </div>
      ),
    },
    {
      title: 'Lý do đề xuất',
      key: 'reason',
      render: (_, r) => (
        <div>
          <div style={{ fontWeight: 500, color: r.m4Count > 0 ? 'var(--app-danger)' : 'inherit' }}>
            {r.primaryReason}
          </div>
          {r.suggestedTopicGroupNames.length > 0 && (
            <div style={{ marginTop: 4 }}>
              <Typography.Text type="secondary" style={{ fontSize: 12, marginRight: 4 }}>
                Chuyên đề gợi ý:
              </Typography.Text>
              {r.suggestedTopicGroupNames.map((name) => (
                <Tag key={name} style={{ margin: '2px 4px 2px 0' }}>{name}</Tag>
              ))}
            </div>
          )}
        </div>
      ),
    },
    {
      title: 'Thao tác',
      key: 'action',
      width: 160,
      align: 'center',
      render: (_, r) => (
        <ActionButton
          tone="add"
          icon={<ThunderboltOutlined />}
          tooltip="Tạo phiếu đột xuất"
          onClick={() => {
            onCreateSurprise(r)
            onClose()
          }}
        />
      ),
    },
  ]

  return (
    <Modal
      title={
        <Flex align="center" gap={8}>
          <AlertOutlined style={{ color: 'var(--app-warning)' }} />
          <span>Gợi ý kiểm tra đột xuất ({suggestions?.length ?? 0} nhà hàng)</span>
        </Flex>
      }
      open={open}
      onCancel={onClose}
      footer={null}
      width={850}
    >
      <Alert
        type="info"
        showIcon
        title="Hệ thống tự động phân tích các nhà hàng có lỗi M3/M4 chưa khắc phục, điểm rủi ro tăng cao hoặc tiêu chí bị nâng mức để đề xuất kiểm tra đột xuất theo chuyên đề."
        style={{ marginBottom: 16 }}
      />

      {isLoading ? (
        <Flex justify="center" style={{ padding: 32 }}>
          <Spin tip="Đang phân tích điểm rủi ro và lỗi mở..." />
        </Flex>
      ) : !suggestions || suggestions.length === 0 ? (
        <Empty
          image={Empty.PRESENTED_IMAGE_SIMPLE}
          description="Hiện không có nhà hàng nào có nguy cơ rủi ro cao cần kiểm tra đột xuất"
          style={{ padding: 24 }}
        />
      ) : (
        <Table<SurpriseInspectionSuggestion>
          rowKey="restaurantId"
          columns={columns}
          dataSource={suggestions}
          pagination={{ pageSize: 5 }}
          size="middle"
        />
      )}
    </Modal>
  )
}
