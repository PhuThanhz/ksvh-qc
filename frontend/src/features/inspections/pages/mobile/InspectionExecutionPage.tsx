import { Button, Card, Dialog, Input, NavBar, Space, Tag, TextArea, Toast } from 'antd-mobile'
import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router'
import { useGeolocation } from '@/hooks/useGeolocation'
import { useInspection, useInspectionItems, useInspectionMutations } from '@/features/inspections/hooks/useInspectionData'
import type { InspectionSubmitItemRequest, ItemResult } from '@/features/inspections/inspection.types'
import { INSPECTION_KIND_LABEL, INSPECTION_MODE_LABEL, LOCATION_STATUS_META } from '@/features/inspections/inspection.types'

interface CriterionRating {
  result: ItemResult
  comment?: string
  evidenceUrls?: string
}

export function InspectionExecutionPage() {
  const { id } = useParams<{ id: string }>()
  const insId = Number(id)
  const navigate = useNavigate()

  const { data: ins, isLoading, refetch } = useInspection(insId)
  const { data: items } = useInspectionItems(insId)
  const { checkin, submit } = useInspectionMutations()
  const { status: geoStatus, fix: geoFix, locate } = useGeolocation()

  const [overrides, setOverrides] = useState<Record<number, Partial<CriterionRating>>>({})

  const needsLocation = ins?.status === 'ASSIGNED' && ins.inspectionMode === 'ON_SITE'
  useEffect(() => {
    if (needsLocation && geoStatus === 'idle') {
      locate()
    }
  }, [needsLocation, geoStatus, locate])

  /** GPS chưa bắt buộc: gửi vị trí nếu có, server ghi nhận khoảng cách / trạng thái, không chặn. */
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
    setOverrides((prev) => ({
      ...prev,
      [critId]: { ...prev[critId], result },
    }))
  }

  const setCriterionComment = (critId: number, comment: string) => {
    setOverrides((prev) => ({
      ...prev,
      [critId]: { ...prev[critId], comment },
    }))
  }

  const setCriterionEvidence = (critId: number, evidenceUrls: string) => {
    setOverrides((prev) => ({
      ...prev,
      [critId]: { ...prev[critId], evidenceUrls },
    }))
  }

  const getRating = (it: { criterionId: number; result?: ItemResult; comment?: string; evidenceUrls?: string }): CriterionRating => {
    const o = overrides[it.criterionId]
    return {
      result: o?.result ?? it.result ?? 'UNRATED',
      comment: o?.comment ?? it.comment ?? '',
      evidenceUrls: o?.evidenceUrls ?? it.evidenceUrls ?? '',
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
      if (r.result === 'FAIL' && !r.comment?.trim()) {
        Toast.show({ content: `Tiêu chí không đạt phải nhập mô tả: ${it.criterionName}`, position: 'bottom' })
        return
      }
      if (r.result === 'FAIL' && !r.evidenceUrls?.trim()) {
        Toast.show({ content: `Tiêu chí không đạt phải có ảnh/video bằng chứng: ${it.criterionName}`, position: 'bottom' })
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
      Toast.show({ icon: 'success', content: 'Nộp phiếu chấm thành công!' })
      navigate('/qc')
    } catch (err: unknown) {
      Toast.show({ content: (err as { message?: string })?.message ?? 'Lỗi khi nộp phiếu', position: 'bottom' })
    }
  }

  if (isLoading || !ins) {
    return <div style={{ padding: 24, textAlign: 'center' }}>Đang tải thông tin phiếu chấm...</div>
  }

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
        </Card>

        {ins.status === 'ASSIGNED' ? (
          <Card title="Bắt đầu kiểm tra" style={{ borderRadius: 10 }}>
            <p style={{ fontSize: 14 }}>
              {ins.inspectionMode === 'REMOTE'
                ? 'Phiếu kiểm tra từ xa: bấm Bắt đầu để mở bảng chấm.'
                : 'Hệ thống ghi nhận vị trí của bạn khi bắt đầu (không bắt buộc có GPS).'}
            </p>
            {ins.inspectionMode === 'REMOTE' ? null : geoFix ? (
              <div style={{ background: '#f6ffed', border: '1px solid #b7eb8f', padding: 10, borderRadius: 8, marginBottom: 12 }}>
                <div>Toạ độ: {geoFix.lat.toFixed(6)}, {geoFix.lng.toFixed(6)}</div>
                <div style={{ fontSize: 12, color: '#52c41a' }}>Độ chính xác: ±{Math.round(geoFix.accuracy)}m</div>
              </div>
            ) : (
              <div style={{ color: '#8c8c8c', marginBottom: 12 }}>
                {geoStatus === 'denied' || geoStatus === 'unavailable' || geoStatus === 'insecure' ? 'Không lấy được vị trí – vẫn có thể bắt đầu, phiếu sẽ ghi "chưa xác minh vị trí".' : 'Đang lấy vị trí…'}
              </div>
            )}
            <Button
              block
              color="primary"
              size="large"
              loading={checkin.isPending}
              onClick={onPerformCheckin}
            >
              Bắt đầu kiểm tra
            </Button>
          </Card>
        ) : (
          <Space direction="vertical" block>
            {items?.map((it, idx) => {
              const current = getRating(it)
              return (
                <Card key={it.id} style={{ borderRadius: 10 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div style={{ fontWeight: 600, fontSize: 14, flex: 1 }}>
                      {idx + 1}. {it.criterionName}
                    </div>
                    <Tag color="default" style={{ marginLeft: 8 }}>Ảnh hưởng {it.baseImpact}/5</Tag>
                  </div>
                  <div style={{ fontSize: 12, color: '#8c8c8c', marginTop: 2 }}>{it.groupName} · {it.criterionCode}</div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8, marginTop: 12 }}>
                    <Button
                      size="small"
                      color={current.result === 'PASS' ? 'success' : 'default'}
                      fill={current.result === 'PASS' ? 'solid' : 'outline'}
                      onClick={() => setCriterionResult(it.criterionId, 'PASS')}
                    >
                      Đạt
                    </Button>
                    <Button
                      size="small"
                      color={current.result === 'FAIL' ? 'danger' : 'default'}
                      fill={current.result === 'FAIL' ? 'solid' : 'outline'}
                      onClick={() => setCriterionResult(it.criterionId, 'FAIL')}
                    >
                      Không đạt
                    </Button>
                    <Button
                      size="small"
                      color={current.result === 'NA' ? 'primary' : 'default'}
                      fill={current.result === 'NA' ? 'solid' : 'outline'}
                      onClick={() => setCriterionResult(it.criterionId, 'NA')}
                    >
                      K/A
                    </Button>
                  </div>

                  {current.result === 'FAIL' && (
                    <div style={{ marginTop: 10, background: '#fff1f0', padding: 8, borderRadius: 6, border: '1px solid #ffa39e' }}>
                      <TextArea
                        placeholder="Mô tả lỗi vi phạm phát hiện (bắt buộc)..."
                        rows={2}
                        value={current.comment}
                        onChange={(val) => setCriterionComment(it.criterionId, val)}
                        style={{ background: '#fff', padding: 6, borderRadius: 4 }}
                      />
                      <Input
                        placeholder="Link ảnh bằng chứng (https://...)"
                        value={current.evidenceUrls}
                        onChange={(val) => setCriterionEvidence(it.criterionId, val)}
                        style={{ background: '#fff', padding: 6, borderRadius: 4, marginTop: 6 }}
                      />
                    </div>
                  )}
                </Card>
              )
            })}
          </Space>
        )}
      </div>

      {ins.status === 'IN_PROGRESS' && (
        <div style={{ position: 'fixed', bottom: 0, left: 0, right: 0, background: '#fff', padding: '10px 16px', borderTop: '1px solid #e8e8e8', zIndex: 100 }}>
          <Button block color="primary" size="large" loading={submit.isPending} onClick={onSubmitAll}>
            Hoàn thành & Nộp phiếu chấm
          </Button>
        </div>
      )}
    </div>
  )
}
