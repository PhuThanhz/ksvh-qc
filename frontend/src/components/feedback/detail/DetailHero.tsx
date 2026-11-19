import type { ReactNode } from 'react'

export interface DetailChip {
  icon?: ReactNode
  label: ReactNode
}

export interface DetailHeroProps {
  /** Dòng nhỏ viết hoa phía trên, vd "Mẫu phiếu kiểm tra". */
  eyebrow?: ReactNode
  title: ReactNode
  /** Nhãn trạng thái cạnh tiêu đề. */
  status?: ReactNode
  chips?: DetailChip[]
  /** Hình tròn bên trái: icon hoặc chữ viết tắt. */
  avatar?: ReactNode
  description?: ReactNode
}

/** Khối đầu trang chi tiết: nền gradient màu thương hiệu, tiêu đề lớn, trạng thái và các chip thông tin nhanh. */
export function DetailHero({ eyebrow, title, status, chips, avatar, description }: DetailHeroProps) {
  return (
    <div className="detail-hero">
      {avatar && <div className="detail-hero__avatar">{avatar}</div>}
      <div className="detail-hero__body">
        {eyebrow && <div className="detail-hero__eyebrow">{eyebrow}</div>}
        <div className="detail-hero__title-row">
          <h2 className="detail-hero__title">{title}</h2>
          {status && <span className="detail-hero__status">{status}</span>}
        </div>
        {description && <div className="detail-hero__desc">{description}</div>}
        {chips && chips.length > 0 && (
          <div className="detail-hero__chips">
            {chips.map((c, i) => (
              <span key={i} className="detail-hero__chip">
                {c.icon}
                {c.label}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
