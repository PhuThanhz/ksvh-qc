import { useEffect, useMemo } from 'react'
import { AMBIENT_PRESETS, DEFAULT_AURA_GRADIENT } from '@/features/theme/ambient.presets'
import { useAmbientStore } from '@/features/theme/ambient.store'

// Bộ nhớ cache lưu ảnh mờ dạng DataURL để không phải tính lại
const blurDataUrlCache = new Map<string, string>()

/**
 * Tạo ảnh mờ nhẹ 1 lần bằng HTML Canvas ngầm (downscaled 160x90).
 * Cho hiệu ứng kính mờ Bitrix Glass tự nhiên, siêu mượt 60-120 FPS, 0% GPU backdrop-filter.
 */
function createPreBlurredImage(src: string): Promise<string> {
  if (blurDataUrlCache.has(src)) {
    return Promise.resolve(blurDataUrlCache.get(src)!)
  }
  return new Promise((resolve) => {
    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.onload = () => {
      try {
        const canvas = document.createElement('canvas')
        canvas.width = 160
        canvas.height = 90
        const ctx = canvas.getContext('2d')
        if (!ctx) return resolve(src)
        ctx.filter = 'blur(6px)'
        ctx.drawImage(img, 0, 0, 160, 90)
        const dataUrl = canvas.toDataURL('image/jpeg', 0.65)
        blurDataUrlCache.set(src, dataUrl)
        resolve(dataUrl)
      } catch {
        resolve(src)
      }
    }
    img.onerror = () => resolve(src)
    img.src = src
  })
}

export function AmbientCanvas() {
  const currentThemeId = useAmbientStore((s) => s.currentThemeId)
  const customImageUrl = useAmbientStore((s) => s.customImageUrl)

  const activeTheme = useMemo(() => {
    if (currentThemeId === 'custom' && customImageUrl) {
      return {
        isImage: true,
        imageUrl: customImageUrl,
        gradient: '',
      }
    }
    const fallback = AMBIENT_PRESETS[0]!
    const found = AMBIENT_PRESETS.find((p) => p.id === currentThemeId) ?? fallback
    return {
      isImage: Boolean(found.imageUrl),
      imageUrl: found.imageUrl ?? '',
      gradient: found.gradient ?? DEFAULT_AURA_GRADIENT,
    }
  }, [currentThemeId, customImageUrl])

  // Cập nhật biến CSS toàn cục để Header và Sidebar dùng chung lớp ảnh mờ cố định
  useEffect(() => {
    const root = document.documentElement
    if (activeTheme.isImage && activeTheme.imageUrl) {
      root.style.setProperty('--ambient-bg-image', `url("${activeTheme.imageUrl}")`)
      createPreBlurredImage(activeTheme.imageUrl).then((blurredUrl) => {
        root.style.setProperty('--ambient-bg-blur', `url("${blurredUrl}")`)
      })
    } else {
      root.style.setProperty('--ambient-bg-image', 'none')
      root.style.setProperty('--ambient-bg-blur', activeTheme.gradient || DEFAULT_AURA_GRADIENT)
    }
  }, [activeTheme])

  return (
    <div
      aria-hidden="true"
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 0,
        pointerEvents: 'none',
        overflow: 'hidden',
        background: activeTheme.isImage ? '#0f172a' : activeTheme.gradient,
        transform: 'translateZ(0)',
        willChange: 'transform',
        contain: 'strict',
        transition: 'background 0.5s ease',
      }}
    >
      {activeTheme.isImage && (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            backgroundImage: `url("${activeTheme.imageUrl}")`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            transition: 'background-image 0.5s ease-in-out',
          }}
        />
      )}
    </div>
  )
}
