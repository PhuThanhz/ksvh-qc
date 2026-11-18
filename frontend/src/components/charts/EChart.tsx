import { BarChart, LineChart, PieChart } from 'echarts/charts'
import { GridComponent, LegendComponent, TooltipComponent } from 'echarts/components'
import * as echarts from 'echarts/core'
import type { EChartsCoreOption } from 'echarts/core'
import { CanvasRenderer } from 'echarts/renderers'
import { useEffect, useRef } from 'react'
import { CHART_FONT } from '@/components/charts/chart-theme'

// Chỉ nạp phần ECharts cần dùng để bundle nhỏ.
echarts.use([BarChart, LineChart, PieChart, GridComponent, LegendComponent, TooltipComponent, CanvasRenderer])

export interface EChartProps {
  option: EChartsCoreOption
  height: number
  /** Mô tả cho trình đọc màn hình. */
  ariaLabel: string
  /** Bắt sự kiện tương tác biểu đồ (click, v.v.) */
  onEvents?: Record<string, (params: unknown) => void>
}

/** Khung vẽ ECharts: tự co giãn theo khung chứa, hỗ trợ tương tác và tự huỷ khi unmount. */
export function EChart({ option, height, ariaLabel, onEvents }: EChartProps) {
  const ref = useRef<HTMLDivElement>(null)
  const chart = useRef<echarts.ECharts | null>(null)

  const onEventsRef = useRef(onEvents)
  useEffect(() => {
    onEventsRef.current = onEvents
  }, [onEvents])

  useEffect(() => {
    if (!ref.current) return
    const instance = echarts.init(ref.current, undefined, { renderer: 'canvas' })
    chart.current = instance

    const handleClick = (p: unknown) => {
      onEventsRef.current?.click?.(p)
    }
    instance.on('click', handleClick)

    const observer = new ResizeObserver(() => instance.resize())
    observer.observe(ref.current)
    return () => {
      observer.disconnect()
      instance.off('click', handleClick)
      instance.dispose()
      chart.current = null
    }
  }, [])

  useEffect(() => {
    chart.current?.setOption({ textStyle: { fontFamily: CHART_FONT }, ...option })
  }, [option])

  return <div ref={ref} role="img" aria-label={ariaLabel} style={{ width: '100%', height }} />
}
