import type { AmbientPreset } from './ambient.types'

export const DEFAULT_AURA_GRADIENT = `
  radial-gradient(at 0% 0%, rgba(2, 132, 199, 0.04) 0px, transparent 50%),
  radial-gradient(at 100% 0%, rgba(99, 102, 241, 0.03) 0px, transparent 50%),
  #f8fafc
`

export const AMBIENT_PRESETS: readonly AmbientPreset[] = [
  {
    id: 'sequoia',
    name: 'Doanh nghiệp chuẩn (Mặc định)',
    category: 'aura',
    thumbnail: 'https://images.unsplash.com/photo-1557683316-973673baf926?auto=format&fit=crop&w=400&q=75',
    gradient: DEFAULT_AURA_GRADIENT,
  },
  {
    id: 'sequoia-flow',
    name: 'macOS Sequoia 3D Flow',
    category: 'wallpaper',
    thumbnail: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=400&q=75',
    imageUrl: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=2400&q=85',
  },
  {
    id: 'alpine-sunset',
    name: 'Núi tuyết hoàng hôn',
    category: 'wallpaper',
    thumbnail: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=400&q=75',
    imageUrl: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=2400&q=85',
  },
  {
    id: 'aurora-night',
    name: 'Cực quang Bắc cực',
    category: 'wallpaper',
    thumbnail: 'https://images.unsplash.com/photo-1531366936337-7c912a4589a7?auto=format&fit=crop&w=400&q=75',
    imageUrl: 'https://images.unsplash.com/photo-1531366936337-7c912a4589a7?auto=format&fit=crop&w=2400&q=85',
  },
  {
    id: 'ocean-swell',
    name: 'Sóng biển sâu thẳm',
    category: 'wallpaper',
    thumbnail: 'https://images.unsplash.com/photo-1518837695005-2083093ee35b?auto=format&fit=crop&w=400&q=75',
    imageUrl: 'https://images.unsplash.com/photo-1518837695005-2083093ee35b?auto=format&fit=crop&w=2400&q=85',
  },
  {
    id: 'fuji-sakura',
    name: 'Fuji & Hoa anh đào',
    category: 'wallpaper',
    thumbnail: 'https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?auto=format&fit=crop&w=400&q=75',
    imageUrl: 'https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?auto=format&fit=crop&w=2400&q=85',
  },
  {
    id: 'tokyo-cyber',
    name: 'Đêm thành phố Tokyo',
    category: 'wallpaper',
    thumbnail: 'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?auto=format&fit=crop&w=400&q=75',
    imageUrl: 'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?auto=format&fit=crop&w=2400&q=85',
  },
  {
    id: 'misty-forest',
    name: 'Rừng thông sương mù',
    category: 'wallpaper',
    thumbnail: 'https://images.unsplash.com/photo-1448375240586-882707db888b?auto=format&fit=crop&w=400&q=75',
    imageUrl: 'https://images.unsplash.com/photo-1448375240586-882707db888b?auto=format&fit=crop&w=2400&q=85',
  },
]
