import type { AmbientPreset } from './ambient.types'

export const CLEAN_LIGHT_GRADIENT = `
  radial-gradient(at 0% 0%, rgba(37, 99, 235, 0.05) 0px, transparent 50%),
  radial-gradient(at 100% 0%, rgba(99, 102, 241, 0.04) 0px, transparent 50%),
  #f8fafc
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
    id: 'day-nui-hoang-hon',
    name: 'Dãy núi hoàng hôn (Shopee Hub)',
    category: 'wallpaper',
    thumbnail: '/backgrounds/day-nui-hoang-hon-thumb.webp',
    imageUrl: '/backgrounds/day-nui-hoang-hon.webp',
  },
  {
    id: 'nui-tuyet-va-may',
    name: 'Núi tuyết và mây',
    category: 'wallpaper',
    thumbnail: '/backgrounds/nui-tuyet-va-may-thumb.webp',
    imageUrl: '/backgrounds/nui-tuyet-va-may.webp',
  },
  {
    id: 'cuc-quang-nui-tuyet',
    name: 'Cực quang núi tuyết',
    category: 'wallpaper',
    thumbnail: '/backgrounds/cuc-quang-nui-tuyet-thumb.webp',
    imageUrl: '/backgrounds/cuc-quang-nui-tuyet.webp',
  },
  {
    id: 'bien-tu-tren-cao',
    name: 'Biển nhìn từ trên cao',
    category: 'wallpaper',
    thumbnail: '/backgrounds/bien-tu-tren-cao-thumb.webp',
    imageUrl: '/backgrounds/bien-tu-tren-cao.webp',
  },
  {
    id: 'rung-thong-suong-mu',
    name: 'Rừng thông sương mù',
    category: 'wallpaper',
    thumbnail: '/backgrounds/rung-thong-suong-mu-thumb.webp',
    imageUrl: '/backgrounds/rung-thong-suong-mu.webp',
  },
  {
    id: 'thanh-pho-ve-dem',
    name: 'Thành phố về đêm',
    category: 'wallpaper',
    thumbnail: '/backgrounds/thanh-pho-ve-dem-thumb.webp',
    imageUrl: '/backgrounds/thanh-pho-ve-dem.webp',
  },
  {
    id: 'troi-sao-tren-nui',
    name: 'Trời sao trên núi',
    category: 'wallpaper',
    thumbnail: '/backgrounds/troi-sao-tren-nui-thumb.webp',
    imageUrl: '/backgrounds/troi-sao-tren-nui.webp',
  },
  {
    id: 'song-hong-tim',
    name: 'Sóng hồng tím',
    category: 'wallpaper',
    thumbnail: '/backgrounds/song-hong-tim-thumb.webp',
    imageUrl: '/backgrounds/song-hong-tim.webp',
  },
  {
    id: 'tim-xanh-dam',
    name: 'Tím xanh đậm',
    category: 'wallpaper',
    thumbnail: '/backgrounds/tim-xanh-dam-thumb.webp',
    imageUrl: '/backgrounds/tim-xanh-dam.webp',
  },
  {
    id: 'xanh-duong-chuyen-sac',
    name: 'Xanh dương chuyển sắc',
    category: 'wallpaper',
    thumbnail: '/backgrounds/xanh-duong-chuyen-sac-thumb.webp',
    imageUrl: '/backgrounds/xanh-duong-chuyen-sac.webp',
  },
  {
    id: 'clean-light',
    name: 'Sáng tinh gọn',
    category: 'aura',
    thumbnail: '/backgrounds/troi-hong-may-nhe-thumb.webp',
    gradient: CLEAN_LIGHT_GRADIENT,
  },
  {
    id: 'bitrix-cyber',
    name: 'Cosmic Cyber',
    category: 'aura',
    thumbnail: '/backgrounds/soi-neon-tim-xanh-thumb.webp',
    gradient: BITRIX_CYBER_GRADIENT,
  },
]
