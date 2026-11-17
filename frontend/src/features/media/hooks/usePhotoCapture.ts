import imageCompression from 'browser-image-compression'
import { useCallback, useState } from 'react'
import { IMAGE_MAX_DIMENSION_PX, IMAGE_MAX_SIZE_MB } from '@/constants/app.constants'
import { mediaApi } from '@/features/media/api/media.api'
import { enqueueOfflineMedia } from '@/features/media/utils/offline-media-queue'
import { addWatermark } from '@/features/media/utils/watermark'
import { getErrorMessage } from '@/lib/http'

export interface CapturedPhoto {
  objectKey: string
  /** URL tạm để xem trước trên máy (thu hồi bằng URL.revokeObjectURL khi không dùng). */
  previewUrl: string
  sizeBytes: number
  takenAt: string
  isOffline?: boolean
}

export interface OfflineContext {
  inspectionId: number
  criterionId: number
}

export type PhotoStep = 'idle' | 'processing' | 'uploading' | 'done' | 'error'

const MAX_VIDEO_BYTES = 52428800 // 50MB

/**
 * Xử lý ảnh/video từ camera hoặc thư viện:
 * Nếu là ảnh: nén → đóng dấu thông tin.
 * Nếu là video: kiểm tra dung lượng (tối đa 50MB).
 * Tải lên qua presigned URL. Nếu mất mạng, tự động đưa vào hàng đợi IndexedDB.
 */
export function usePhotoCapture() {
  const [step, setStep] = useState<PhotoStep>('idle')
  const [progress, setProgress] = useState(0)
  const [error, setError] = useState<string | null>(null)

  const process = useCallback(
    async (file: File, watermarkLines: string[], ctx?: OfflineContext): Promise<CapturedPhoto | null> => {
      setError(null)
      setProgress(0)
      const isVideo = file.type.startsWith('video/')

      if (isVideo && file.size > MAX_VIDEO_BYTES) {
        setStep('error')
        const err = 'Video vượt quá dung lượng cho phép (tối đa 50MB, ~60 giây)'
        setError(err)
        return null
      }

      try {
        setStep('processing')
        let readyBlob: Blob = file
        if (!isVideo) {
          const compressed = await imageCompression(file, {
            maxWidthOrHeight: IMAGE_MAX_DIMENSION_PX,
            maxSizeMB: IMAGE_MAX_SIZE_MB,
            useWebWorker: true,
            fileType: 'image/jpeg',
          })
          const takenAt = new Date()
          readyBlob = await addWatermark(compressed, [takenAt.toLocaleString('vi-VN'), ...watermarkLines])
        }

        // Kiểm tra kết nối mạng trước khi upload
        if (typeof navigator !== 'undefined' && !navigator.onLine && ctx) {
          const offlineId = `offline_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`
          await enqueueOfflineMedia({
            id: offlineId,
            inspectionId: ctx.inspectionId,
            criterionId: ctx.criterionId,
            blob: readyBlob,
            fileName: file.name,
            contentType: readyBlob.type || file.type,
            createdAt: Date.now(),
          })
          setStep('done')
          return {
            objectKey: `offline:${offlineId}`,
            previewUrl: URL.createObjectURL(readyBlob),
            sizeBytes: readyBlob.size,
            takenAt: new Date().toISOString(),
            isOffline: true,
          }
        }

        setStep('uploading')
        const { uploadUrl, objectKey } = await mediaApi.presignUpload({
          contentType: readyBlob.type || file.type,
          sizeBytes: readyBlob.size,
        })
        await mediaApi.uploadToStorage(uploadUrl, readyBlob, setProgress)

        setStep('done')
        return {
          objectKey,
          previewUrl: URL.createObjectURL(readyBlob),
          sizeBytes: readyBlob.size,
          takenAt: new Date().toISOString(),
        }
      } catch (e) {
        // Nếu lỗi mạng và có ngữ cảnh phiếu chấm -> lưu ngoại tuyến
        if (ctx) {
          try {
            const offlineId = `offline_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`
            await enqueueOfflineMedia({
              id: offlineId,
              inspectionId: ctx.inspectionId,
              criterionId: ctx.criterionId,
              blob: file,
              fileName: file.name,
              contentType: file.type,
              createdAt: Date.now(),
            })
            setStep('done')
            return {
              objectKey: `offline:${offlineId}`,
              previewUrl: URL.createObjectURL(file),
              sizeBytes: file.size,
              takenAt: new Date().toISOString(),
              isOffline: true,
            }
          } catch {
            // Không lưu được IndexedDB
          }
        }
        setStep('error')
        setError(getErrorMessage(e))
        return null
      }
    },
    []
  )

  return { step, progress, error, process }
}
