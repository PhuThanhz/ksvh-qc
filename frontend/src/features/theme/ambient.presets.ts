import type { AmbientPreset } from './ambient.types'

export const BITRIX_CYBER_GRADIENT = `
  radial-gradient(ellipse at 88% 28%, rgba(0, 180, 255, 0.45) 0px, transparent 40%),
  radial-gradient(ellipse at 78% 68%, rgba(140, 45, 255, 0.5) 0px, transparent 48%),
  radial-gradient(ellipse at 20% 20%, rgba(90, 30, 210, 0.4) 0px, transparent 45%),
  radial-gradient(circle at 85% 45%, rgba(0, 245, 212, 0.3) 0px, transparent 35%),
  radial-gradient(circle at 10% 80%, rgba(67, 97, 238, 0.35) 0px, transparent 40%),
  linear-gradient(135deg, #170d35 0%, #101038 35%, #0c1445 70%, #150930 100%)
`

export const DEFAULT_AURA_GRADIENT = BITRIX_CYBER_GRADIENT

export const AMBIENT_PRESETS: readonly AmbientPreset[] = [
  {
    id: 'bitrix-cyber',
    name: 'Cosmic Cyber (Mặc định)',
    category: 'aura',
    thumbnail: 'https://images.unsplash.com/photo-1550684848-fac1c5b4e853?auto=format&fit=crop&w=400&q=75',
    gradient: BITRIX_CYBER_GRADIENT,
  },
  {
    id: 'sequoia',
    name: 'Apple Sequoia Aura (Sáng nhẹ)',
    category: 'aura',
    thumbnail: 'https://images.unsplash.com/photo-1557683316-973673baf926?auto=format&fit=crop&w=400&q=75',
    gradient: `
      radial-gradient(at 0% 0%, rgba(0, 113, 227, 0.22) 0px, transparent 55%),
      radial-gradient(at 0% 100%, rgba(99, 102, 241, 0.2) 0px, transparent 50%),
      radial-gradient(at 100% 0%, rgba(236, 72, 153, 0.16) 0px, transparent 50%),
      radial-gradient(at 50% 40%, rgba(56, 189, 248, 0.15) 0px, transparent 60%),
      radial-gradient(at 100% 100%, rgba(168, 85, 247, 0.2) 0px, transparent 55%),
      #eef1f6
    `,
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
  {
    id: 'sahara-sunset',
    name: 'Sa mạc hoàng hôn Sahara',
    category: 'wallpaper',
    thumbnail: 'https://images.unsplash.com/photo-1509316975850-ff9c5deb0cd9?auto=format&fit=crop&w=400&q=75',
    imageUrl: 'https://images.unsplash.com/photo-1509316975850-ff9c5deb0cd9?auto=format&fit=crop&w=2400&q=85',
  },
  {
    id: 'golden-gate',
    name: 'Cầu Cổng Vàng San Francisco',
    category: 'wallpaper',
    thumbnail: 'https://images.unsplash.com/photo-1501594907352-04cda38ebc29?auto=format&fit=crop&w=400&q=75',
    imageUrl: 'https://images.unsplash.com/photo-1501594907352-04cda38ebc29?auto=format&fit=crop&w=2400&q=85',
  },
  {
    id: 'tropical-waterfall',
    name: 'Thác nước Bali yên bình',
    category: 'wallpaper',
    thumbnail: 'https://images.unsplash.com/photo-1432405972618-c60b0225b8f9?auto=format&fit=crop&w=400&q=75',
    imageUrl: 'https://images.unsplash.com/photo-1432405972618-c60b0225b8f9?auto=format&fit=crop&w=2400&q=85',
  },
  {
    id: 'sonoma-horizon',
    name: 'macOS Sonoma Horizon',
    category: 'wallpaper',
    thumbnail: 'https://images.unsplash.com/photo-1579546929518-9e396f3cc809?auto=format&fit=crop&w=400&q=75',
    imageUrl: 'https://images.unsplash.com/photo-1579546929518-9e396f3cc809?auto=format&fit=crop&w=2400&q=85',
  },
  {
    id: 'milky-way',
    name: 'Dải ngân hà huyền ảo',
    category: 'wallpaper',
    thumbnail: 'https://images.unsplash.com/photo-1506703719100-a0f3a48c0f86?auto=format&fit=crop&w=400&q=75',
    imageUrl: 'https://images.unsplash.com/photo-1506703719100-a0f3a48c0f86?auto=format&fit=crop&w=2400&q=85',
  },
  {
    id: 'manhattan-dusk',
    name: 'Manhattan New York lên đèn',
    category: 'wallpaper',
    thumbnail: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=400&q=75',
    imageUrl: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=2400&q=85',
  },
  {
    id: 'lake-moraine',
    name: 'Hồ Moraine dãy Rockies',
    category: 'wallpaper',
    thumbnail: 'https://images.unsplash.com/photo-1503614472-8c93d56e92ce?auto=format&fit=crop&w=400&q=75',
    imageUrl: 'https://images.unsplash.com/photo-1503614472-8c93d56e92ce?auto=format&fit=crop&w=2400&q=85',
  },
  {
    id: 'kyoto-autumn',
    name: 'Mùa thu lá đỏ Kyoto',
    category: 'wallpaper',
    thumbnail: 'https://images.unsplash.com/photo-1476820865390-c52aeebb9891?auto=format&fit=crop&w=400&q=75',
    imageUrl: 'https://images.unsplash.com/photo-1476820865390-c52aeebb9891?auto=format&fit=crop&w=2400&q=85',
  },
  {
    id: 'abstract-fluid',
    name: 'Nghệ thuật sóng 3D trừu tượng',
    category: 'wallpaper',
    thumbnail: 'https://images.unsplash.com/photo-1550684848-fac1c5b4e853?auto=format&fit=crop&w=400&q=75',
    imageUrl: 'https://images.unsplash.com/photo-1550684848-fac1c5b4e853?auto=format&fit=crop&w=2400&q=85',
  },
  {
    id: 'diamond-beach',
    name: 'Băng tuyết Diamond Beach',
    category: 'wallpaper',
    thumbnail: 'https://images.unsplash.com/photo-1517411032315-54ef2cb783bb?auto=format&fit=crop&w=400&q=75',
    imageUrl: 'https://images.unsplash.com/photo-1517411032315-54ef2cb783bb?auto=format&fit=crop&w=2400&q=85',
  },
]
