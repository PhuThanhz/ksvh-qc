import { Image, Space, Typography } from 'antd'
import { isVideoUrl, parseMediaUrls, toMediaUrl } from '@/utils/media-url'

/** Ảnh / video bằng chứng (hiện trường, khiếu nại, khắc phục). */
export function FindingEvidenceGallery({ urls, title }: { urls?: string | null; title: string }) {
  const list = parseMediaUrls(urls)
  if (list.length === 0) return null
  return (
    <div style={{ marginTop: 12 }}>
      <Typography.Text type="secondary" style={{ fontSize: 12.5, display: 'block', marginBottom: 6 }}>
        {title} ({list.length} tệp)
      </Typography.Text>
      <Space size={8} wrap>
        {list.map((u, idx) =>
          isVideoUrl(u) ? (
            <video key={idx} src={toMediaUrl(u)} controls style={{ width: 160, height: 96, borderRadius: 10, objectFit: 'cover' }} />
          ) : (
            <Image
              key={idx}
              src={toMediaUrl(u)}
              alt={`${title} #${idx + 1}`}
              loading="lazy"
              width={96}
              height={96}
              style={{ objectFit: 'cover', borderRadius: 10, border: '1px solid rgba(15,23,42,0.08)' }}
            />
          ),
        )}
      </Space>
    </div>
  )
}
