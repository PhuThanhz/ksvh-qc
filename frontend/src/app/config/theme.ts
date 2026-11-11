import type { ThemeConfig } from 'antd'

/** Token giao diện dùng chung. Đổi màu thương hiệu ở đây, không sửa từng component. */
export const BRAND_PRIMARY = '#1677ff'

export const antdTheme: ThemeConfig = {
  token: { colorPrimary: BRAND_PRIMARY, borderRadius: 8 },
}
