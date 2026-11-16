import { FileExcelOutlined, ReloadOutlined } from '@ant-design/icons'
import { Button, Modal, Result, Space, Spin, Steps, Typography } from 'antd'
import { useState } from 'react'
import { ExcelFilePicker } from '@/components/excel/ExcelFilePicker'
import { ImportResultPanel } from '@/components/excel/ImportResultPanel'
import { useNotify } from '@/components/feedback/useNotify'
import type { ImportResult } from '@/types/api.generated'

export interface ExcelImportModalProps {
  open: boolean
  /** Vd "Nhập danh mục tiêu chí". */
  title: string
  /** Tên các sheet trong file mẫu, hiển thị cho người dùng. */
  sheets?: readonly string[]
  onDownloadTemplate: () => Promise<unknown>
  /** commit=false: chỉ kiểm tra. */
  onUpload: (file: File, commit: boolean) => Promise<ImportResult>
  onImported?: (result: ImportResult) => void
  onClose: () => void
  /** Trích thông báo lỗi từ lỗi API (getErrorMessage của lib/http). */
  errorMessage: (err: unknown) => string
}

type Phase = 'pick' | 'review' | 'done'

/** Nhập Excel 3 bước: chọn file → kiểm tra (không ghi) → xác nhận ghi. */
export function ExcelImportModal(props: ExcelImportModalProps) {
  const { open, title, sheets, onDownloadTemplate, onUpload, onImported, onClose, errorMessage } = props
  const notify = useNotify()
  const [phase, setPhase] = useState<Phase>('pick')
  const [file, setFile] = useState<File>()
  const [result, setResult] = useState<ImportResult>()
  const [busy, setBusy] = useState<'template' | 'validate' | 'commit'>()

  const reset = () => {
    setPhase('pick')
    setFile(undefined)
    setResult(undefined)
  }
  const close = () => {
    if (busy === 'commit') return
    reset()
    onClose()
  }

  const run = async <T,>(kind: 'template' | 'validate' | 'commit', fn: () => Promise<T>) => {
    setBusy(kind)
    try {
      return await fn()
    } catch (err) {
      notify.error(errorMessage(err))
      return undefined
    } finally {
      setBusy(undefined)
    }
  }

  const validate = async (f: File) => {
    setFile(f)
    const r = await run('validate', () => onUpload(f, false))
    if (r) {
      setResult(r)
      setPhase('review')
    }
  }

  const commit = async () => {
    if (!file) return
    const r = await run('commit', () => onUpload(file, true))
    if (!r) return
    setResult(r)
    if (r.committed) {
      setPhase('done')
      onImported?.(r)
    } else {
      notify.error('Dữ liệu đã thay đổi trong lúc kiểm tra, vui lòng xem lại lỗi')
    }
  }

  const canCommit = phase === 'review' && result && result.errors.length === 0 && result.totalRows > 0
  const footer =
    phase === 'pick' ? (
      <Button onClick={close}>Huỷ</Button>
    ) : phase === 'review' ? (
      <Space>
        <Button icon={<ReloadOutlined />} onClick={reset} disabled={busy === 'commit'}>
          Chọn file khác
        </Button>
        <Button type="primary" icon={<FileExcelOutlined />} disabled={!canCommit} loading={busy === 'commit'} onClick={() => void commit()}>
          {canCommit ? `Nhập dữ liệu (${result.created + result.updated} dòng)` : 'Nhập dữ liệu'}
        </Button>
      </Space>
    ) : (
      <Button type="primary" onClick={close}>
        Hoàn tất
      </Button>
    )

  return (
    <Modal
      open={open}
      title={title}
      width={880}
      centered
      footer={footer}
      onCancel={close}
      mask={{ closable: false }}
      destroyOnHidden
      styles={{ body: { maxHeight: 'calc(100vh - 220px)', overflowY: 'auto', overflowX: 'hidden', paddingTop: 8 } }}
    >
      <Steps
        size="small"
        current={phase === 'pick' ? 0 : phase === 'review' ? 1 : 2}
        style={{ margin: '8px 0 20px' }}
        items={[{ title: 'Chọn file' }, { title: 'Kiểm tra dữ liệu' }, { title: 'Hoàn tất' }]}
      />
      {phase === 'pick' && (
        <Spin spinning={busy === 'validate'} description="Đang kiểm tra file…">
          <ExcelFilePicker
            sheets={sheets}
            downloading={busy === 'template'}
            validating={busy === 'validate'}
            onDownloadTemplate={() => void run('template', onDownloadTemplate)}
            onPick={(f) => void validate(f)}
            onInvalid={(m) => notify.error(m)}
          />
        </Spin>
      )}
      {phase === 'review' && result && file && (
        <>
          <Typography.Paragraph type="secondary" style={{ marginBottom: 12 }}>
            File: <Typography.Text strong>{file.name}</Typography.Text>
          </Typography.Paragraph>
          <ImportResultPanel result={result} fileName={file.name} />
        </>
      )}
      {phase === 'done' && result && (
        <Result
          status="success"
          title="Đã nhập dữ liệu thành công"
          subTitle={`Thêm mới ${result.created} · Cập nhật ${result.updated} bản ghi từ file ${file?.name ?? ''}`}
        />
      )}
    </Modal>
  )
}
