export interface AmbientPreset {
  id: string
  name: string
  category: 'wallpaper' | 'aura'
  thumbnail: string
  imageUrl?: string
  gradient?: string
}

export interface AmbientState {
  currentThemeId: string
  customImageUrl: string
  setTheme: (id: string) => void
  setCustomImageUrl: (url: string) => void
}
