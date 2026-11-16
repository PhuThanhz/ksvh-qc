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
}

/** Khung vẽ ECharts: tự co giãn theo khung chứa, huỷ khi unmount. */
export function EChart({ option, height, ariaLabel }: EChartProps) {
  const ref = useRef<HTMLDivElement>(null)
  const chart = useRef<echarts.ECharts | null>(null)

  useEffect(() => {
    if (!ref.current) return
    const instance = echarts.init(ref.current, undefined, { renderer: 'canvas' })
    chart.current = instance
    const observer = new ResizeObserver(() => instance.resize())
    observer.observe(ref.current)
    return () => {
      observer.disconnect()
      instance.dispose()
      chart.current = null
    }
  }, [])

  useEffect(() => {
    chart.current?.setOption({ textStyle: { fontFamily: CHART_FONT }, animationDuration: 500, ...option }, true)
  }, [option])

  return <div ref={ref} role="img" aria-label={ariaLabel} style={{ width: '100%', height }} />
}
