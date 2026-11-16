import type { ThemeConfig } from 'antd'

/** Token giao diện chuẩn Apple macOS Sonoma / Sequoia */
export const BRAND_PRIMARY = '#0071e3'

export const antdTheme: ThemeConfig = {
  token: {
    colorPrimary: BRAND_PRIMARY,
    borderRadius: 8,
    fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", "SF Pro Display", -system-ui, Roboto, sans-serif',
  },
  components: {
    Layout: {
      bodyBg: 'transparent',
      headerBg: 'transparent',
      siderBg: 'transparent',
    },
    Menu: {
      itemBg: 'transparent',
      subMenuItemBg: 'transparent',
      popupBg: 'rgba(255, 255, 255, 0.9)',
    },
  },
}
