import type { ThemeConfig } from 'antd'

/** Màu sắc thương hiệu chuẩn Enterprise Operations: Sky / Blue (#0284c7) */
export const BRAND_PRIMARY = '#0284c7'

export const antdTheme: ThemeConfig = {
  token: {
    colorPrimary: BRAND_PRIMARY,
    colorInfo: BRAND_PRIMARY,
    colorSuccess: '#16a34a',
    colorWarning: '#f59e0b',
    colorError: '#dc2626',
    colorTextBase: '#0f172a',
    colorTextSecondary: '#475569',
    colorBorder: '#e2e8f0',
    colorBorderSecondary: '#f1f5f9',
    colorBgLayout: '#f8fafc',
    colorBgContainer: '#ffffff',
    borderRadius: 8,
    fontFamily:
      'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
  },
  components: {
    Card: {
      colorBorderSecondary: '#e2e8f0',
      boxShadowTertiary: '0 1px 3px 0 rgba(0, 0, 0, 0.04), 0 1px 2px -1px rgba(0, 0, 0, 0.04)',
    },
    Table: {
      headerBg: '#f8fafc',
      headerColor: '#475569',
      borderColor: '#f1f5f9',
      rowHoverBg: '#f8fafc',
    },
    Button: {
      fontWeight: 500,
    },
    Layout: {
      bodyBg: '#f8fafc',
      headerBg: '#ffffff',
      siderBg: '#0f172a',
    },
  },
}
