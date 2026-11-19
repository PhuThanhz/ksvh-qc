import { useNavigation } from 'react-router'

/** Thanh tiến trình mảnh trên cùng khi đang chuyển trang (đang tải code / dữ liệu của route mới). */
export function NavigationProgress() {
  const navigation = useNavigation()
  const busy = navigation.state !== 'idle'
  return <div className={`nav-progress${busy ? ' nav-progress--active' : ''}`} role="presentation" />
}
