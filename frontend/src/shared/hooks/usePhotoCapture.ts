import imageCompression from 'browser-image-compression'
import { useCallback, useState } from 'react'
import { mediaApi } from '@/api/media'
import { addWatermark } from '@/shared/utils/watermark'

export interface CapturedPhoto {
  objectKey: string
  /** URL tạm để hiển thị ảnh xem trước trên máy. */
  previewUrl: string
  sizeBytes: number
  takenAt: string
}

export type PhotoStep = 'idle' | 'processing' | 'uploading' | 'done' | 'error'

/**
 * Xử lý ảnh chụp từ <input type="file" accept="image/*" capture="environment">:
 * nén (~1600px) → đóng dấu thông tin → xin presigned URL → PUT thẳng lên kho ảnh.
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
        maxWidthOrHeight: 1600,
        maxSizeMB: 0.6,
        useWebWorker: true,
        fileType: 'image/jpeg',
      })
      const takenAt = new Date()
      const stamped = await addWatermark(compressed, [takenAt.toLocaleString('vi-VN'), ...watermarkLines])

      setStep('uploading')
      const { uploadUrl, objectKey } = await mediaApi.presignUpload(stamped.type, stamped.size)
      await mediaApi.uploadToStorage(uploadUrl, stamped, setProgress)

      setStep('done')
      return {
        objectKey,
        previewUrl: URL.createObjectURL(stamped),
        sizeBytes: stamped.size,
        takenAt: takenAt.toISOString(),
      }
    } catch (e) {
      setStep('error')
      setError(e instanceof Error ? e.message : 'Không xử lý được ảnh')
      return null
    }
  }, [])

  return { step, progress, error, process }
}
