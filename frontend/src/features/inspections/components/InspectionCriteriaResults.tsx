import { Image, Space, Table, Tag } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import { useMemo, useState } from 'react'
import { ViewTabs } from '@/components/layout/ViewTabs'
import { ITEM_RESULT_META } from '@/features/inspections/constants/status'
import type { InspectionItemResponse, ItemResult } from '@/features/inspections/inspection.types'
import { isVideoUrl, parseMediaUrls, toMediaUrl } from '@/utils/media-url'

const FILTERS: { key: 'ALL' | ItemResult; label: string }[] = [
  { key: 'ALL', label: 'Tất cả' },
  { key: 'FAIL', label: 'Không đạt' },
  { key: 'PASS', label: 'Đạt' },
  { key: 'NA', label: 'Không áp dụng' },
]

const columns: ColumnsType<InspectionItemResponse & { order: number }> = [
  { title: '#', dataIndex: 'order', key: 'order', width: 50 },
  { title: 'Nhóm', dataIndex: 'groupName', key: 'groupName', width: 170 },
  {
    title: 'Tiêu chí',
    key: 'criterion',
    render: (_, r) => {
      const photos = parseMediaUrls(r.evidenceUrls)
      return (
        <div>
          <div style={{ fontWeight: 600 }}>{r.criterionName}</div>
          <div style={{ fontSize: 12, color: 'var(--app-text-secondary)', marginTop: 2, display: 'flex', alignItems: 'center', gap: 6 }}>
            <span className="code-tag--blue">{r.criterionCode}</span> · Mức ảnh hưởng {r.baseImpact}
          </div>
          {r.comment && <div style={{ fontSize: 13, marginTop: 4 }}>Ghi chú: {r.comment}</div>}
          {photos.length > 0 && (
            <Space size={6} wrap style={{ marginTop: 6 }}>
              {photos.map((url, i) =>
                isVideoUrl(url) ? (
                  <video key={i} src={toMediaUrl(url)} controls style={{ width: 90, height: 48, objectFit: 'cover', borderRadius: 6 }} />
                ) : (
                  <Image key={i} src={toMediaUrl(url)} alt={`Bằng chứng #${i + 1}`} loading="lazy" width={48} height={48} style={{ objectFit: 'cover', borderRadius: 6 }} />
                ),
              )}
            </Space>
          )}
        </div>
      )
    },
  },
  {
    title: 'Kết quả',
    dataIndex: 'result',
    key: 'result',
    width: 170,
    render: (res: ItemResult, r) =>
      r.findingStatus === 'DISMISSED' ? (
        <Space direction="vertical" size={2}>
          <Tag color="error">Không đạt</Tag>
          <Tag color="cyan" style={{ fontSize: 11 }}>Đã huỷ lỗi theo kết luận khiếu nại</Tag>
        </Space>
      ) : (
        <Tag color={ITEM_RESULT_META[res]?.color}>{ITEM_RESULT_META[res]?.label}</Tag>
      ),
  },
]

/** Kết quả chấm từng tiêu chí, lọc nhanh theo Đạt / Không đạt / Không áp dụng. */
export function InspectionCriteriaResults({ items, loading }: { items: InspectionItemResponse[]; loading?: boolean }) {
  const [filter, setFilter] = useState<'ALL' | ItemResult>('ALL')
  const rows = useMemo(() => items.map((it, i) => ({ ...it, order: i + 1 })), [items])
  const shown = filter === 'ALL' ? rows : rows.filter((r) => r.result === filter)
  return (
    <div className="detail-section" style={{ padding: '16px 18px' }}>
      <div style={{ marginBottom: 12 }}>
        <ViewTabs
          activeKey={filter}
          onChange={(k) => setFilter(k as 'ALL' | ItemResult)}
          items={FILTERS.map((f) => ({
            key: f.key,
            label: f.label,
            count: f.key === 'ALL' ? rows.length : rows.filter((r) => r.result === f.key).length,
          }))}
        />
      </div>
      <Table columns={columns} dataSource={shown} rowKey="id" loading={loading} pagination={false} size="small" />
    </div>
  )
}
