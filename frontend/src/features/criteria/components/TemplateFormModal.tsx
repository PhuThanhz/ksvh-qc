import {
  AppstoreOutlined,
  CheckSquareOutlined,
  CloseOutlined,
  FileDoneOutlined,
  SearchOutlined,
} from '@ant-design/icons'
import { zodResolver } from '@hookform/resolvers/zod'
import {
  Button,
  Checkbox,
  Col,
  Drawer,
  Empty,
  Flex,
  Form,
  Input,
  Row,
  Select,
  Spin,
  Switch,
  Tag,
  Typography,
} from 'antd'
import { useEffect, useMemo, useState } from 'react'
import { Controller, useForm, useWatch } from 'react-hook-form'
import { FormInput } from '@/components/data-entry/FormInput'
import { FormSelect } from '@/components/data-entry/FormSelect'
import { ImpactTag } from '@/features/criteria/components/ImpactTag'
import { IMPACT_LEVELS, type Criterion } from '@/features/criteria/criteria.types'
import { useCriterionOptions } from '@/features/criteria/hooks/useCriteria'
import { useSaveTemplate, useTemplate, useTemplateOptions } from '@/features/criteria/hooks/useTemplates'
import { templateSchema, type TemplateFormValues } from '@/features/criteria/schemas/criteria.schema'
import { useCompanies } from '@/features/organizations/hooks/useOrganizations'
import { useNotify } from '@/components/feedback/useNotify'
import { applyFieldErrors, getErrorMessage } from '@/lib/http'
import { nextSequentialCode } from '@/utils/auto-code'

const EMPTY: TemplateFormValues = {
  code: '',
  name: '',
  companyId: null,
  inspectionType: 'Định kỳ',
  description: '',
  criterionIds: [],
  active: true,
}

export interface TemplateFormModalProps {
  open: boolean
  templateId?: number
  onClose: () => void
}

interface GroupStat {
  id: number
  name: string
  items: Criterion[]
  selectedCount: number
}

