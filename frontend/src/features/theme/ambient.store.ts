import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { AmbientState } from './ambient.types'

export const useAmbientStore = create<AmbientState>()(
  persist(
    (set) => ({
      currentThemeId: 'sequoia',
      customImageUrl: '',
      setTheme: (id: string) => set({ currentThemeId: id }),
      setCustomImageUrl: (url: string) => set({ customImageUrl: url, currentThemeId: 'custom' }),
    }),
    {
      name: 'ksvh-ambient-theme-v2',
    },
  ),
)

