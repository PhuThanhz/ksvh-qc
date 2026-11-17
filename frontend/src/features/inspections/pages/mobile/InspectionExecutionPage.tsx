import { Button, Card, Dialog, NavBar, ProgressBar, Space, Toast } from 'antd-mobile'
import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router'
import { useGeolocation } from '@/hooks/useGeolocation'
import { useInspection, useInspectionItems, useInspectionMutations } from '@/features/inspections/hooks/useInspectionData'
import { InspectionCriterionCard, type CriterionRating } from '@/features/inspections/components/InspectionCriterionCard'
import type { InspectionSubmitItemRequest, ItemResult } from '@/features/inspections/inspection.types'
import { INSPECTION_KIND_LABEL, INSPECTION_MODE_LABEL, LOCATION_STATUS_META } from '@/features/inspections/inspection.types'

const DRAFT_PREFIX = 'qc_draft_ins_'

export function InspectionExecutionPage() {
  const { id } = useParams<{ id: string }>()
  const insId = Number(id)
  const navigate = useNavigate()

  const { data: ins, isLoading, refetch } = useInspection(insId)
  const { data: items } = useInspectionItems(insId)
  const { checkin, submit } = useInspectionMutations()
  const { status: geoStatus, fix: geoFix, locate } = useGeolocation()

  const [overrides, setOverrides] = useState<Record<number, Partial<CriterionRating>>>(() => {
    try {
      const saved = localStorage.getItem(`${DRAFT_PREFIX}${insId}`)
      return saved ? (JSON.parse(saved) as Record<number, Partial<CriterionRating>>) : {}
    } catch {
      return {}
    }
  })

  // Lưu nháp tự động để Chuyên viên không bị mất dữ liệu khi đổi tab / chụp ảnh
  useEffect(() => {
    if (ins?.status === 'IN_PROGRESS' && Object.keys(overrides).length > 0) {
      try { localStorage.setItem(`${DRAFT_PREFIX}${insId}`, JSON.stringify(overrides)) } catch {}
    } else if (ins?.status && ins.status !== 'IN_PROGRESS' && ins.status !== 'ASSIGNED') {
      try { localStorage.removeItem(`${DRAFT_PREFIX}${insId}`) } catch {}
    }
  }, [overrides, insId, ins?.status])

  const needsLocation = ins?.status === 'ASSIGNED' && ins.inspectionMode === 'ON_SITE'
  useEffect(() => {
    if (needsLocation && geoStatus === 'idle') {
      locate()
    }
  }, [needsLocation, geoStatus, locate])

  const onPerformCheckin = async () => {
    const onSite = ins?.inspectionMode === 'ON_SITE'
    try {
      const res = await checkin.mutateAsync({
        id: insId,
        body: onSite && geoFix ? { latitude: geoFix.lat, longitude: geoFix.lng } : {},
      })
      const status = res.locationStatus ? LOCATION_STATUS_META[res.locationStatus].label : 'Đã bắt đầu'
      Toast.show({ icon: res.locationStatus === 'OUTSIDE_RADIUS' ? undefined : 'success', content: `Bắt đầu kiểm tra · ${status}` })
      void refetch()
    } catch (err: unknown) {
      void Dialog.alert({
        title: 'Không bắt đầu được phiếu',
        content: (err as { message?: string })?.message ?? 'Đã xảy ra lỗi, vui lòng thử lại',
      })
    }
  }

  const setCriterionResult = (critId: number, result: ItemResult) => {
    setOverrides((prev) => ({ ...prev, [critId]: { ...prev[critId], result } }))
  }
  const setCriterionComment = (critId: number, comment: string) => setOverrides((prev) => ({ ...prev, [critId]: { ...prev[critId], comment } }))
  const setCriterionEvidence = (critId: number, evidenceUrls: string) => setOverrides((prev) => ({ ...prev, [critId]: { ...prev[critId], evidenceUrls } }))

  const getRating = (it: { criterionId: number; result?: ItemResult; comment?: string; evidenceUrls?: string }): CriterionRating => {
    const o = overrides[it.criterionId]
    return { result: o?.result ?? it.result ?? 'UNRATED', comment: o?.comment ?? it.comment ?? '', evidenceUrls: o?.evidenceUrls ?? it.evidenceUrls ?? '' }
  }

  const onQuickPassRemaining = async () => {
    if (!items) return
    const unrated = items.filter((it) => getRating(it).result === 'UNRATED')
    if (unrated.length === 0) return

    const confirmed = await Dialog.confirm({
      title: 'Chấm nhanh hàng loạt',
      content: `Đánh dấu tất cả ${unrated.length} tiêu chí chưa chấm thành "ĐẠT"? Bạn vẫn có thể chỉnh sửa lại từng tiêu chí sau đó.`,
      confirmText: 'Đồng ý',
      cancelText: 'Huỷ',
    })

    if (confirmed) {
      setOverrides((prev) => {
        const next = { ...prev }
        for (const it of unrated) {
          next[it.criterionId] = { ...next[it.criterionId], result: 'PASS' }
        }
        return next
      })
      Toast.show({ icon: 'success', content: `Đã đánh dấu ${unrated.length} mục là Đạt` })
    }
  }

  const onSubmitAll = async () => {
    if (!items) return
    const submitItems: InspectionSubmitItemRequest[] = []

    for (const it of items) {
      const r = getRating(it)
      if (r.result === 'UNRATED') {
        Toast.show({ content: `Vui lòng chấm tiêu chí: ${it.criterionName}`, position: 'bottom' })
        return
      }
      if (r.result === 'FAIL' && (!r.comment?.trim() || !r.evidenceUrls?.trim())) {
        Toast.show({ content: `Tiêu chí không đạt phải có mô tả và ảnh bằng chứng: ${it.criterionName}`, position: 'bottom' })
        return
      }
      if (r.result === 'NA' && !r.comment?.trim()) {
        Toast.show({ content: `Tiêu chí N/A phải ghi lý do: ${it.criterionName}`, position: 'bottom' })
        return
      }
      submitItems.push({
        criterionId: it.criterionId,
        result: r.result,
        comment: r.comment?.trim() || undefined,
        evidenceUrls: r.evidenceUrls?.trim() || undefined,
      })
    }

    try {
      await submit.mutateAsync({ id: insId, body: { items: submitItems } })
      localStorage.removeItem(`${DRAFT_PREFIX}${insId}`)
      Toast.show({ icon: 'success', content: 'Nộp phiếu chấm thành công!' })
      navigate('/qc')
    } catch (err: unknown) {
      Toast.show({ content: (err as { message?: string })?.message ?? 'Lỗi khi nộp phiếu', position: 'bottom' })
    }
  }

  if (isLoading || !ins) {
    return <div style={{ padding: 24, textAlign: 'center' }}>Đang tải thông tin phiếu chấm...</div>
  }

  const totalCriteria = items?.length ?? 0
  const ratedCount = items?.filter((it) => getRating(it).result !== 'UNRATED').length ?? 0
  const failCount = items?.filter((it) => getRating(it).result === 'FAIL').length ?? 0
  const passCount = items?.filter((it) => getRating(it).result === 'PASS').length ?? 0
  const naCount = items?.filter((it) => getRating(it).result === 'NA').length ?? 0
  const progressPercent = totalCriteria > 0 ? Math.round((ratedCount / totalCriteria) * 100) : 0

  const gpsString = geoFix ? `GPS ${geoFix.lat.toFixed(6)}, ${geoFix.lng.toFixed(6)}` : undefined

  return (
    <div style={{ paddingBottom: 80, minHeight: '100vh', background: '#f5f5f5' }}>
      <NavBar onBack={() => navigate('/qc')}>{ins.code}</NavBar>

      <div style={{ padding: 12 }}>
        <Card style={{ marginBottom: 12, borderRadius: 10 }}>
          <div style={{ fontWeight: 600, fontSize: 16 }}>{ins.restaurantName}</div>
          <div style={{ fontSize: 13, color: '#8c8c8c', marginTop: 4 }}>
            {INSPECTION_KIND_LABEL[ins.inspectionType]} · {INSPECTION_MODE_LABEL[ins.inspectionMode]}
            {ins.templateName ? ` · Mẫu: ${ins.templateName}` : ''}
            {ins.topicNames.length > 0 ? ` · Chuyên đề: ${ins.topicNames.join(', ')}` : ''}
          </div>
          {ins.status === 'IN_PROGRESS' && totalCriteria > 0 && (
            <div style={{ marginTop: 10 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: '#595959', marginBottom: 4 }}>
                <span>Tiến độ: <b>{ratedCount}/{totalCriteria}</b> ({progressPercent}%)</span>
                <span>{passCount} Đạt · <span style={{ color: '#ff4d4f' }}>{failCount} Lỗi</span> · {naCount} N/A</span>
              </div>
              <ProgressBar percent={progressPercent} />
              {ratedCount < totalCriteria && (
                <div style={{ marginTop: 8, display: 'flex', justifyContent: 'flex-end' }}>
                  <Button
                    size="mini"
                    color="primary"
                    fill="outline"
                    onClick={onQuickPassRemaining}
                  >
                    ✓ Chấm nhanh các mục còn lại là Đạt
                  </Button>
                </div>
              )}
            </div>
          )}
        </Card>

        {ins.status === 'ASSIGNED' ? (
          <Card title="Bắt đầu kiểm tra" style={{ borderRadius: 10 }}>
            <p style={{ fontSize: 14 }}>
              {ins.inspectionMode === 'REMOTE'
                ? 'Phiếu kiểm tra từ xa: bấm Bắt đầu để mở bảng chấm.'
                : 'Hệ thống ghi nhận vị trí của bạn khi bắt đầu (không bắt buộc có GPS).'}
            </p>
            {ins.inspectionMode !== 'REMOTE' && (
              geoFix ? (
                <div style={{ background: '#f6ffed', border: '1px solid #b7eb8f', padding: 10, borderRadius: 8, marginBottom: 12 }}>
                  <div>Toạ độ: {geoFix.lat.toFixed(6)}, {geoFix.lng.toFixed(6)}</div>
                  <div style={{ fontSize: 12, color: '#52c41a' }}>Độ chính xác: ±{Math.round(geoFix.accuracy)}m</div>
                </div>
              ) : (
                <div style={{ color: '#8c8c8c', marginBottom: 12 }}>
                  {geoStatus === 'denied' || geoStatus === 'unavailable' || geoStatus === 'insecure' ? 'Không lấy được vị trí – vẫn có thể bắt đầu, phiếu sẽ ghi "chưa xác minh vị trí".' : 'Đang lấy vị trí…'}
                </div>
              )
            )}
            <Button block color="primary" size="large" loading={checkin.isPending} onClick={onPerformCheckin}>
              Bắt đầu kiểm tra
            </Button>
          </Card>
        ) : (
          <Space direction="vertical" block>
            {ins.status !== 'IN_PROGRESS' && (
              <Card style={{ borderRadius: 10, background: ins.status === 'CANCELLED' ? '#fff1f0' : '#f6ffed', border: `1px solid ${ins.status === 'CANCELLED' ? '#ffa39e' : '#b7eb8f'}` }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: ins.status === 'CANCELLED' ? '#cf1322' : '#389e0d' }}>
                  {ins.status === 'SUBMITTED' && 'Phiếu chấm đã được nộp. Đang trong quy trình xử lý và khắc phục lỗi vi phạm.'}
                  {ins.status === 'COMPLETED' && 'Phiếu chấm đã hoàn thành toàn diện.'}
                  {ins.status === 'CANCELLED' && `Phiếu chấm đã bị huỷ${ins.cancelReason ? `: ${ins.cancelReason}` : ''}.`}
                </div>
              </Card>
            )}
            {items?.map((it, idx) => (
              <InspectionCriterionCard
                key={it.id}
                index={idx + 1}
                item={it}
                rating={getRating(it)}
                onSetResult={(res) => setCriterionResult(it.criterionId, res)}
                onSetComment={(comment) => setCriterionComment(it.criterionId, comment)}
                onSetEvidence={(urls) => setCriterionEvidence(it.criterionId, urls)}
                inspectorName={ins.inspectorName}
                restaurantName={ins.restaurantName}
                gpsCoords={gpsString}
                readOnly={ins.status !== 'IN_PROGRESS'}
              />
            ))}
          </Space>
        )}
      </div>

      {ins.status === 'IN_PROGRESS' && (
        <div style={{ position: 'fixed', bottom: 0, left: 0, right: 0, background: '#fff', padding: '10px 16px', borderTop: '1px solid #e8e8e8', zIndex: 100 }}>
          <Button block color="primary" size="large" loading={submit.isPending} onClick={onSubmitAll}>
            Hoàn thành & Nộp phiếu chấm ({ratedCount}/{totalCriteria})
          </Button>
        </div>
      )}
    </div>
  )
}
