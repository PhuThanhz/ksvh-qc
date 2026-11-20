export interface Coords {
  lat: number
  lng: number
}

export type ParseCoordsResult =
  | { ok: true; coords: Coords; outsideVietnam: boolean }
  | { ok: false; reason: string }

const NUM = '(-?\\d{1,3}(?:\\.\\d+)?)'

/** Thứ tự ưu tiên: ghim địa điểm (!3d!4d) chính xác hơn tâm khung nhìn (@lat,lng). */
const PATTERNS: RegExp[] = [
  new RegExp(`!3d${NUM}!4d${NUM}`),
  new RegExp(`[?&](?:q|query|ll|destination|center|daddr)=(?:loc:)?${NUM},\\s*${NUM}`),
  new RegExp(`@${NUM},${NUM}`),
  new RegExp(`^\\s*${NUM}\\s*[,;\\s]\\s*${NUM}\\s*$`),
]

/** Khung toạ độ lãnh thổ Việt Nam (gần đúng) – để cảnh báo dán nhầm link. */
const VN = { minLat: 8, maxLat: 24, minLng: 102, maxLng: 110 }

const SHORT_LINK = /(maps\.app\.goo\.gl|goo\.gl\/maps|g\.co\/kgs)/i

/**
 * Đọc vĩ độ / kinh độ từ link Google Maps hoặc chuỗi toạ độ dán vào.
 * Hỗ trợ: .../place/...!3dLAT!4dLNG · ...?q=LAT,LNG · .../@LAT,LNG,17z · "LAT, LNG".
 * Link rút gọn (maps.app.goo.gl) không chứa toạ độ → trả lý do để hướng dẫn người dùng.
 */
export function parseGoogleMapsCoords(input: string): ParseCoordsResult {
  const text = input.trim()
  if (!text) return { ok: false, reason: 'Chưa có nội dung' }
  if (SHORT_LINK.test(text)) {
    return {
      ok: false,
      reason: 'Link rút gọn (maps.app.goo.gl) không chứa toạ độ. Hãy mở link, rồi copy địa chỉ trên thanh trình duyệt, hoặc nhấp chuột phải vào ghim trên bản đồ để copy toạ độ.',
    }
  }
  let decoded = text
  try {
    decoded = decodeURIComponent(text.replace(/\+/g, ' '))
  } catch {
    // Chuỗi không phải URL mã hoá hợp lệ → đọc nguyên văn
  }
  for (const re of PATTERNS) {
    const m = decoded.match(re)
    if (!m) continue
    const lat = Number(m[1])
    const lng = Number(m[2])
    if (!Number.isFinite(lat) || !Number.isFinite(lng) || Math.abs(lat) > 90 || Math.abs(lng) > 180) continue
    const outsideVietnam = lat < VN.minLat || lat > VN.maxLat || lng < VN.minLng || lng > VN.maxLng
    return { ok: true, coords: { lat: Number(lat.toFixed(6)), lng: Number(lng.toFixed(6)) }, outsideVietnam }
  }
  return {
    ok: false,
    reason: 'Không tìm thấy toạ độ trong nội dung đã dán. Hãy dán link Google Maps của địa điểm hoặc toạ độ dạng "10.7724, 106.6961".',
  }
}

/** Link mở Google Maps tìm sẵn theo tên + địa chỉ (để người dùng copy link địa điểm về). */
export function googleMapsSearchUrl(query: string): string {
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`
}
