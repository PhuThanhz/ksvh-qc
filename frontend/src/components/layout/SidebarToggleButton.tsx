export interface SidebarToggleButtonProps {
  collapsed?: boolean
  onClick: () => void
}

/** Nút thu gọn / mở thanh điều hướng: biểu tượng khung sidebar + mũi tên chỉ hướng. */
export function SidebarToggleButton({ collapsed, onClick }: SidebarToggleButtonProps) {
  const label = collapsed ? 'Mở thanh điều hướng' : 'Thu gọn thanh điều hướng'
  return (
    <button type="button" className="sidebar-toggle" onClick={onClick} aria-label={label} title={label}>
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <rect x="3" y="4" width="18" height="16" rx="3.5" stroke="currentColor" strokeWidth="1.7" />
        <path d="M9 4.5v15" stroke="currentColor" strokeWidth="1.7" />
        <path
          className="sidebar-toggle__chevron"
          d={collapsed ? 'M13.5 10l2.5 2-2.5 2' : 'M16 10l-2.5 2 2.5 2'}
          stroke="currentColor"
          strokeWidth="1.7"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </button>
  )
}
