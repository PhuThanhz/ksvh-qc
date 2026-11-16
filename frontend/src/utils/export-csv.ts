/**
 * Tiện ích xuất dữ liệu ra file CSV chuẩn UTF-8 (có tiền tố BOM \uFEFF để Excel hiển thị tiếng Việt không bị lỗi font).
 */

export interface CsvColumn<T> {
  header: string
  accessor: (item: T) => string | number | boolean | null | undefined
}

export function exportToCsv<T>(filename: string, columns: CsvColumn<T>[], items: readonly T[]) {
  const headers = columns.map((c) => escapeCsvCell(c.header)).join(',')

  const rows = items.map((item) =>
    columns
      .map((col) => {
        const val = col.accessor(item)
        if (val === null || val === undefined) return '""'
        if (typeof val === 'boolean') return val ? '"Có"' : '"Không"'
        return escapeCsvCell(String(val))
      })
      .join(','),
  )

  const csvContent = '\uFEFF' + [headers, ...rows].join('\r\n')
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)

  const link = document.createElement('a')
  link.setAttribute('href', url)
  link.setAttribute('download', filename.endsWith('.csv') ? filename : `${filename}.csv`)
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

function escapeCsvCell(text: string): string {
  if (text.includes('"') || text.includes(',') || text.includes('\n') || text.includes('\r')) {
    return `"${text.replace(/"/g, '""')}"`
  }
  return `"${text}"`
}

