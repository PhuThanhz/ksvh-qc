import { CalculatorOutlined } from '@ant-design/icons'
import { Card, Col, Flex, InputNumber, Row, Select, Skeleton, Typography } from 'antd'
import dayjs from 'dayjs'
import type { ReactNode } from 'react'
import { useState } from 'react'
import { SeverityTag } from '@/components/data-display/SeverityTag'
import { useRiskLevels, useRiskPreview } from '@/features/criteria/hooks/useRiskConfig'

const IMPACTS = [
  { value: 1, label: 'Mức 1 – Rất nhẹ' },
  { value: 2, label: 'Mức 2 – Nhẹ' },
  { value: 3, label: 'Mức 3 – Trung bình' },
  { value: 4, label: 'Mức 4 – Nặng' },
  { value: 5, label: 'Mức 5 – Rất nghiêm trọng' },
]

function Step({ n, label, children }: { n: number; label: string; children: ReactNode }) {
  return (
    <Flex gap={12} align="flex-start" style={{ padding: '10px 0', borderTop: n > 1 ? '1px solid #f0efec' : undefined }}>
      <span style={{ width: 22, height: 22, borderRadius: 999, background: '#f2f1ee', color: '#52514e', fontSize: 12,
        fontWeight: 600, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>{n}</span>
      <div style={{ flex: 1 }}>
        <Typography.Text type="secondary" style={{ fontSize: 12, display: 'block' }}>{label}</Typography.Text>
        <div style={{ fontSize: 14, marginTop: 2 }}>{children}</div>
      </div>
    </Flex>
  )
}

/**
 * Mô phỏng điểm rủi ro cho một lần lỗi. Kết quả do backend tính (cùng bộ tính dùng khi chấm),
 * theo cấu hình tần suất, nâng mức và bảng phân loại đang hiệu lực hôm nay.
 */
export function RiskSimulatorCard() {
  const [baseImpact, setBaseImpact] = useState(2)
  const [violations, setViolations] = useState(3)
  const preview = useRiskPreview(baseImpact, violations)
  const levels = useRiskLevels()
  const r = preview.data
  const levelIndex = (levels.data ?? []).findIndex((l) => l.code === r?.levelCode)

  return (
    <Card
      title={<Flex align="center" gap={8}><CalculatorOutlined /> Mô phỏng điểm rủi ro</Flex>}
      extra={<Typography.Text type="secondary" style={{ fontSize: 12 }}>Theo cấu hình hiệu lực hôm nay</Typography.Text>}
    >
      <Row gutter={[24, 16]}>
        <Col xs={24} md={9}>
          <Flex vertical gap={12}>
            <div>
              <Typography.Text type="secondary" style={{ fontSize: 12 }}>Mức ảnh hưởng gốc của tiêu chí</Typography.Text>
              <Select value={baseImpact} onChange={setBaseImpact} options={IMPACTS} style={{ width: '100%', marginTop: 4 }} />
            </div>
            <div>
              <Typography.Text type="secondary" style={{ fontSize: 12 }}>
                Số lần lỗi trong kỳ đếm (kể cả lần này)
              </Typography.Text>
              <InputNumber<number> min={1} max={50} precision={0} value={violations} suffix="lần"
                onChange={(v) => setViolations(v ?? 1)} style={{ width: '100%', marginTop: 4 }} />
            </div>
          </Flex>
        </Col>
        <Col xs={24} md={15}>
          {!r ? (
            <Skeleton active paragraph={{ rows: 4 }} title={false} />
          ) : (
            <div style={{ opacity: preview.isFetching ? 0.6 : 1, transition: 'opacity .15s' }}>
              <Step n={1} label={`Tần suất – kỳ ${r.periodMonths} tháng, từ ${dayjs(r.periodStart).format('DD/MM/YYYY')}`}>
                <b>{r.frequency} lần</b>
              </Step>
              <Step n={2} label="Mức ảnh hưởng hiệu lực">
                {r.escalated ? (
                  <>
                    Mức {r.baseImpact} → <b>Mức {r.effectiveImpact}</b>
                    <Typography.Text type="secondary" style={{ fontSize: 12 }}>
                      {` · nâng +${r.stepIncrease} bậc vì ≥ ${r.thresholdCount} lần (trần mức ${r.maxImpact})`}
                    </Typography.Text>
                  </>
                ) : (
                  <>
                    <b>Mức {r.effectiveImpact}</b>
                    <Typography.Text type="secondary" style={{ fontSize: 12 }}>
                      {r.thresholdCount == null ? ' · chưa có quy tắc nâng mức' : ` · giữ mức gốc (ngưỡng nâng ${r.thresholdCount} lần)`}
                    </Typography.Text>
                  </>
                )}
              </Step>
              <Step n={3} label="Điểm rủi ro = mức ảnh hưởng × tần suất">
                {r.effectiveImpact} × {r.frequency} = <b>{r.score} điểm</b>
              </Step>
              <Step n={4} label="Mức rủi ro và hạn khắc phục">
                {r.levelCode ? (
                  <Flex align="center" gap={8} wrap>
                    <SeverityTag code={r.levelCode} name={r.levelName ?? undefined} index={Math.max(levelIndex, 0)} total={levels.data?.length ?? 1} />
                    <span>hạn <b>{r.remediationDays} ngày</b></span>
                  </Flex>
                ) : (
                  <Typography.Text type="danger">Bảng phân loại chưa có khoảng chứa {r.score} điểm</Typography.Text>
                )}
              </Step>
            </div>
          )}
        </Col>
      </Row>
    </Card>
  )
}
