import { useEffect, useMemo } from 'react'
import { AMBIENT_PRESETS, DEFAULT_AURA_GRADIENT } from '@/features/theme/ambient.presets'
import { useAmbientStore } from '@/features/theme/ambient.store'

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

  useEffect(() => {
    const root = document.documentElement
    if (activeTheme.isImage && activeTheme.imageUrl) {
      root.style.setProperty('--ambient-bg-image', `url("${activeTheme.imageUrl}")`)
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
      }}
    >
      {activeTheme.isImage && (
        <>
          <div
            style={{
              position: 'absolute',
              inset: 0,
              backgroundImage: `url("${activeTheme.imageUrl}")`,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
            }}
          />
          {/* Lớp phủ gradient nhẹ trên đỉnh giúp chữ header & page title luôn tương phản cực cao như Shopee Hub */}
          <div
            style={{
              position: 'absolute',
              inset: 0,
              background:
                'linear-gradient(to bottom, rgba(0, 0, 0, 0.42) 0%, rgba(0, 0, 0, 0.22) 35%, rgba(0, 0, 0, 0.12) 100%)',
            }}
          />
        </>
      )}
    </div>
  )
}
