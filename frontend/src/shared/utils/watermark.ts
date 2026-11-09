/**
 * Vẽ dải thông tin (giờ chụp, toạ độ, người chấm, điểm chấm...) lên góc dưới ảnh.
 * Giúp chống dùng lại ảnh cũ. Trả về ảnh JPEG mới.
 */
export async function addWatermark(file: Blob, lines: string[], quality = 0.85): Promise<Blob> {
  const bitmap = await createImageBitmap(file) // tự xoay đúng chiều theo EXIF
  const canvas = document.createElement('canvas')
  canvas.width = bitmap.width
  canvas.height = bitmap.height
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('Trình duyệt không hỗ trợ canvas')

  ctx.drawImage(bitmap, 0, 0)
  bitmap.close()

  const fontSize = Math.max(14, Math.round(canvas.width / 40))
  const lineHeight = Math.round(fontSize * 1.35)
  const padding = Math.round(fontSize * 0.6)
  const boxHeight = lines.length * lineHeight + padding * 2

  ctx.fillStyle = 'rgba(0, 0, 0, 0.55)'
  ctx.fillRect(0, canvas.height - boxHeight, canvas.width, boxHeight)
  ctx.fillStyle = '#fff'
  ctx.font = `600 ${fontSize}px -apple-system, Roboto, Arial, sans-serif`
  ctx.textBaseline = 'top'
  lines.forEach((line, i) => {
    ctx.fillText(line, padding, canvas.height - boxHeight + padding + i * lineHeight, canvas.width - padding * 2)
  })

  return new Promise((resolve, reject) =>
    canvas.toBlob((b) => (b ? resolve(b) : reject(new Error('Không xuất được ảnh'))), 'image/jpeg', quality),
  )
}
