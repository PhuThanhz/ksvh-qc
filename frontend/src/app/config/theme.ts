import type { ThemeConfig } from 'antd'

/** Màu nhấn chính: xanh dương chuẩn Bitrix/Tailwind đồng bộ web admin và mobile /qc */
export const BRAND_PRIMARY = '#2563eb'

export const antdTheme: ThemeConfig = {
  token: {
    colorPrimary: BRAND_PRIMARY,
    colorInfo: '#0284c7',
    colorSuccess: '#16a34a',
    colorWarning: '#d97706',
    colorError: '#dc2626',

    colorPrimaryBg: 'rgba(37, 99, 235, 0.06)',
    colorPrimaryBgHover: 'rgba(37, 99, 235, 0.10)',
    colorPrimaryBorder: 'rgba(37, 99, 235, 0.20)',
    colorPrimaryBorderHover: 'rgba(37, 99, 235, 0.35)',
    colorPrimaryHover: '#1d4ed8',
    colorPrimaryActive: '#1e40af',

    controlItemBgActive: 'rgba(37, 99, 235, 0.08)',
    controlItemBgActiveHover: 'rgba(37, 99, 235, 0.12)',
    controlItemBgHover: 'rgba(15, 23, 42, 0.04)',
    controlOutline: 'rgba(37, 99, 235, 0.15)',

    colorTextBase: '#0f172a',
    colorTextSecondary: '#475569',
    colorTextPlaceholder: '#64748b',
    colorBorder: 'rgba(15, 23, 42, 0.08)',
    colorBorderSecondary: 'rgba(15, 23, 42, 0.05)',
    colorBgLayout: 'transparent',
    colorBgContainer: '#ffffff',

    borderRadius: 8,
    fontSize: 14,
    controlHeight: 34,
    fontFamily:
      "'Inter Variable', -apple-system, BlinkMacSystemFont, 'SF Pro Text', 'Segoe UI', Roboto, sans-serif",
  },
  components: {
    Card: {
      colorBorderSecondary: 'rgba(15, 23, 42, 0.08)',
      boxShadowTertiary: '0 1px 3px rgba(0, 0, 0, 0.04), 0 4px 16px -2px rgba(0, 0, 0, 0.04)',
      borderRadiusLG: 18,
    },
    Select: {
      optionSelectedBg: 'rgba(37, 99, 235, 0.08)',
      optionSelectedColor: '#2563eb',
      optionActiveBg: 'rgba(15, 23, 42, 0.04)',
      activeBorderColor: '#2563eb',
      hoverBorderColor: '#93c5fd',
    },
    Input: { activeBorderColor: '#2563eb', hoverBorderColor: '#93c5fd' },
    InputNumber: { activeBorderColor: '#2563eb', hoverBorderColor: '#93c5fd' },
    DatePicker: { activeBorderColor: '#2563eb', hoverBorderColor: '#93c5fd' },
    Table: {
      rowSelectedBg: 'rgba(37, 99, 235, 0.05)',
      rowSelectedHoverBg: 'rgba(37, 99, 235, 0.08)',
      headerBg: '#fafafc',
      headerColor: '#475569',
      borderColor: 'rgba(15, 23, 42, 0.06)',
      rowHoverBg: 'rgba(15, 23, 42, 0.03)',
    },
    Button: {
      fontWeight: 500,
      borderRadius: 8,
    },
    Modal: {
      borderRadiusLG: 24,
    },
    Layout: {
      bodyBg: 'transparent',
      headerBg: 'transparent',
      siderBg: 'transparent',
    },
  },
}
