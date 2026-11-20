import { EditOutlined, PlusCircleOutlined, UnorderedListOutlined } from '@ant-design/icons'
import { zodResolver } from '@hookform/resolvers/zod'
import { Button, Col, Flex, Form, Row, Segmented, Select, Tag } from 'antd'
import { useEffect, useMemo, useState } from 'react'
import { useForm, useWatch } from 'react-hook-form'
import { FormInput } from '@/components/data-entry/FormInput'
import { FormNumber } from '@/components/data-entry/FormNumber'
import { FormSelect } from '@/components/data-entry/FormSelect'
import { FormSwitch } from '@/components/data-entry/FormSwitch'
import { FormTextarea } from '@/components/data-entry/FormTextarea'
import { DetailDrawer } from '@/components/feedback/detail'
import { useNotify } from '@/components/feedback/useNotify'
import { BatchCriterionList } from '@/features/criteria/components/BatchCriterionList'
import { BatchPasteBox } from '@/features/criteria/components/BatchPasteBox'
import { BatchToolbar } from '@/features/criteria/components/BatchToolbar'
import { IMPACT_LEVELS, type Criterion, type CriterionGroup } from '@/features/criteria/criteria.types'
import { useBatchCriterionEditor } from '@/features/criteria/hooks/useBatchCriterionEditor'
import { useCriteriaList, useSaveCriterion } from '@/features/criteria/hooks/useCriteria'
import { criterionSchema, type CriterionFormValues } from '@/features/criteria/schemas/criteria.schema'
import { applyFieldErrors, getErrorMessage } from '@/lib/http'
import { nextSequentialCode, uniqueAcronymCode } from '@/utils/auto-code'
import { formatDateTime } from '@/utils/format-date'

const IMPACT_META: Record<number, { label: string; color: string; desc: string }> = {
  1: { label: 'Mức 1 – Rất nhẹ', color: '#10b981', desc: 'Theo dõi & nhắc nhở tại ca trực' },
  2: { label: 'Mức 2 – Nhẹ', color: '#3b82f6', desc: 'Khắc phục có kế hoạch (hạn 30 ngày)' },
  3: { label: 'Mức 3 – Trung bình', color: '#f59e0b', desc: 'Khắc phục nhanh & phòng ngừa (hạn 7 ngày)' },
  4: { label: 'Mức 4 – Nặng (ATTP / PCCC)', color: '#ea580c', desc: 'Khắc phục khẩn cấp trong 24h & báo cáo lãnh đạo' },
  5: { label: 'Mức 5 – Nghiêm trọng', color: '#ef4444', desc: 'Đình chỉ hạng mục vi phạm, lập biên bản tức thì' },
}

const IMPACT_OPTIONS = IMPACT_LEVELS.map((v) => ({
  value: v,
  label: `${IMPACT_META[v]?.label ?? `Mức ${v}`} (${IMPACT_META[v]?.desc})`,
}))

export interface CriterionFormModalProps {
  open: boolean
  criterion?: Criterion
  groups: readonly CriterionGroup[]
  defaultGroupId?: number
  defaultMode?: 'single' | 'batch'
  onClose: () => void
}

function emptyValues(groupId?: number): CriterionFormValues {
  return {
    groupId: groupId ?? null,
    code: '',
    name: '',
    checkMethod: '',
    evidenceRequired: '',
    baseImpact: 2,
    sortOrder: 1,
    active: true,
  }
}

