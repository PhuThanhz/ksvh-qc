import axios from 'axios'
import { http } from '@/api/http'

export interface PresignUploadResponse {
  uploadUrl: string
  objectKey: string
  expiresAt: string
}

export const mediaApi = {
  presignUpload: (contentType: string, sizeBytes: number) =>
    http
      .post<PresignUploadResponse>('/media/presign-upload', { contentType, sizeBytes })
      .then((r) => r.data),

  /** PUT thẳng file lên kho ảnh (không qua Spring). Không gắn JWT vào request này. */
  uploadToStorage: (url: string, file: Blob, onProgress?: (percent: number) => void) =>
    axios.put(url, file, {
      headers: { 'Content-Type': file.type },
      onUploadProgress: (e) => {
        if (onProgress && e.total) onProgress(Math.round((e.loaded / e.total) * 100))
      },
    }),
}