export function TemplateFormModal({ open, templateId, onClose }: TemplateFormModalProps) {
  const notify = useNotify()
  const save = useSaveTemplate()
  const detail = useTemplate(open ? templateId : undefined)
  const options = useCriterionOptions(open)
  const templateOptions = useTemplateOptions(open)
  const companies = useCompanies({ page: 0, size: 100, active: true })
  const editing = templateId !== undefined

  const [activeGroupId, setActiveGroupId] = useState<number | 'ALL'>('ALL')
  const [keyword, setKeyword] = useState('')
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'SELECTED' | 'UNSELECTED'>('ALL')
  const [impactFilter, setImpactFilter] = useState<number | 'ALL'>('ALL')

  const {
    control,
    handleSubmit,
    reset,
    setError,
    setValue,
    formState: { errors },
  } = useForm<TemplateFormValues>({
    resolver: zodResolver(templateSchema),
    defaultValues: EMPTY,
  })

  const autoCode = useMemo(() => {
    const existingCodes = (templateOptions.data ?? []).map((t) => t.code)
    return nextSequentialCode('TPL', existingCodes, 2, '-')
  }, [templateOptions.data])

  useEffect(() => {
    if (!open) return
    setKeyword('')
    setStatusFilter('ALL')
    setImpactFilter('ALL')
    setActiveGroupId('ALL')

    const t = detail.data
    if (editing && !t) return
    reset(
      t
        ? {
            code: t.code,
            name: t.name,
            companyId: t.companyId ?? null,
            inspectionType: t.inspectionType || 'Định kỳ',
            description: t.description ?? '',
            criterionIds: t.criteria.map((c) => c.id),
            active: t.active,
          }
        : { ...EMPTY, code: autoCode },
    )
  }, [open, editing, detail.data, autoCode, reset])

  const companyOptions = useMemo(() => {
    const list = (companies.data?.items ?? []).map((c) => ({ value: c.id, label: `${c.code} – ${c.name}` }))
    const curCompanyId = detail.data?.companyId
    const curCompanyName = detail.data?.companyName
    if (curCompanyId && curCompanyName && !list.some((o) => o.value === curCompanyId)) {
      list.unshift({ value: curCompanyId, label: curCompanyName })
    }
    return list
  }, [companies.data, detail.data])

  const companyId = useWatch({ control, name: 'companyId' }) ?? null
  const selectedIds = useWatch({ control, name: 'criterionIds' }) ?? []
  const selectedSet = useMemo(() => new Set(selectedIds), [selectedIds])

  const all = useMemo<Criterion[]>(() => {
    const fits = (c: Criterion) => c.groupCompanyId === null || c.groupCompanyId === companyId
    const active = (options.data ?? []).filter((c) => fits(c) || selectedSet.has(c.id))
    const extra = (detail.data?.criteria ?? []).filter(
      (c) => !active.some((a) => a.id === c.id) && selectedSet.has(c.id),
    )
    return [...active, ...extra]
  }, [options.data, detail.data, companyId, selectedSet])

  const groupStats = useMemo<GroupStat[]>(() => {
    const map = new Map<number, GroupStat>()
    for (const c of all) {
      const gId = c.groupId ?? 0
      const gName = c.groupName ?? 'Nhóm khác'
      let cur = map.get(gId)
      if (!cur) {
        cur = { id: gId, name: gName, items: [], selectedCount: 0 }
        map.set(gId, cur)
      }
      cur.items.push(c)
      if (selectedSet.has(c.id)) cur.selectedCount += 1
    }
    return Array.from(map.values())
  }, [all, selectedSet])

  // Tự động chọn nhóm đầu tiên khi danh sách nhóm đã tải xong để thao tác Bước 1 -> Bước 2 rõ ràng
  useEffect(() => {
    if (activeGroupId === 'ALL' && groupStats.length > 0 && !keyword.trim()) {
      setActiveGroupId(groupStats[0]!.id)
    }
  }, [groupStats, activeGroupId, keyword])

  const currentGroup = useMemo(
    () => (activeGroupId === 'ALL' ? undefined : groupStats.find((g) => g.id === activeGroupId)),
    [activeGroupId, groupStats],
  )

  const displayedCriteria = useMemo(() => {
    const q = keyword.trim().toLowerCase()
    const baseList = activeGroupId === 'ALL' ? all : (currentGroup?.items ?? [])
    return baseList.filter((c) => {
      const isSelected = selectedSet.has(c.id)
      if (statusFilter === 'SELECTED' && !isSelected) return false
      if (statusFilter === 'UNSELECTED' && isSelected) return false
      if (impactFilter !== 'ALL' && c.baseImpact !== impactFilter) return false
      if (q) {
        if (
          !c.code.toLowerCase().includes(q) &&
          !c.name.toLowerCase().includes(q) &&
          !(c.groupName ?? '').toLowerCase().includes(q) &&
          !(c.checkMethod ?? '').toLowerCase().includes(q)
        ) {
          return false
        }
      }
      return true
    })
  }, [all, activeGroupId, currentGroup, statusFilter, impactFilter, keyword, selectedSet])

  const toggleIds = (ids: readonly number[], turnOn: boolean) => {
    const next = new Set(selectedSet)
    ids.forEach((id) => (turnOn ? next.add(id) : next.delete(id)))
    setValue('criterionIds', [...next], { shouldDirty: true, shouldValidate: true })
  }

  const displayedIds = useMemo(() => displayedCriteria.map((c) => c.id), [displayedCriteria])
  const selectedInDisplayed = useMemo(
    () => displayedIds.filter((id) => selectedSet.has(id)).length,
    [displayedIds, selectedSet],
  )
  const allDisplayedChecked = displayedIds.length > 0 && selectedInDisplayed === displayedIds.length
  const indeterminateDisplayed = selectedInDisplayed > 0 && selectedInDisplayed < displayedIds.length

  const onSubmit = handleSubmit((v) => {
    const pos = new Map(all.map((c, i) => [c.id, i]))
    const ordered = [...v.criterionIds].sort((a, b) => (pos.get(a) ?? 0) - (pos.get(b) ?? 0))
    save.mutate(
      {
        id: templateId,
        body: {
          ...v,
          companyId: v.companyId ?? undefined,
          criterionIds: ordered,
          inspectionType: 'Định kỳ',
          description: v.description || undefined,
        },
      },
      {
        onSuccess: () => {
          notify.success(editing ? 'Đã cập nhật mẫu phiếu' : 'Đã tạo mẫu phiếu')
          onClose()
        },
        onError: (err) => {
          if (!applyFieldErrors(err, setError)) notify.error(getErrorMessage(err))
        },
      },
    )
  })

  const loading = (editing && detail.isLoading) || options.isLoading

  return (
    <Drawer
      open={open}
      onClose={onClose}
      placement="bottom"
      size="calc(100vh - 24px)"
      closable={false}
      destroyOnHidden
      rootClassName="detail-drawer"
      styles={{ body: { padding: '20px 28px', overflow: 'hidden', background: 'transparent' } }}
      title={
        <Flex align="center" justify="space-between">
          <Flex align="center" gap={12}>
            <span className="detail-drawer__icon" style={{ background: '#eff6ff', color: '#2563eb' }}>
              <FileDoneOutlined />
            </span>
            <div>
              <Typography.Title level={5} className="detail-drawer__title">
                {editing ? `Chỉnh sửa mẫu phiếu: ${detail.data?.name ?? ''}` : 'Tạo mẫu phiếu kiểm tra định kỳ'}
              </Typography.Title>
              <div className="detail-drawer__subtitle">
                Bước 1: Chọn nhóm tiêu chí bên trái → Bước 2: Tích chọn tiêu chí (hoặc chọn tất cả) bên phải
              </div>
            </div>
          </Flex>
          <Flex align="center" gap={10}>
            <Tag
              color={selectedSet.size > 0 ? 'blue' : 'default'}
              style={{
                margin: 0,
                padding: '4px 12px',
                borderRadius: 999,
                fontSize: 13,
                fontWeight: 600,
              }}
            >
              Đã chọn: {selectedSet.size} / {all.length} tiêu chí
            </Tag>
            {selectedSet.size < all.length && (
              <Button size="small" onClick={() => toggleIds(all.map((c) => c.id), true)}>
                Chọn toàn bộ ({all.length})
              </Button>
            )}
            {selectedSet.size > 0 && (
              <Button size="small" danger type="text" onClick={() => toggleIds(all.map((c) => c.id), false)}>
                Bỏ chọn hết
              </Button>
            )}
          </Flex>
        </Flex>
      }
      drawerRender={(node) => (
        <>
          <button type="button" className="detail-drawer__close" aria-label="Đóng" onClick={onClose}>
            <CloseOutlined />
          </button>
          {node}
        </>
      )}
      footer={
        <Flex align="center" justify="space-between" gap={12} wrap>
          <div>
            {errors.criterionIds?.message ? (
              <Typography.Text type="danger" style={{ fontSize: 13, fontWeight: 600 }}>
                {errors.criterionIds.message}
              </Typography.Text>
            ) : (
              <Typography.Text type="secondary" style={{ fontSize: 13 }}>
                {selectedSet.size === 0
                  ? 'Chưa chọn tiêu chí nào cho mẫu phiếu'
                  : `Đã chọn ${selectedSet.size} tiêu chí thuộc ${groupStats.filter((g) => g.selectedCount > 0).length}/${groupStats.length} nhóm tiêu chí`}
              </Typography.Text>
            )}
          </div>
          <Flex gap={8}>
            <Button onClick={onClose}>Huỷ</Button>
            <Button
              type="primary"
              loading={save.isPending}
              disabled={loading}
              onClick={() => void onSubmit()}
            >
              {editing ? 'Lưu thay đổi' : 'Tạo mẫu phiếu'}
            </Button>
          </Flex>
        </Flex>
      }
    >
      <Spin spinning={loading}>
        <Form layout="vertical" onFinish={() => void onSubmit()}>
          <button type="submit" hidden />
          <Flex
            vertical
            gap={16}
            style={{
              maxWidth: 1480,
              margin: '0 auto',
              height: 'calc(100vh - 196px)',
              minHeight: 480,
            }}
          >
            {/* KHỐI 1: THÔNG TIN MẪU PHIẾU GỌN GÀNG TRÊN 1 HÀNG */}
            <div
              style={{
                background: 'rgba(255, 255, 255, 0.88)',
                border: '1px solid rgba(255, 255, 255, 0.7)',
                boxShadow: '0 2px 10px rgba(15, 23, 42, 0.04)',
                borderRadius: 16,
                padding: '16px 20px 4px',
                flexShrink: 0,
              }}
            >
              <Row gutter={16} align="middle">
                <Col xs={24} sm={6} md={4}>
                  <FormInput
                    control={control}
                    name="code"
                    label="Mã mẫu (Tự sinh)"
                    required
                    maxLength={30}
                    placeholder="Tự động sinh"
                  />
                </Col>
                <Col xs={24} sm={18} md={7}>
                  <FormInput
                    control={control}
                    name="name"
                    label="Tên mẫu phiếu kiểm tra"
                    required
                    autoFocus={!editing}
                    maxLength={200}
                    placeholder="VD: Mẫu kiểm tra định kỳ nhà hàng"
                  />
                </Col>
                <Col xs={24} sm={12} md={5}>
                  <FormSelect
                    control={control}
                    name="companyId"
                    label="Công ty áp dụng"
                    placeholder="Dùng chung toàn chuỗi"
                    allowClear
                    showSearch={{ optionFilterProp: 'label' }}
                    options={companyOptions}
                    loading={companies.isLoading}
                  />
                </Col>
                <Col xs={24} sm={12} md={5}>
                  <FormInput
                    control={control}
                    name="description"
                    label="Ghi chú / Mô tả"
                    maxLength={500}
                    placeholder="Phạm vi áp dụng mẫu phiếu..."
                  />
                </Col>
                <Col xs={24} sm={12} md={3}>
                  <Controller
                    control={control}
                    name="active"
                    render={({ field }) => (
                      <Form.Item label="Trạng thái">
                        <Flex align="center" gap={8}>
                          <Switch checked={Boolean(field.value)} onChange={(val) => field.onChange(val)} />
                          <span style={{ fontSize: 13, fontWeight: 500, color: '#0f172a' }}>
                            {field.value ? 'Đang dùng' : 'Ngưng'}
                          </span>
                        </Flex>
                      </Form.Item>
                    )}
                  />
                </Col>
              </Row>
            </div>

            {/* KHỐI 2: MASTER-DETAIL (BƯỚC 1: CHỌN NHÓM BÊN TRÁI -> BƯỚC 2: TICK TIÊU CHÍ BÊN PHẢI) */}
            <div
              style={{
                flex: 1,
                minHeight: 0,
                display: 'grid',
                gridTemplateColumns: '320px 1fr',
                gap: 16,
              }}
            >
              {/* CỘT TRÁI: BƯỚC 1 - DANH SÁCH NHÓM TIÊU CHÍ */}
              <div
                style={{
                  background: 'rgba(255, 255, 255, 0.88)',
                  border: '1px solid rgba(255, 255, 255, 0.7)',
                  boxShadow: '0 2px 10px rgba(15, 23, 42, 0.04)',
                  borderRadius: 16,
                  display: 'flex',
                  flexDirection: 'column',
                  overflow: 'hidden',
                }}
              >
                <div
                  style={{
                    padding: '14px 16px',
                    borderBottom: '1px solid rgba(15, 23, 42, 0.06)',
                    background: 'rgba(248, 250, 252, 0.65)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                  }}
                >
                  <Flex align="center" gap={8}>
                    <span
                      style={{
                        width: 22,
                        height: 22,
                        borderRadius: 6,
                        background: '#2563eb',
                        color: '#ffffff',
                        fontSize: 12,
                        fontWeight: 700,
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      1
                    </span>
                    <span style={{ fontSize: 13, fontWeight: 700, color: '#0f172a', textTransform: 'uppercase' }}>
                      Chọn nhóm tiêu chí
                    </span>
                  </Flex>
                  <span style={{ fontSize: 12, color: '#64748b', fontWeight: 500 }}>
                    {groupStats.length} nhóm
                  </span>
                </div>

                <div style={{ flex: 1, overflowY: 'auto', padding: 10 }}>
                  <Flex vertical gap={6}>
                    {/* Mục Xem tất cả các nhóm */}
                    <div
                      onClick={() => setActiveGroupId('ALL')}
                      style={{
                        padding: '10px 12px',
                        borderRadius: 10,
                        cursor: 'pointer',
                        background: activeGroupId === 'ALL' ? '#eff6ff' : 'transparent',
                        border: `1px solid ${activeGroupId === 'ALL' ? '#93c5fd' : 'transparent'}`,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: 8,
                        transition: 'all 0.15s ease',
                      }}
                    >
                      <Flex align="center" gap={10} style={{ minWidth: 0 }}>
                        <Checkbox
                          checked={all.length > 0 && selectedSet.size === all.length}
                          indeterminate={selectedSet.size > 0 && selectedSet.size < all.length}
                          onClick={(e) => e.stopPropagation()}
                          onChange={(e) => toggleIds(all.map((c) => c.id), e.target.checked)}
                        />
                        <AppstoreOutlined style={{ color: activeGroupId === 'ALL' ? '#2563eb' : '#64748b' }} />
                        <span
                          style={{
                            fontSize: 13.5,
                            fontWeight: activeGroupId === 'ALL' ? 700 : 600,
                            color: activeGroupId === 'ALL' ? '#1d4ed8' : '#0f172a',
                          }}
                        >
                          Tất cả nhóm tiêu chí
                        </span>
                      </Flex>
                      <Tag
                        color={selectedSet.size > 0 ? 'blue' : 'default'}
                        style={{ margin: 0, borderRadius: 999, fontWeight: 600 }}
                      >
                        {selectedSet.size}/{all.length}
                      </Tag>
                    </div>

                    {/* Danh sách từng nhóm tiêu chí */}
                    {groupStats.map((g) => {
                      const isActive = activeGroupId === g.id
                      const gIds = g.items.map((c) => c.id)
                      const allInGroup = g.items.length > 0 && g.selectedCount === g.items.length
                      const someInGroup = g.selectedCount > 0 && g.selectedCount < g.items.length

                      return (
                        <div
                          key={g.id}
                          onClick={() => setActiveGroupId(g.id)}
                          style={{
                            padding: '10px 12px',
                            borderRadius: 10,
                            cursor: 'pointer',
                            background: isActive ? '#eff6ff' : '#ffffff',
                            border: `1px solid ${isActive ? '#3b82f6' : '#eef2f6'}`,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            gap: 8,
                            transition: 'all 0.15s ease',
                          }}
                        >
                          <Flex align="center" gap={10} style={{ minWidth: 0, flex: 1 }}>
                            <Checkbox
                              checked={allInGroup}
                              indeterminate={someInGroup}
                              onClick={(e) => e.stopPropagation()}
                              onChange={(e) => toggleIds(gIds, e.target.checked)}
                            />
                            <span
                              style={{
                                fontSize: 13.5,
                                fontWeight: isActive ? 700 : 500,
                                color: isActive ? '#1d4ed8' : '#1e293b',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                whiteSpace: 'nowrap',
                              }}
                              title={g.name}
                            >
                              {g.name}
                            </span>
                          </Flex>
                          <Tag
                            color={allInGroup ? 'success' : g.selectedCount > 0 ? 'blue' : 'default'}
                            style={{ margin: 0, borderRadius: 999, fontWeight: 600 }}
                          >
                            {g.selectedCount}/{g.items.length}
                          </Tag>
                        </div>
                      )
                    })}
                  </Flex>
                </div>
              </div>

              {/* CỘT PHẢI: BƯỚC 2 - DANH SÁCH TIÊU CHÍ CỦA NHÓM ĐANG CHỌN */}
              <div
                style={{
                  background: 'rgba(255, 255, 255, 0.88)',
                  border: '1px solid rgba(255, 255, 255, 0.7)',
                  boxShadow: '0 2px 10px rgba(15, 23, 42, 0.04)',
                  borderRadius: 16,
                  display: 'flex',
                  flexDirection: 'column',
                  overflow: 'hidden',
                }}
              >
                {/* Header của danh sách tiêu chí bên phải */}
                <div
                  style={{
                    padding: '12px 18px',
                    borderBottom: '1px solid rgba(15, 23, 42, 0.06)',
                    background: 'rgba(248, 250, 252, 0.65)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    flexWrap: 'wrap',
                    gap: 12,
                  }}
                >
                  <Flex align="center" gap={10} wrap>
                    <span
                      style={{
                        width: 22,
                        height: 22,
                        borderRadius: 6,
                        background: '#2563eb',
                        color: '#ffffff',
                        fontSize: 12,
                        fontWeight: 700,
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      2
                    </span>
                    <span style={{ fontSize: 14, fontWeight: 700, color: '#0f172a' }}>
                      {currentGroup ? currentGroup.name : 'Tất cả tiêu chí kiểm soát'}
                    </span>
                    <Tag color="blue" style={{ margin: 0, borderRadius: 999, fontWeight: 600 }}>
                      Đã chọn {selectedInDisplayed} / {displayedCriteria.length} tiêu chí
                    </Tag>
                  </Flex>

                  <Flex align="center" gap={8} wrap>
                    <Input
                      allowClear
                      prefix={<SearchOutlined style={{ color: '#64748b' }} />}
                      placeholder="Tìm mã hoặc tên tiêu chí..."
                      value={keyword}
                      onChange={(e) => setKeyword(e.target.value)}
                      style={{ width: 230 }}
                    />
                    <Select
                      value={statusFilter}
                      onChange={setStatusFilter}
                      style={{ width: 135 }}
                      options={[
                        { value: 'ALL', label: 'Mọi trạng thái' },
                        { value: 'SELECTED', label: 'Đã tick chọn' },
                        { value: 'UNSELECTED', label: 'Chưa chọn' },
                      ]}
                    />
                    <Select
                      value={impactFilter}
                      onChange={setImpactFilter}
                      style={{ width: 120 }}
                      options={[
                        { value: 'ALL', label: 'Mọi mức độ' },
                        ...IMPACT_LEVELS.map((lv) => ({ value: lv, label: `Mức ${lv}` })),
                      ]}
                    />
                    <Button
                      type={allDisplayedChecked ? 'default' : 'primary'}
                      ghost={!allDisplayedChecked}
                      icon={<CheckSquareOutlined />}
                      disabled={displayedIds.length === 0}
                      onClick={() => toggleIds(displayedIds, !allDisplayedChecked)}
                    >
                      {allDisplayedChecked ? 'Bỏ chọn nhóm này' : 'Chọn hết nhóm này'}
                    </Button>
                  </Flex>
                </div>

                {/* Dòng tiêu đề cột bảng tiêu chí */}
                <div
                  style={{
                    padding: '9px 18px',
                    borderBottom: '1px solid #eef2f6',
                    background: '#fafbfc',
                    display: 'grid',
                    gridTemplateColumns: '36px 120px 1fr 100px',
                    alignItems: 'center',
                    gap: 12,
                    fontSize: 12,
                    fontWeight: 700,
                    color: '#64748b',
                    textTransform: 'uppercase',
                    letterSpacing: '0.04em',
                  }}
                >
                  <Checkbox
                    checked={allDisplayedChecked}
                    indeterminate={indeterminateDisplayed}
                    disabled={displayedIds.length === 0}
                    onChange={(e) => toggleIds(displayedIds, e.target.checked)}
                  />
                  <span>Mã tiêu chí</span>
                  <span>Nội dung tiêu chí kiểm soát</span>
                  <span style={{ textAlign: 'right' }}>Mức độ</span>
                </div>

                {/* Danh sách từng dòng tiêu chí dễ đọc, bấm cả dòng để tick */}
                <div style={{ flex: 1, overflowY: 'auto' }}>
                  {displayedCriteria.length === 0 ? (
                    <Empty
                      image={Empty.PRESENTED_IMAGE_SIMPLE}
                      description="Không có tiêu chí nào khớp bộ lọc"
                      style={{ margin: '56px 0' }}
                    />
                  ) : (
                    displayedCriteria.map((c) => {
                      const checked = selectedSet.has(c.id)
                      const isOtherCompany = c.groupCompanyId !== null && c.groupCompanyId !== companyId

                      return (
                        <div
                          key={c.id}
                          onClick={() => toggleIds([c.id], !checked)}
                          style={{
                            padding: '11px 18px',
                            borderBottom: '1px solid rgba(15, 23, 42, 0.05)',
                            background: checked ? 'rgba(239, 246, 255, 0.85)' : 'transparent',
                            cursor: 'pointer',
                            display: 'grid',
                            gridTemplateColumns: '36px 120px 1fr 100px',
                            alignItems: 'center',
                            gap: 12,
                            transition: 'background-color 0.12s ease',
                          }}
                        >
                          <Checkbox
                            checked={checked}
                            onClick={(e) => e.stopPropagation()}
                            onChange={(e) => toggleIds([c.id], e.target.checked)}
                          />

                          <div>
                            <span className="code-tag--blue">{c.code}</span>
                          </div>

                          <div style={{ minWidth: 0 }}>
                            <div
                              style={{
                                fontSize: 13.5,
                                fontWeight: checked ? 600 : 500,
                                color: '#0f172a',
                                lineHeight: 1.4,
                              }}
                            >
                              {c.name}
                              {!c.active && (
                                <Tag color="default" style={{ marginLeft: 8, fontSize: 11 }}>
                                  Đã ngưng
                                </Tag>
                              )}
                              {isOtherCompany && (
                                <Tag color="warning" style={{ marginLeft: 8, fontSize: 11 }}>
                                  Khác công ty
                                </Tag>
                              )}
                            </div>
                            {(activeGroupId === 'ALL' || c.checkMethod) && (
                              <div
                                style={{
                                  fontSize: 12,
                                  color: '#64748b',
                                  marginTop: 2,
                                  overflow: 'hidden',
                                  textOverflow: 'ellipsis',
                                  whiteSpace: 'nowrap',
                                }}
                              >
                                {activeGroupId === 'ALL' && c.groupName ? `[${c.groupName}] ` : ''}
                                {c.checkMethod ?? ''}
                              </div>
                            )}
                          </div>

                          <div style={{ textAlign: 'right' }}>
                            <ImpactTag value={c.baseImpact} />
                          </div>
                        </div>
                      )
                    })
                  )}
                </div>
              </div>
            </div>
          </Flex>
        </Form>
      </Spin>
    </Drawer>
  )
}