export function CriterionFormModal({
  open,
  criterion,
  groups,
  defaultGroupId,
  defaultMode,
  onClose,
}: CriterionFormModalProps) {
  const notify = useNotify()
  const save = useSaveCriterion()
  const allCriteria = useCriteriaList({ page: 0, size: 200 })

  const [mode, setMode] = useState<'single' | 'batch'>('single')
  const [pasteOpen, setPasteOpen] = useState(false)
  const [pasteText, setPasteText] = useState('')

  const activeGroups = useMemo(
    () => groups.filter((g) => g.active || g.id === criterion?.groupId),
    [groups, criterion],
  )

  const { control, handleSubmit, reset, setError, setValue, formState } = useForm<CriterionFormValues>({
    resolver: zodResolver(criterionSchema),
    defaultValues: emptyValues(defaultGroupId),
  })

  const selectedGroupId = useWatch({ control, name: 'groupId' })
  const selectedGroup = useMemo(
    () => activeGroups.find((g) => g.id === selectedGroupId),
    [activeGroups, selectedGroupId],
  )

  const existingCodes = useMemo(
    () => (allCriteria.data?.items ?? []).map((c) => c.code),
    [allCriteria.data?.items],
  )

  const batchEditor = useBatchCriterionEditor(selectedGroup, () => {
    onClose()
  })

  // Khởi tạo form khi mở Drawer: chỉ chạy khi open hoặc criterion thay đổi
  useEffect(() => {
    if (!open) return
    setMode(criterion ? 'single' : (defaultMode ?? 'single'))
    setPasteOpen(false)
    setPasteText('')

    if (criterion) {
      reset({
        groupId: criterion.groupId,
        code: criterion.code,
        name: criterion.name,
        checkMethod: criterion.checkMethod ?? '',
        evidenceRequired: criterion.evidenceRequired ?? '',
        baseImpact: criterion.baseImpact,
        sortOrder: criterion.sortOrder,
        active: criterion.active,
      })
    } else {
      const initGid = defaultGroupId ?? activeGroups[0]?.id ?? null
      const initGroup = activeGroups.find((g) => g.id === initGid)
      const initPrefix = initGroup ? `TC-${initGroup.code.replace(/^GRP-?/i, '')}` : 'TC'
      const initCode = nextSequentialCode(initPrefix, existingCodes, 2, '-')
      reset({
        ...emptyValues(initGid ?? undefined),
        code: initCode,
      })
    }
  }, [open, criterion, defaultGroupId, defaultMode]) // eslint-disable-line react-hooks/exhaustive-deps

  // Tự sinh mã tiêu chí khi người dùng đổi nhóm hoặc gõ tên (chỉ khi tạo mới và chưa tự gõ mã)
  const isCodeDirty = formState.dirtyFields.code
  const watchedName = useWatch({ control, name: 'name' })

  useEffect(() => {
    if (!open || criterion || isCodeDirty) return
    if (!selectedGroup) return
    const groupPrefix = `TC-${selectedGroup.code.replace(/^GRP-?/i, '')}`
    const trimmed = (watchedName ?? '').trim()
    const generated = trimmed
      ? uniqueAcronymCode(trimmed, existingCodes, groupPrefix, groupPrefix)
      : nextSequentialCode(groupPrefix, existingCodes, 2, '-')
    setValue('code', generated, { shouldValidate: false })
  }, [open, criterion, selectedGroupId, selectedGroup, watchedName, existingCodes, isCodeDirty, setValue])

  const onSubmit = handleSubmit((v) =>
    save.mutate(
      {
        id: criterion?.id,
        body: {
          ...v,
          groupId: v.groupId ?? 0,
          checkMethod: v.checkMethod || undefined,
          evidenceRequired: v.evidenceRequired || undefined,
        },
      },
      {
        onSuccess: () => {
          notify.success(criterion ? 'Đã cập nhật tiêu chí kiểm soát' : 'Đã thêm tiêu chí kiểm soát')
          onClose()
        },
        onError: (err) => {
          if (!applyFieldErrors(err, setError)) notify.error(getErrorMessage(err))
        },
      },
    ),
  )

  const groupOptions = activeGroups.map((g) => ({
    value: g.id,
    label: `${g.code} – ${g.name}${g.companyName ? ` (${g.companyName})` : ''}`,
  }))

  return (
    <DetailDrawer
      open={open}
      onClose={onClose}
      fit={false}
      maskClosable={false}
      closeText="Huỷ"
      icon={criterion ? <EditOutlined /> : mode === 'batch' ? <UnorderedListOutlined /> : <PlusCircleOutlined />}
      title={
        criterion ? (
          <Flex align="center" gap={8}>
            <span>Chỉnh sửa tiêu chí</span>
            <Tag color="blue" style={{ fontWeight: 600 }}>
              {criterion.code}
            </Tag>
          </Flex>
        ) : mode === 'batch' ? (
          'Thêm tiêu chí hàng loạt'
        ) : (
          'Thêm tiêu chí kiểm soát'
        )
      }
      subtitle={
        criterion
          ? `Cập nhật nội dung đánh giá và mức độ ảnh hưởng của tiêu chí ${criterion.code}`
          : mode === 'batch'
          ? 'Nhập nhanh danh sách tiêu chí, hỗ trợ dán từ Excel (Ctrl+V) và áp dụng mức độ rủi ro hàng loạt'
          : 'Nhập thông tin tiêu chí, phương pháp đánh giá và mức độ ảnh hưởng rủi ro cơ sở'
      }
      audit={
        criterion
          ? {
              updatedAt: formatDateTime(criterion.updatedAt),
            }
          : undefined
      }
      footerNote={mode === 'batch' ? <span className="batch-drawer__code">{batchEditor.codeNote}</span> : undefined}
      actions={
        mode === 'batch' ? (
          <Button
            type="primary"
            loading={batchEditor.saving}
            disabled={!selectedGroup || batchEditor.filledCount === 0}
            onClick={() => void batchEditor.save()}
          >
            {batchEditor.filledCount > 1 ? `Thêm ${batchEditor.filledCount} tiêu chí` : 'Thêm tiêu chí'}
          </Button>
        ) : (
          <Button type="primary" loading={save.isPending} onClick={() => void onSubmit()}>
            {criterion ? 'Lưu thay đổi' : 'Tạo tiêu chí'}
          </Button>
        )
      }
    >
      {/* Nút chuyển chế độ: Tạo đơn lẻ vs Tạo hàng loạt (khi thêm mới) */}
      {!criterion && (
        <div style={{ marginBottom: 16 }}>
          <Segmented
            value={mode}
            onChange={(v) => setMode(v as 'single' | 'batch')}
            options={[
              { label: 'Thêm từng tiêu chí (Chi tiết)', value: 'single', icon: <PlusCircleOutlined /> },
              { label: 'Thêm nhiều tiêu chí (Hàng loạt / Excel)', value: 'batch', icon: <UnorderedListOutlined /> },
            ]}
            block
            size="large"
          />
        </div>
      )}

      {/* CHẾ ĐỘ 1: THÊM TỪNG TIÊU CHÍ HOẶC CHỈNH SỬA */}
      {mode === 'single' && (
        <Form layout="vertical" onFinish={() => void onSubmit()}>
          <button type="submit" hidden />

          {/* Khối 1: Định danh & Nhóm tiêu chí */}
          <div
            style={{
              padding: '14px 16px 4px',
              borderRadius: 12,
              border: '1px solid #e2e8f0',
              background: '#ffffff',
              marginBottom: 14,
            }}
          >
            <Row gutter={12}>
              <Col xs={24} md={12}>
                <FormSelect<CriterionFormValues, number>
                  control={control}
                  name="groupId"
                  label="Thuộc Nhóm tiêu chí"
                  required
                  showSearch={{ optionFilterProp: 'label' }}
                  placeholder="Chọn nhóm tiêu chí"
                  options={groupOptions}
                />
              </Col>
              <Col xs={24} md={8}>
                <FormInput
                  control={control}
                  name="code"
                  label="Mã tiêu chí (Tự sinh)"
                  required
                  maxLength={30}
                  placeholder="VD: TC-VS-01"
                />
              </Col>
              <Col xs={24} md={4}>
                <FormNumber
                  control={control}
                  name="sortOrder"
                  label="Thứ tự"
                  required
                  min={0}
                  max={9999}
                  precision={0}
                />
              </Col>
              <Col span={24}>
                <FormInput
                  control={control}
                  name="name"
                  label="Nội dung tiêu chí kiểm soát"
                  required
                  autoFocus={!criterion}
                  maxLength={300}
                  placeholder="VD: Nhiệt độ bảo quản tủ đông đạt chuẩn (-18°C đến -22°C)"
                />
              </Col>
            </Row>
          </div>

          {/* Khối 2: Phương pháp & Bằng chứng nghiệm thu */}
          <div
            style={{
              padding: '14px 16px 4px',
              borderRadius: 12,
              border: '1px solid #e2e8f0',
              background: '#ffffff',
              marginBottom: 14,
            }}
          >
            <Row gutter={12}>
              <Col span={24}>
                <FormTextarea
                  control={control}
                  name="checkMethod"
                  label="Phương pháp đánh giá / Kiểm tra thực tế"
                  autoSize={{ minRows: 2, maxRows: 4 }}
                  maxLength={4000}
                  placeholder="VD: Dùng nhiệt kế kiểm chuẩn đo nhiệt độ trung tâm tủ đông tại 3 vị trí..."
                />
              </Col>
              <Col span={24}>
                <FormTextarea
                  control={control}
                  name="evidenceRequired"
                  label="Hồ sơ / Bằng chứng minh chứng bắt buộc"
                  autoSize={{ minRows: 2, maxRows: 4 }}
                  maxLength={4000}
                  placeholder="VD: Chụp ảnh màn hình nhiệt kế kiểm chuẩn và tem date dán trên tủ..."
                  extra="Khi đánh giá Không đạt, chuyên viên bắt buộc chụp hình ảnh/video minh chứng cụ thể."
                />
              </Col>
            </Row>
          </div>

          {/* Khối 3: Mức độ ảnh hưởng cơ sở & Trạng thái */}
          <div
            style={{
              padding: '14px 16px 4px',
              borderRadius: 12,
              border: '1px solid #e2e8f0',
              background: '#f8fafc',
            }}
          >
            <Row gutter={16} align="middle">
              <Col xs={24} md={16}>
                <FormSelect<CriterionFormValues, number>
                  control={control}
                  name="baseImpact"
                  label="Mức độ ảnh hưởng cơ sở (Base Impact)"
                  required
                  options={IMPACT_OPTIONS}
                  extra="Điểm rủi ro = Mức độ ảnh hưởng × Tần suất vi phạm trong kỳ"
                />
              </Col>
              <Col xs={24} md={8}>
                <FormSwitch
                  control={control}
                  name="active"
                  label="Trạng thái áp dụng"
                  checkedChildren="Đang dùng"
                  unCheckedChildren="Tạm ngưng"
                />
              </Col>
            </Row>
          </div>
        </Form>
      )}

      {/* CHẾ ĐỘ 2: THÊM NHIỀU TIÊU CHÍ CÙNG LÚC (HÀNG LOẠT / EXCEL) */}
      {mode === 'batch' && (
        <div>
          <div
            style={{
              padding: '12px 16px',
              borderRadius: 12,
              border: '1px solid #e2e8f0',
              background: '#f8fafc',
              marginBottom: 14,
            }}
          >
            <Row gutter={12} align="middle">
              <Col xs={24} md={14}>
                <div style={{ fontSize: 13, fontWeight: 600, color: '#334155', marginBottom: 4 }}>
                  Thuộc Nhóm tiêu chí <span style={{ color: '#ef4444' }}>*</span>
                </div>
                <Select
                  style={{ width: '100%' }}
                  value={selectedGroupId}
                  onChange={(val) => {
                    setValue('groupId', val, { shouldValidate: true })
                  }}
                  showSearch={{ optionFilterProp: 'label' }}
                  placeholder="Chọn nhóm tiêu chí"
                  options={groupOptions}
                />
              </Col>
              <Col xs={24} md={10}>
                {selectedGroup && (
                  <div style={{ fontSize: 12.5, color: '#64748b', marginTop: 18 }}>
                    <span>
                      Đang có <b>{selectedGroup.criterionCount}</b> tiêu chí
                    </span>
                    {selectedGroup.companyName && <span> · {selectedGroup.companyName}</span>}
                  </div>
                )}
              </Col>
            </Row>
          </div>

          <div className="batch-drawer">
            <BatchToolbar
              count={batchEditor.filledCount}
              pasteOpen={pasteOpen}
              onTogglePaste={() => setPasteOpen((v) => !v)}
              onApplyImpact={batchEditor.applyImpact}
              onClearEmpty={batchEditor.clearEmpty}
            />
            {pasteOpen && (
              <BatchPasteBox
                pasteText={pasteText}
                onChangeText={setPasteText}
                onClose={() => setPasteOpen(false)}
                onApply={(pasteMode) => {
                  batchEditor.applyPaste(pasteText, pasteMode)
                  setPasteText('')
                  setPasteOpen(false)
                }}
              />
            )}
            <BatchCriterionList
              items={batchEditor.items}
              onUpdateItem={batchEditor.update}
              onRemoveItem={batchEditor.remove}
              onEnterNext={batchEditor.focusRow}
              onAddRow={() => batchEditor.focusRow(batchEditor.items.length)}
            />
          </div>
        </div>
      )}
    </DetailDrawer>
  )
}
