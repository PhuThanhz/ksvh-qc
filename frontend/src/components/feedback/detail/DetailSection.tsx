import type { ReactNode } from 'react'

export interface DetailItemProps {
  icon?: ReactNode
  label: ReactNode
  value?: ReactNode
  /** Chiếm cả hàng khi khối chia 2 cột. */
  wide?: boolean
}

/** Một dòng thông tin: ô icon + nhãn nhỏ + giá trị đậm. */
export function DetailItem({ icon, label, value, wide }: DetailItemProps) {
  const empty = value === undefined || value === null || value === ''
  return (
    <div className={`detail-item${wide ? ' detail-item--wide' : ''}`}>
      {icon && <span className="detail-item__icon">{icon}</span>}
      <div className="detail-item__body">
        <div className="detail-item__label">{label}</div>
        <div className="detail-item__value">{empty ? <span className="detail-item__empty">—</span> : value}</div>
      </div>
    </div>
  )
}

export interface DetailSectionProps {
  title?: ReactNode
  extra?: ReactNode
  children: ReactNode
  /** Bỏ đệm trong (vd khi chứa bảng / danh sách tự có đệm). */
  flush?: boolean
  /** Chia các DetailItem thành 2 cột. */
  columns?: 1 | 2
}

/** Khối thẻ trắng có tiêu đề viết hoa, chứa các DetailItem hoặc nội dung tuỳ ý. */
export function DetailSection({ title, extra, children, flush, columns = 1 }: DetailSectionProps) {
  return (
    <section className={`detail-section${flush ? ' detail-section--flush' : ''}`}>
      {(title || extra) && (
        <header className="detail-section__head">
          {title && <h3 className="detail-section__title">{title}</h3>}
          {extra}
        </header>
      )}
      <div className={`detail-section__body${columns === 2 ? ' detail-section__body--cols' : ''}`}>{children}</div>
    </section>
  )
}

/** Lưới 2 cột (1 cột trên màn hình hẹp) cho các DetailSection. */
export function DetailGrid({ children, columns = 2 }: { children: ReactNode; columns?: 1 | 2 }) {
  return <div className={`detail-grid detail-grid--${columns}`}>{children}</div>
}
