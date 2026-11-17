import type { ThemeConfig } from 'antd'

/** Màu nhấn trung tính (xám đen): nút chính dùng kiểu kính trắng trong global.css, hợp mọi ảnh nền. */
export const BRAND_PRIMARY = '#0f172a'

export const antdTheme: ThemeConfig = {
  token: {
    colorPrimary: BRAND_PRIMARY,
    // Màu thông tin (tag "processing", Alert info, Badge processing) phải là xanh dương: nếu để bằng màu chính xám đen,
    // antd sinh nền tag xám đậm (vd tag "Sắp áp dụng").
    colorInfo: '#2563eb',
    // Khai báo rõ các màu antd tự sinh từ màu chính: với màu chính xám đen, antd sinh ra nền "đang chọn" xám đậm (#626569)
    // làm dòng bảng được chọn, mục đã chọn trong Select, viền ô đang nhập bị đen. Giữ chúng ở mức xám rất nhạt.
    colorPrimaryBg: 'rgba(15, 23, 42, 0.06)',
    colorPrimaryBgHover: 'rgba(15, 23, 42, 0.09)',
    colorPrimaryBorder: 'rgba(15, 23, 42, 0.18)',
    colorPrimaryBorderHover: 'rgba(15, 23, 42, 0.28)',
    colorPrimaryHover: '#334155',
    colorPrimaryActive: '#0f172a',
    controlItemBgActive: 'rgba(15, 23, 42, 0.06)',
    controlItemBgActiveHover: 'rgba(15, 23, 42, 0.09)',
    controlItemBgHover: 'rgba(15, 23, 42, 0.04)',
    controlOutline: 'rgba(100, 116, 139, 0.15)',
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
    Select: {
      optionSelectedBg: 'rgba(15, 23, 42, 0.06)',
      optionSelectedColor: '#0f172a',
      optionActiveBg: 'rgba(15, 23, 42, 0.04)',
      activeBorderColor: '#94a3b8',
      hoverBorderColor: '#cbd5e1',
    },
    Input: { activeBorderColor: '#94a3b8', hoverBorderColor: '#cbd5e1' },
    InputNumber: { activeBorderColor: '#94a3b8', hoverBorderColor: '#cbd5e1' },
    DatePicker: { activeBorderColor: '#94a3b8', hoverBorderColor: '#cbd5e1' },
    Table: {
      rowSelectedBg: 'rgba(15, 23, 42, 0.05)',
      rowSelectedHoverBg: 'rgba(15, 23, 42, 0.08)',
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
