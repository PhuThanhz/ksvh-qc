import { Dialog, NavBar, Space, Toast } from 'antd-mobile'
import { useEffect } from 'react'
import { useNavigate, useParams } from 'react-router'
import { ExecutionCheckinCard } from '@/features/inspections/components/mobile/ExecutionCheckinCard'
import { ExecutionCriteriaList } from '@/features/inspections/components/mobile/ExecutionCriteriaList'
import { ExecutionHeaderCard } from '@/features/inspections/components/mobile/ExecutionHeaderCard'
import { ExecutionStatusBanner } from '@/features/inspections/components/mobile/ExecutionStatusBanner'
import { ExecutionStickyProgress } from '@/features/inspections/components/mobile/ExecutionStickyProgress'
import { ExecutionSubmitBar } from '@/features/inspections/components/mobile/ExecutionSubmitBar'
import { useInspectionDraft } from '@/features/inspections/hooks/useInspectionDraft'
import { useInspection, useInspectionItems, useInspectionMutations } from '@/features/inspections/hooks/useInspectionData'
import type { InspectionSubmitItemRequest } from '@/features/inspections/inspection.types'
import { LOCATION_STATUS_META } from '@/features/inspections/inspection.types'
import { useGeolocation } from '@/hooks/useGeolocation'

