import { Flex, Typography } from 'antd'
import { useMemo } from 'react'
import { CHART_COLORS, ChartCard, EChart, tooltipBase } from '@/components/charts'
import { formatNumber, riskColor } from '@/features/dashboard/components/chart-utils'
import type { CountItem, RiskLevelItem } from '@/types/api.generated'

interface Props {
  data?: readonly CountItem[]
  levels?: readonly RiskLevelItem[]
  loading: boolean
}

/** Lỗi đang mở theo mức rủi ro: vành khuyên + chú thích có nhãn, số và hạn khắc phục. */
export function RiskLevelChart({ data, levels, loading }: Props) {
  const rows = useMemo(() => {
    const list = levels ?? []
    return list.map((l, i) => ({
      code: l.code,
      name: l.name,
      days: l.remediationDays,
      color: riskColor(i, list.length),
      count: (data ?? []).find((d) => d.key === l.code)?.count ?? 0,
    }))
  }, [data, levels])
  const total = rows.reduce((s, r) => s + r.count, 0)

  const option = useMemo(
    () => ({
      tooltip: { ...tooltipBase, trigger: 'item', formatter: '{b}: <b>{c}</b> lỗi ({d}%)' },
      series: [
        {
          type: 'pie',
          radius: ['62%', '86%'],
          center: ['50%', '50%'],
          padAngle: 1,
          itemStyle: { borderColor: '#fff', borderWidth: 2, borderRadius: 4 },
          label: {
            show: true,
            position: 'center',
            formatter: () => `{v|${formatNumber(total)}}\n{l|lỗi đang mở}`,
            rich: {
              v: { fontSize: 26, fontWeight: 600, color: CHART_COLORS.text, lineHeight: 32 },
              l: { fontSize: 12, color: CHART_COLORS.textSecondary },
            },
          },
          emphasis: { scale: false },
          data: rows.filter((r) => r.count > 0).map((r) => ({ name: `${r.code} · ${r.name}`, value: r.count, itemStyle: { color: r.color } })),
        },
      ],
    }),
    [rows, total],
  )

  return (
    <ChartCard
      title="Lỗi đang mở theo mức rủi ro"
      subtitle="Theo bảng phân loại đang áp dụng"
      loading={loading}
      empty={total === 0}
      emptyText="Không có lỗi nào đang mở"
      height={280}
    >
      <Flex vertical gap={12}>
        <EChart option={option} height={180} ariaLabel={`Biểu đồ vành khuyên: ${total} lỗi đang mở theo mức rủi ro`} />
        <Flex vertical gap={6}>
          {rows.map((r) => (
            <Flex key={r.code} align="center" gap={8} style={{ fontSize: 13 }}>
              <span style={{ width: 10, height: 10, borderRadius: 3, background: r.color, flexShrink: 0 }} />
              <Typography.Text style={{ flex: 1 }}>
                <b>{r.code}</b> {r.name}
                <Typography.Text type="secondary" style={{ fontSize: 12 }}>{` · hạn ${r.days} ngày`}</Typography.Text>
              </Typography.Text>
              <span style={{ fontVariantNumeric: 'tabular-nums', fontWeight: 600 }}>{formatNumber(r.count)}</span>
            </Flex>
          ))}
        </Flex>
      </Flex>
    </ChartCard>
  )
}
