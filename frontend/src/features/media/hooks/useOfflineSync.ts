import { useCallback, useEffect, useState } from 'react'
import { mediaApi } from '@/features/media/api/media.api'
import {
  countQueuedMedia,
  getQueuedMediaByInspection,
  removeOfflineMedia,
} from '@/features/media/utils/offline-media-queue'

export function useOfflineSync(inspectionId?: number, onSynced?: (criterionId: number, objectKey: string) => void) {
  const [isOnline, setIsOnline] = useState<boolean>(typeof navigator !== 'undefined' ? navigator.onLine : true)
  const [pendingCount, setPendingCount] = useState<number>(0)
  const [isSyncing, setIsSyncing] = useState<boolean>(false)

  const refreshCount = useCallback(async () => {
    const c = await countQueuedMedia(inspectionId)
    setPendingCount(c)
  }, [inspectionId])

  const syncPending = useCallback(async () => {
    if (!inspectionId || !navigator.onLine || isSyncing) return
    try {
      setIsSyncing(true)
      const items = await getQueuedMediaByInspection(inspectionId)
      for (const item of items) {
        try {
          const { uploadUrl, objectKey } = await mediaApi.presignUpload({
            contentType: item.contentType,
            sizeBytes: item.blob.size,
          })
          await mediaApi.uploadToStorage(uploadUrl, item.blob)
          await removeOfflineMedia(item.id)
          onSynced?.(item.criterionId, objectKey)
        } catch {
          break
        }
      }
    } finally {
      setIsSyncing(false)
      const c = await countQueuedMedia(inspectionId)
      setPendingCount(c)
    }
  }, [inspectionId, isSyncing, onSynced])

  useEffect(() => {
    let active = true
    countQueuedMedia(inspectionId).then((c) => {
      if (active) setPendingCount(c)
    })
    const handleOnline = () => {
      setIsOnline(true)
      void syncPending()
    }
    const handleOffline = () => setIsOnline(false)

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)
    return () => {
      active = false
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [inspectionId, syncPending])

  return { isOnline, pendingCount, isSyncing, syncPending, refreshCount }
}