export function InspectionExecutionPage() {
  const { id } = useParams<{ id: string }>()
  const insId = Number(id)
  const navigate = useNavigate()

  const { data: ins, isLoading, refetch } = useInspection(insId)
  const { data: items } = useInspectionItems(insId)
  const { checkin, submit } = useInspectionMutations()
  const { status: geoStatus, fix: geoFix, locate } = useGeolocation()

  const {
    setOverrides,
    isOnline,
    pendingCount,
    isSyncing,
    setCriterionResult,
    setCriterionComment,
    setCriterionEvidence,
    clearDraft,
    getRating,
  } = useInspectionDraft(insId, ins?.status)

  const needsLocation = ins?.status === 'ASSIGNED' && ins.inspectionMode === 'ON_SITE'
  useEffect(() => {
    if (needsLocation && geoStatus === 'idle') locate()
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
      void Dialog.alert({ title: 'Không bắt đầu được phiếu', content: (err as { message?: string })?.message ?? 'Đã xảy ra lỗi' })
    }
  }

  const onQuickPassRemaining = async () => {
    if (!items) return
    const unrated = items.filter((it) => getRating(it).result === 'UNRATED')
    if (unrated.length === 0) return

    const confirmed = await Dialog.confirm({
      title: 'Chấm nhanh hàng loạt',
      content: `Đánh dấu tất cả ${unrated.length} tiêu chí chưa chấm thành "ĐẠT"? Bạn vẫn có thể chỉnh sửa lại sau.`,
      confirmText: 'Đồng ý',
      cancelText: 'Huỷ',
    })

    if (confirmed) {
      setOverrides((prev) => {
        const next = { ...prev }
        for (const it of unrated) next[it.criterionId] = { ...next[it.criterionId], result: 'PASS' }
        return next
      })
      Toast.show({ icon: 'success', content: `Đã đánh dấu ${unrated.length} mục là Đạt` })
    }
  }

  const onSubmitAll = async () => {
    if (!items) return
    if (pendingCount > 0) {
      Toast.show({ content: `Còn ${pendingCount} tệp chờ tải lên. Vui lòng kết nối mạng và chờ hoàn tất.`, position: 'bottom' })
      return
    }
    const submitItems: InspectionSubmitItemRequest[] = []
    for (const it of items) {
      const r = getRating(it)
      if (r.result === 'UNRATED') {
        Toast.show({ content: `Vui lòng chấm tiêu chí: ${it.criterionName}`, position: 'bottom' })
        return
      }
      if (r.result === 'FAIL' && (!r.comment?.trim() || !r.evidenceUrls?.trim())) {
        Toast.show({ content: `Không đạt phải có mô tả và bằng chứng: ${it.criterionName}`, position: 'bottom' })
        return
      }
      if (r.result === 'NA' && !r.comment?.trim()) {
        Toast.show({ content: `N/A phải ghi rõ lý do: ${it.criterionName}`, position: 'bottom' })
        return
      }
      submitItems.push({ criterionId: it.criterionId, result: r.result, comment: r.comment?.trim() || undefined, evidenceUrls: r.evidenceUrls?.trim() || undefined })
    }

    try {
      await submit.mutateAsync({ id: insId, body: { items: submitItems } })
      clearDraft()
      Toast.show({ icon: 'success', content: 'Nộp phiếu chấm thành công!' })
      navigate('/qc')
    } catch (err: unknown) {
      Toast.show({ content: (err as { message?: string })?.message ?? 'Lỗi khi nộp phiếu', position: 'bottom' })
    }
  }

  if (isLoading || !ins) return <div style={{ padding: 24, textAlign: 'center' }}>Đang tải thông tin phiếu chấm...</div>

  const totalCriteria = items?.length ?? 0
  const ratedCount = items?.filter((it) => getRating(it).result !== 'UNRATED').length ?? 0
  const failCount = items?.filter((it) => getRating(it).result === 'FAIL').length ?? 0
  const passCount = items?.filter((it) => getRating(it).result === 'PASS').length ?? 0
  const naCount = items?.filter((it) => getRating(it).result === 'NA').length ?? 0
  const progressPercent = totalCriteria > 0 ? Math.round((ratedCount / totalCriteria) * 100) : 0
  const gpsString = geoFix ? `GPS ${geoFix.lat.toFixed(6)}, ${geoFix.lng.toFixed(6)}` : undefined

  return (
    <div style={{ paddingBottom: 80, minHeight: '100vh', background: 'var(--app-surface-sunken)' }}>
      <NavBar onBack={() => navigate('/qc')}>{ins.code}</NavBar>

      {ins.status === 'IN_PROGRESS' && (
        <ExecutionStickyProgress
          ratedCount={ratedCount}
          totalCriteria={totalCriteria}
          progressPercent={progressPercent}
          passCount={passCount}
          failCount={failCount}
          naCount={naCount}
        />
      )}

      <div style={{ padding: 12 }}>
        <ExecutionStatusBanner
          isOnline={isOnline}
          pendingCount={pendingCount}
          isSyncing={isSyncing}
          status={ins.status}
          cancelReason={ins.cancelReason}
        />

        <ExecutionHeaderCard
          inspection={ins}
          totalCriteria={totalCriteria}
          ratedCount={ratedCount}
          passCount={passCount}
          failCount={failCount}
          naCount={naCount}
          progressPercent={progressPercent}
          onQuickPassRemaining={onQuickPassRemaining}
        />

        {ins.status === 'ASSIGNED' ? (
          <ExecutionCheckinCard
            isRemote={ins.inspectionMode === 'REMOTE'}
            geoFix={geoFix}
            geoStatus={geoStatus}
            isPending={checkin.isPending}
            onCheckin={onPerformCheckin}
          />
        ) : (
          <Space direction="vertical" block>
            <ExecutionCriteriaList
              items={items}
              totalCriteria={totalCriteria}
              ratedCount={ratedCount}
              failCount={failCount}
              insId={insId}
              inspectorName={ins.inspectorName}
              restaurantName={ins.restaurantName}
              gpsCoords={gpsString}
              readOnly={ins.status !== 'IN_PROGRESS'}
              getRating={getRating}
              onSetResult={setCriterionResult}
              onSetComment={setCriterionComment}
              onSetEvidence={setCriterionEvidence}
            />
          </Space>
        )}
      </div>

      {ins.status === 'IN_PROGRESS' && (
        <ExecutionSubmitBar
          pendingCount={pendingCount}
          isPending={submit.isPending}
          ratedCount={ratedCount}
          totalCriteria={totalCriteria}
          onSubmit={onSubmitAll}
        />
      )}
    </div>
  )
}
