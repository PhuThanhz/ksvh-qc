import imageCompression from 'browser-image-compression'
import { useCallback, useState } from 'react'
import { IMAGE_MAX_DIMENSION_PX, IMAGE_MAX_SIZE_MB } from '@/constants/app.constants'
import { mediaApi } from '@/features/media/api/media.api'
import { addWatermark } from '@/features/media/utils/watermark'
import { getErrorMessage } from '@/lib/http'

export interface CapturedPhoto {
  objectKey: string
  /** URL tạm để xem trước trên máy (thu hồi bằng URL.revokeObjectURL khi không dùng). */
  previewUrl: string
  sizeBytes: number
  takenAt: string
}

export type PhotoStep = 'idle' | 'processing' | 'uploading' | 'done' | 'error'

/**
 * Xử lý ảnh từ <input type="file" accept="image/*" capture="environment">:
 * nén → đóng dấu thông tin → xin presigned URL → PUT thẳng lên kho ảnh.
 */
export function usePhotoCapture() {
  const [step, setStep] = useState<PhotoStep>('idle')
  const [progress, setProgress] = useState(0)
  const [error, setError] = useState<string | null>(null)

  const process = useCallback(async (file: File, watermarkLines: string[]): Promise<CapturedPhoto | null> => {
    setError(null)
    setProgress(0)
    try {
      setStep('processing')
      const compressed = await imageCompression(file, {
        maxWidthOrHeight: IMAGE_MAX_DIMENSION_PX,
        maxSizeMB: IMAGE_MAX_SIZE_MB,
        useWebWorker: true,
        fileType: 'image/jpeg',
      })
      const takenAt = new Date()
      const stamped = await addWatermark(compressed, [takenAt.toLocaleString('vi-VN'), ...watermarkLines])

      setStep('uploading')
      const { uploadUrl, objectKey } = await mediaApi.presignUpload({ contentType: stamped.type, sizeBytes: stamped.size })
      await mediaApi.uploadToStorage(uploadUrl, stamped, setProgress)

      setStep('done')
      return { objectKey, previewUrl: URL.createObjectURL(stamped), sizeBytes: stamped.size, takenAt: takenAt.toISOString() }
    } catch (e) {
      setStep('error')
      setError(getErrorMessage(e))
      return null
    }
  }, [])

  return { step, progress, error, process }
}
