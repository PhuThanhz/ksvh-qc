import { PlusOutlined } from '@ant-design/icons'
import { zodResolver } from '@hookform/resolvers/zod'
import { Alert, Button, Card, DatePicker, Flex, Space, Typography } from 'antd'
import dayjs, { type Dayjs } from 'dayjs'
import { useState } from 'react'
import { useFieldArray, useForm, useWatch } from 'react-hook-form'
import { useConfirm } from '@/components/feedback/useConfirm'
import { useNotify } from '@/components/feedback/useNotify'
import { RiskLevelTable } from '@/features/criteria/components/RiskLevelTable'
import type { RiskLevel } from '@/features/criteria/criteria.types'
import { useSaveRiskLevelVersion } from '@/features/criteria/hooks/useRiskConfig'
import { riskLevelsSchema, type RiskLevelsFormValues } from '@/features/criteria/schemas/criteria.schema'
import { getErrorMessage } from '@/lib/http'
import { formatDate } from '@/utils/format-date'

type Row = RiskLevelsFormValues['levels'][number]

const toForm = (levels: readonly RiskLevel[]): RiskLevelsFormValues => ({
  levels: levels.map((l) => ({ code: l.code, name: l.name, maxScore: l.maxScore ?? null, remediationDays: l.remediationDays, action: l.action ?? '' })),
})

/** Điểm "từ" tự suy ra: mức đầu từ 0, mỗi mức bắt đầu đúng ở điểm "đến" của mức trước; mức cuối không giới hạn. */
function toPayload(rows: readonly Row[]): RiskLevel[] {
  let min = 0
  return rows.map((r, i) => {
    const last = i === rows.length - 1
    const level: RiskLevel = { code: r.code, name: r.name, minScore: min, maxScore: last ? null : r.maxScore,
      remediationDays: r.remediationDays, action: r.action || null }
    min = r.maxScore ?? min
    return level
  })
}

export interface RiskLevelEditorProps {
  /** Bảng xuất phát (bản đang xem). */
  source: readonly RiskLevel[]
  /** Ngày hiệu lực ban đầu (sửa bản sắp áp dụng) hoặc undefined (phiên bản mới từ hôm nay). */
  effectiveFrom?: string
  isModal?: boolean
  onCancel: () => void
  onSaved: (effectiveFrom: string) => void
}

/** Soạn một phiên bản bảng phân loại: chọn ngày hiệu lực, sửa các mức, lưu một lần. */
export function RiskLevelEditor({ source, effectiveFrom, isModal = false, onCancel, onSaved }: RiskLevelEditorProps) {
  const notify = useNotify()
  const confirm = useConfirm()
  const save = useSaveRiskLevelVersion()
  const [date, setDate] = useState<Dayjs>(effectiveFrom ? dayjs(effectiveFrom) : dayjs().startOf('day'))
  const { control, handleSubmit, formState } = useForm<RiskLevelsFormValues>({
    resolver: zodResolver(riskLevelsSchema),
    defaultValues: toForm(source),
  })
  const { fields, append, remove } = useFieldArray({ control, name: 'levels' })
  const rows = useWatch({ control, name: 'levels' })
  const preview = toPayload(rows ?? [])
  const rootError = formState.errors.levels?.root?.message ?? formState.errors.levels?.message

  const onSubmit = handleSubmit((v) =>
    save.mutate({ effectiveFrom: date.format('YYYY-MM-DD'), levels: toPayload(v.levels) }, {
      onSuccess: (saved) => {
        notify.success(`Đã lưu phiên bản áp dụng từ ${formatDate(saved.effectiveFrom)}`)
        onSaved(saved.effectiveFrom)
      },
      onError: (err) => notify.error(getErrorMessage(err)),
    }),
  )

  const handleRemove = async (i: number) => {
    if (await confirm({ title: `Xoá mức ${rows?.[i]?.code ?? ''} khỏi phiên bản này?`, okText: 'Xoá', danger: true })) remove(i)
  }

  const content = (
    <Flex vertical gap={12}>
      <Flex
        align="center"
        justify="flex-start"
        wrap
        gap={12}
        style={{
          padding: '10px 14px',
          background: '#f8fafc',
          borderRadius: 8,
          border: '1px solid #e2e8f0',
        }}
      >
        <Space size={8}>
          <Typography.Text strong style={{ fontSize: 13, color: '#334155' }}>
            Áp dụng từ ngày:
          </Typography.Text>
          <DatePicker
            allowClear={false}
            format="DD/MM/YYYY"
            value={date}
            onChange={(d) => d && setDate(d)}
            disabledDate={(d) => d.isBefore(dayjs(), 'day')}
          />
        </Space>
      </Flex>
      <Typography.Text type="secondary" style={{ fontSize: 12.5 }}>
        Nhập điểm “đến” cho từng mức; điểm “từ” tự lấy bằng điểm “đến” của mức trước. Mức cao nhất không giới hạn trên.
      </Typography.Text>
      {rootError && <Alert type="error" showIcon title={rootError} />}
      <RiskLevelTable control={control} fields={fields} preview={preview} editable onRemove={(i) => void handleRemove(i)} />
      <Flex justify="space-between" align="center" style={{ paddingTop: 10, borderTop: '1px solid #e2e8f0' }}>
        <Button icon={<PlusOutlined />} onClick={() => append({ code: `M${fields.length + 1}`, name: '', maxScore: null, remediationDays: 7, action: '' })}>
          Thêm mức
        </Button>
        <Space>
          <Button onClick={onCancel}>Huỷ</Button>
          <Button type="primary" loading={save.isPending} onClick={() => void onSubmit()}>
            Lưu phiên bản
          </Button>
        </Space>
      </Flex>
    </Flex>
  )

  if (isModal) {
    return content
  }

  return (
    <Card
      title={effectiveFrom ? `Sửa phiên bản từ ${formatDate(effectiveFrom)}` : 'Phiên bản mới'}
      extra={
        <Space>
          <Typography.Text type="secondary">Áp dụng từ</Typography.Text>
          <DatePicker allowClear={false} format="DD/MM/YYYY" value={date} onChange={(d) => d && setDate(d)}
            disabledDate={(d) => d.isBefore(dayjs(), 'day')} />
        </Space>
      }
    >
      {content}
    </Card>
  )
}
