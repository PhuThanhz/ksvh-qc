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
    colorLink: '#0f172a',
    colorLinkHover: '#2563eb',
    colorLinkActive: '#1e40af',

    colorPrimaryBg: 'rgba(37, 99, 235, 0.06)',
    colorPrimaryBgHover: 'rgba(37, 99, 235, 0.10)',
    colorPrimaryBorder: 'rgba(37, 99, 235, 0.20)',
    colorPrimaryBorderHover: 'rgba(37, 99, 235, 0.35)',
    colorPrimaryHover: '#1d4ed8',
    colorPrimaryActive: '#1e40af',

    controlItemBgActive: 'rgba(37, 99, 235, 0.08)',
    controlItemBgActiveHover: 'rgba(37, 99, 235, 0.12)',
    controlItemBgHover: 'rgba(15, 23, 42, 0.04)',
    controlOutline: 'rgba(100, 116, 139, 0.15)',

    colorTextBase: '#0f172a',
    colorTextSecondary: '#475569',
    colorTextPlaceholder: '#94a3b8',
    colorBorder: 'rgba(15, 23, 42, 0.08)',
    colorBorderSecondary: 'rgba(15, 23, 42, 0.05)',
    colorBgLayout: 'transparent',
    colorBgContainer: '#ffffff',

    borderRadius: 8,
    fontSize: 14,
    controlHeight: 36,
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
      activeBorderColor: '#94a3b8',
      hoverBorderColor: '#cbd5e1',
    },
    Input: { activeBorderColor: '#94a3b8', hoverBorderColor: '#cbd5e1' },
    InputNumber: { activeBorderColor: '#94a3b8', hoverBorderColor: '#cbd5e1' },
    DatePicker: { activeBorderColor: '#94a3b8', hoverBorderColor: '#cbd5e1' },
    Table: {
      rowSelectedBg: 'rgba(37, 99, 235, 0.05)',
      rowSelectedHoverBg: 'rgba(37, 99, 235, 0.08)',
      headerBg: '#fafafc',
      headerColor: '#475569',
      borderColor: 'rgba(15, 23, 42, 0.06)',
      rowHoverBg: 'rgba(15, 23, 42, 0.03)',
    },
    /**
     * Nút: nguồn style DUY NHẤT (không ghi đè .ant-btn bằng CSS !important).
     * Cao 36px như ô nhập; nút chính xanh đặc có bóng nhẹ; nút phụ viền mảnh.
     */
    Button: {
      fontWeight: 500,
      borderRadius: 8,
      paddingInline: 14,
      primaryColor: '#0f172a',
      primaryShadow: '0 1px 2px rgba(15, 23, 42, 0.18)',
      defaultShadow: 'none',
      dangerShadow: 'none',
    },
    Tabs: {
      itemColor: '#64748b',
      itemHoverColor: '#0f172a',
      itemSelectedColor: '#0f172a',
      itemActiveColor: '#0f172a',
      inkBarColor: 'transparent',
    },
    Segmented: {
      itemSelectedBg: '#ffffff',
      itemSelectedColor: '#0f172a',
      itemColor: '#64748b',
      itemHoverColor: '#0f172a',
      trackBg: 'rgba(15, 23, 42, 0.06)',
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
