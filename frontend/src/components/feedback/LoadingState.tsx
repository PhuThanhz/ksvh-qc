import { Flex, Spin } from 'antd'

export interface LoadingStateProps {
  tip?: string
  /** Chiếm toàn màn hình (dùng khi khởi động app / tải trang). */
  fullScreen?: boolean
}

export function LoadingState({ tip = 'Đang tải…', fullScreen = false }: LoadingStateProps) {
  return (
    <Flex vertical align="center" justify="center" gap={12} style={{ minHeight: fullScreen ? '100vh' : 240 }}>
      <Spin size="large" />
      <span style={{ color: 'rgba(0,0,0,0.45)' }}>{tip}</span>
    </Flex>
  )
}
