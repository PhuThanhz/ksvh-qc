import { Alert, Empty, Flex, Spin, Table, Tag, Typography } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import { useEffect, useMemo } from 'react'
import { useVerificationCandidates } from '@/features/inspections/hooks/useVerificationAndSurprise'
import type { CandidateFindingResponse } from '@/features/inspections/inspection.types'
import { formatDate } from '@/utils/format-date'

interface Props {
  restaurantId?: number
  value?: number[]
  onChange: (findingIds: number[]) => void
}

const RISK_TAG_COLOR: Record<string, string> = {
  M1: 'green',
  M2: 'gold',
  M3: 'orange',
  M4: 'red',
}

export function VerificationCandidateSelector({ restaurantId, value = [], onChange }: Props) {
  const { data: candidates, isLoading } = useVerificationCandidates(restaurantId)

  // Tự động chọn tất cả lỗi khi tải danh sách lần đầu
  useEffect(() => {
    if (candidates && candidates.length > 0 && value.length === 0) {
      onChange(candidates.map((c) => c.id))
    }
  }, [candidates, onChange, value.length])

  const columns: ColumnsType<CandidateFindingResponse> = useMemo(
    () => [
      {
        title: 'Mã & Tiêu chí',
        key: 'criterion',
        render: (_, r) => (
          <div>
            <Typography.Text strong>{r.criterionCode}</Typography.Text> - {r.criterionName}
            {r.groupName && (
              <div style={{ fontSize: 12, color: 'var(--app-text-secondary)' }}>{r.groupName}</div>
            )}
          </div>
        ),
      },
      {
        title: 'Mức rủi ro',
        dataIndex: 'riskLevelCode',
        key: 'riskLevelCode',
        width: 100,
        render: (code: string) => (
          <Tag color={RISK_TAG_COLOR[code] ?? 'default'}>Mức {code}</Tag>
        ),
      },
      {
        title: 'Phương án khắc phục',
        key: 'remediationPlan',
        render: (_, r) => (
          <div>
            <Typography.Text style={{ fontSize: 13 }}>
              {r.remediationPlan || 'Chưa cập nhật phương án'}
            </Typography.Text>
            {r.remediationEvidenceUrls && (
              <div style={{ fontSize: 12, color: 'var(--app-primary)' }}>Có ảnh bằng chứng khắc phục</div>
            )}
          </div>
        ),
      },
      {
        title: 'Hạn khắc phục',
        dataIndex: 'deadlineDate',
        key: 'deadlineDate',
        width: 120,
        render: (d: string) => formatDate(d),
      },
    ],
    []
  )

  if (!restaurantId) {
    return (
      <Alert
        type="info"
        showIcon
        message="Vui lòng chọn nhà hàng ở trên để hệ thống tự động tải danh sách lỗi chờ nghiệm thu."
        style={{ marginTop: 8 }}
      />
    )
  }

  if (isLoading) {
    return (
      <Flex justify="center" style={{ padding: 24 }}>
        <Spin tip="Đang tải danh sách lỗi cần nghiệm thu..." />
      </Flex>
    )
  }

  if (!candidates || candidates.length === 0) {
    return (
      <Empty
        image={Empty.PRESENTED_IMAGE_SIMPLE}
        description="Nhà hàng này hiện không có lỗi nào đang chờ nghiệm thu kết quả khắc phục"
        style={{ margin: '16px 0' }}
      />
    )
  }

  return (
    <div style={{ marginTop: 8 }}>
      <Flex justify="space-between" align="center" style={{ marginBottom: 8 }}>
        <Typography.Text strong>
          Danh sách lỗi cần nghiệm thu ({value.length}/{candidates.length} lỗi được chọn):
        </Typography.Text>
        <Typography.Link
          onClick={() => {
            if (value.length === candidates.length) {
              onChange([])
            } else {
              onChange(candidates.map((c) => c.id))
            }
          }}
        >
          {value.length === candidates.length ? 'Bỏ chọn tất cả' : 'Chọn tất cả'}
        </Typography.Link>
      </Flex>

      <Table<CandidateFindingResponse>
        rowKey="id"
        size="small"
        columns={columns}
        dataSource={candidates}
        pagination={false}
        rowSelection={{
          selectedRowKeys: value,
          onChange: (keys) => onChange(keys.map(Number)),
        }}
        bordered
      />
    </div>
  )
}
