import { useMemo } from 'react'
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
        transition: 'background 0.5s ease',
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
              transition: 'background-image 0.5s ease-in-out',
            }}
          />
          <div
            style={{
              position: 'absolute',
              inset: 0,
              background: 'rgba(248, 250, 252, 0.72)',
              backdropFilter: 'blur(10px)',
              WebkitBackdropFilter: 'blur(10px)',
            }}
          />
        </>
      )}
    </div>
  )
}
