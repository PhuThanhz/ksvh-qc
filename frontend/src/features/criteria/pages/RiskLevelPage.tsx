import { CalculatorOutlined, EditOutlined, PlusOutlined } from '@ant-design/icons'
import { Button, Card, Flex, Space } from 'antd'
import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router'
import { ErrorState } from '@/components/feedback/ErrorState'
import { useConfirm } from '@/components/feedback/useConfirm'
import { useNotify } from '@/components/feedback/useNotify'
import { PageContainer } from '@/components/layout/PageContainer'
import { ROUTES } from '@/constants/routes'
import { ConfigStatusTag } from '@/features/criteria/components/ConfigStatusTag'
import { RiskLevelEditor } from '@/features/criteria/components/RiskLevelEditor'
import { RiskLevelVersionsCard } from '@/features/criteria/components/RiskLevelVersionsCard'
import { RiskLevelView } from '@/features/criteria/components/RiskLevelView'
import type { RiskLevelVersion } from '@/features/criteria/criteria.types'
import { useDeleteRiskLevelVersion, useRiskLevelVersions } from '@/features/criteria/hooks/useRiskConfig'
import { getErrorMessage } from '@/lib/http'
import { PERMISSIONS, usePermission } from '@/permissions'
import { formatDate } from '@/utils/format-date'

type Editing = { mode: 'new' } | { mode: 'edit'; effectiveFrom: string } | null

/** Danh mục 7: bảng phân loại rủi ro theo phiên bản ngày hiệu lực. Xem mặc định; sửa bằng cách tạo phiên bản. */
export function RiskLevelPage() {
  const navigate = useNavigate()
  const notify = useNotify()
  const confirm = useConfirm()
  const { can } = usePermission()
  const editable = can(PERMISSIONS.CRITERIA.MANAGE)
  const versions = useRiskLevelVersions()
  const removeVersion = useDeleteRiskLevelVersion()
  const [selectedDate, setSelectedDate] = useState<string>()
  const [editing, setEditing] = useState<Editing>(null)

  const selected: RiskLevelVersion | undefined = useMemo(() => {
    const list = versions.data ?? []
    return list.find((v) => v.effectiveFrom === selectedDate) ?? list.find((v) => v.status === 'CURRENT') ?? list[0]
  }, [versions.data, selectedDate])

  const handleDelete = async (v: RiskLevelVersion) => {
    if (!(await confirm({ title: `Xoá phiên bản hiệu lực từ ${formatDate(v.effectiveFrom)}?`, okText: 'Xoá', danger: true }))) return
    removeVersion.mutate(v.effectiveFrom, {
      onSuccess: () => {
        notify.success('Đã xoá phiên bản')
        setSelectedDate(undefined)
      },
      onError: (err) => notify.error(getErrorMessage(err)),
    })
  }

  if (versions.error && !versions.data) return <ErrorState onRetry={() => void versions.refetch()} />

  return (
    <PageContainer
      title="Phân loại rủi ro"
      subtitle="Điểm rủi ro = mức ảnh hưởng × tần suất lỗi; mỗi mức có khoảng điểm, hạn khắc phục và hành động bắt buộc"
      extra={
        <Space>
          <Button icon={<CalculatorOutlined />} onClick={() => navigate(ROUTES.admin.riskRules)}>
            Mô phỏng điểm
          </Button>
          {editable && !editing && (
            <Button type="primary" icon={<PlusOutlined />} onClick={() => setEditing({ mode: 'new' })} disabled={!selected}>
              Tạo phiên bản mới
            </Button>
          )}
        </Space>
      }
    >
      <Flex vertical gap={16}>
        {editing && selected ? (
          <RiskLevelEditor
            key={editing.mode === 'edit' ? editing.effectiveFrom : 'new'}
            source={selected.levels}
            effectiveFrom={editing.mode === 'edit' ? editing.effectiveFrom : undefined}
            onCancel={() => setEditing(null)}
            onSaved={(d) => {
              setEditing(null)
              setSelectedDate(d)
            }}
          />
        ) : (
          <Card
            loading={versions.isLoading}
            title={
              selected ? (
                <Flex align="center" gap={8}>
                  Bảng phân loại · hiệu lực từ {formatDate(selected.effectiveFrom)}
                  <ConfigStatusTag status={selected.status} />
                </Flex>
              ) : 'Bảng phân loại'
            }
            extra={
              editable && selected?.status === 'SCHEDULED' && (
                <Button icon={<EditOutlined />} onClick={() => setEditing({ mode: 'edit', effectiveFrom: selected.effectiveFrom })}>
                  Sửa phiên bản
                </Button>
              )
            }
          >
            {selected && <RiskLevelView levels={selected.levels} />}
          </Card>
        )}
        <RiskLevelVersionsCard
          versions={versions.data ?? []}
          loading={versions.isLoading}
          selectedDate={selected?.effectiveFrom}
          editable={editable}
          onSelect={(d) => {
            setEditing(null)
            setSelectedDate(d)
          }}
          onDelete={(v) => void handleDelete(v)}
        />
      </Flex>
    </PageContainer>
  )
}
