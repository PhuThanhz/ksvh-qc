/**
 * Quản lý hàng đợi tải lên ảnh/video ngoại tuyến bằng IndexedDB.
 * Lưu trữ Blob an toàn trong IndexedDB (thay vì localStorage để tránh tràn bộ nhớ).
 */

export interface QueuedMedia {
  id: string
  inspectionId: number
  criterionId: number
  blob: Blob
  fileName: string
  contentType: string
  createdAt: number
}

const DB_NAME = 'ksvh_qc_offline_media'
const STORE_NAME = 'media_queue'
const DB_VERSION = 1

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined' || !window.indexedDB) {
      reject(new Error('IndexedDB không được hỗ trợ'))
      return
    }
    const req = window.indexedDB.open(DB_NAME, DB_VERSION)
    req.onupgradeneeded = () => {
      const db = req.result
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'id' })
      }
    }
    req.onsuccess = () => resolve(req.result)
    req.onerror = () => reject(req.error)
  })
}

export async function enqueueOfflineMedia(item: QueuedMedia): Promise<void> {
  const db = await openDb()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite')
    tx.objectStore(STORE_NAME).put(item)
    tx.oncomplete = () => resolve()
    tx.onerror = () => reject(tx.error)
  })
}

export async function getQueuedMediaByInspection(inspectionId: number): Promise<QueuedMedia[]> {
  const db = await openDb()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readonly')
    const req = tx.objectStore(STORE_NAME).getAll()
    req.onsuccess = () => {
      const all = (req.result as QueuedMedia[]) || []
      resolve(all.filter((m) => m.inspectionId === inspectionId))
    }
    req.onerror = () => reject(req.error)
  })
}

export async function removeOfflineMedia(id: string): Promise<void> {
  const db = await openDb()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite')
    tx.objectStore(STORE_NAME).delete(id)
    tx.oncomplete = () => resolve()
    tx.onerror = () => reject(tx.error)
  })
}

export async function countQueuedMedia(inspectionId?: number): Promise<number> {
  try {
    const db = await openDb()
    return new Promise((resolve) => {
      const tx = db.transaction(STORE_NAME, 'readonly')
      const req = tx.objectStore(STORE_NAME).getAll()
      req.onsuccess = () => {
        const all = (req.result as QueuedMedia[]) || []
        if (inspectionId !== undefined) {
          resolve(all.filter((m) => m.inspectionId === inspectionId).length)
        } else {
          resolve(all.length)
        }
      }
      req.onerror = () => resolve(0)
    })
  } catch {
    return 0
  }
}
