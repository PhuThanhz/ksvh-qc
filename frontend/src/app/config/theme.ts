import type { ThemeConfig } from 'antd'

/** Màu sắc thương hiệu trung tính Obsidian / Dark Slate: phối hợp hài hoà với mọi màu nền */
export const BRAND_PRIMARY = '#0f172a'

export const antdTheme: ThemeConfig = {
  token: {
    colorPrimary: BRAND_PRIMARY,
    colorInfo: BRAND_PRIMARY,
    colorSuccess: '#34c759',
    colorWarning: '#ff9500',
    colorError: '#ff3b30',
    colorTextBase: '#1d1d1f',
    colorTextSecondary: '#6e6e73',
    colorBorder: 'rgba(0, 0, 0, 0.08)',
    colorBorderSecondary: 'rgba(0, 0, 0, 0.04)',
    colorBgLayout: 'transparent',
    colorBgContainer: '#ffffff',
    borderRadius: 8,
    fontFamily:
      'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
  },
  components: {
    Card: {
      colorBorderSecondary: 'rgba(0, 0, 0, 0.06)',
      boxShadowTertiary: '0 1px 2px rgba(0, 0, 0, 0.02), 0 4px 16px -2px rgba(0, 0, 0, 0.04)',
    },
    Table: {
      headerBg: '#fafafc',
      headerColor: '#6e6e73',
      borderColor: 'rgba(0, 0, 0, 0.05)',
      rowHoverBg: 'rgba(0, 0, 0, 0.03)',
    },
    Button: {
      fontWeight: 500,
    },
    Layout: {
      bodyBg: 'transparent',
      headerBg: 'transparent',
      siderBg: 'transparent',
    },
  },
}
