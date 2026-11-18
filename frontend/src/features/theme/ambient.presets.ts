import type { AmbientPreset } from './ambient.types'

export const CLEAN_LIGHT_GRADIENT = `
  radial-gradient(at 0% 0%, rgba(37, 99, 235, 0.04) 0px, transparent 50%),
  radial-gradient(at 100% 0%, rgba(99, 102, 241, 0.03) 0px, transparent 50%),
  #f8fafc
`

export const SEQUOIA_LIGHT_GRADIENT = `
  radial-gradient(at 0% 0%, rgba(0, 113, 227, 0.12) 0px, transparent 55%),
  radial-gradient(at 0% 100%, rgba(99, 102, 241, 0.10) 0px, transparent 50%),
  radial-gradient(at 100% 0%, rgba(236, 72, 153, 0.08) 0px, transparent 50%),
  radial-gradient(at 50% 40%, rgba(56, 189, 248, 0.08) 0px, transparent 60%),
  radial-gradient(at 100% 100%, rgba(168, 85, 247, 0.10) 0px, transparent 55%),
  #f1f5f9
`

export const AZURE_LIGHT_GRADIENT = `
  radial-gradient(at 0% 0%, rgba(2, 132, 199, 0.08) 0px, transparent 50%),
  radial-gradient(at 100% 100%, rgba(14, 165, 233, 0.06) 0px, transparent 50%),
  #f0f9ff
`

export const EMERALD_LIGHT_GRADIENT = `
  radial-gradient(at 0% 0%, rgba(16, 185, 129, 0.08) 0px, transparent 50%),
  radial-gradient(at 100% 100%, rgba(5, 150, 105, 0.06) 0px, transparent 50%),
  #f0fdf4
`

export const SLATE_MINIMAL_GRADIENT = `
  linear-gradient(180deg, #f8fafc 0%, #f1f5f9 100%)
`

export const BITRIX_CYBER_GRADIENT = `
  radial-gradient(ellipse at 88% 28%, rgba(0, 180, 255, 0.45) 0px, transparent 40%),
  radial-gradient(ellipse at 78% 68%, rgba(140, 45, 255, 0.5) 0px, transparent 48%),
  radial-gradient(ellipse at 20% 20%, rgba(90, 30, 210, 0.4) 0px, transparent 45%),
  radial-gradient(circle at 85% 45%, rgba(0, 245, 212, 0.3) 0px, transparent 35%),
  radial-gradient(circle at 10% 80%, rgba(67, 97, 238, 0.35) 0px, transparent 40%),
  linear-gradient(135deg, #170d35 0%, #101038 35%, #0c1445 70%, #150930 100%)
`

export const DEFAULT_AURA_GRADIENT = CLEAN_LIGHT_GRADIENT

export const AMBIENT_PRESETS: readonly AmbientPreset[] = [
  {
    id: 'clean-light',
    name: 'Sáng tinh gọn (Mặc định)',
    category: 'aura',
    thumbnail: 'https://images.unsplash.com/photo-1557683316-973673baf926?auto=format&fit=crop&w=200&q=65&fm=webp',
    gradient: CLEAN_LIGHT_GRADIENT,
  },
  {
    id: 'sequoia',
    name: 'Apple Sequoia Aura (Sáng nhẹ)',
    category: 'aura',
    thumbnail: 'https://images.unsplash.com/photo-1557683316-973673baf926?auto=format&fit=crop&w=200&q=65&fm=webp',
    gradient: SEQUOIA_LIGHT_GRADIENT,
  },
  {
    id: 'azure-soft',
    name: 'Xanh lam thanh thoát',
    category: 'aura',
    thumbnail: 'https://images.unsplash.com/photo-1518837695005-2083093ee35b?auto=format&fit=crop&w=200&q=65&fm=webp',
    gradient: AZURE_LIGHT_GRADIENT,
  },
  {
    id: 'emerald-light',
    name: 'Xanh lục dịu mắt',
    category: 'aura',
    thumbnail: 'https://images.unsplash.com/photo-1448375240586-882707db888b?auto=format&fit=crop&w=200&q=65&fm=webp',
    gradient: EMERALD_LIGHT_GRADIENT,
  },
  {
    id: 'slate-minimal',
    name: 'Xám Slate tối giản',
    category: 'aura',
    thumbnail: 'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?auto=format&fit=crop&w=200&q=65&fm=webp',
    gradient: SLATE_MINIMAL_GRADIENT,
  },
  {
    id: 'bitrix-cyber',
    name: 'Cosmic Cyber (Tối)',
    category: 'aura',
    thumbnail: 'https://images.unsplash.com/photo-1550684848-fac1c5b4e853?auto=format&fit=crop&w=200&q=65&fm=webp',
    gradient: BITRIX_CYBER_GRADIENT,
  },
]
