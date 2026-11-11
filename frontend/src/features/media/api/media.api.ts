import axios from 'axios'
import { UPLOAD_TIMEOUT_MS } from '@/constants/app.constants'
import { api, toApiError } from '@/lib/http'
import type { PresignUploadRequest, PresignUploadResponse } from '@/types/api.generated'

const PATH = { presignUpload: '/media/presign-upload' } as const

export const mediaApi = {
  presignUpload: (body: PresignUploadRequest) =>
    api.post<PresignUploadResponse>(PATH.presignUpload, body).then((r) => r.data),

  /**
   * PUT thẳng file lên kho ảnh qua presigned URL. Dùng axios thuần (không qua `api`)
   * vì URL là của MinIO/S3 và KHÔNG được gắn access token.
   */
  uploadToStorage: (url: string, file: Blob, onProgress?: (percent: number) => void) =>
    axios
      .put(url, file, {
        timeout: UPLOAD_TIMEOUT_MS,
        headers: { 'Content-Type': file.type },
        onUploadProgress: (e) => {
          if (onProgress && e.total) onProgress(Math.round((e.loaded / e.total) * 100))
        },
      })
      .then(() => undefined)
      .catch((err: unknown) => Promise.reject(toApiError(err))),
}
