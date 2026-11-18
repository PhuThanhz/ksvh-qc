import { FilterOutlined, PlusOutlined } from '@ant-design/icons'
import { Badge, Button, type ButtonProps } from 'antd'
import type { CSSProperties, ReactNode } from 'react'

export interface PrimaryButtonProps extends Omit<ButtonProps, 'type'> {
  children?: ReactNode
}

/**
 * Nút bấm chính (CTA): Ánh sáng Apple từ trên xuống với gradient cam ấm.
 * Bo góc 8px (--radius-sm), chữ trắng 600, đổ bóng chìm tinh tế.
 */
export function PrimaryButton({
  children,
  className = '',
  style,
  ...rest
}: PrimaryButtonProps) {
  return (
    <Button
      type="primary"
      className={`btn-primary-apple ${className}`.trim()}
      style={{
        height: 38,
        padding: '0 16px',
        fontSize: 14,
        ...style,
      }}
      {...rest}
    >
      {children}
    </Button>
  )
}

export interface SecondaryButtonProps extends Omit<ButtonProps, 'type'> {
  children?: ReactNode
}

/**
 * Nút bấm phụ: Nền xám nhạt Apple (rgba(118, 118, 128, 0.12)), không viền, hover tăng độ đậm.
 */
export function SecondaryButton({
  children,
  className = '',
  style,
  ...rest
}: SecondaryButtonProps) {
  return (
    <Button
      type="text"
      className={`btn-secondary-apple ${className}`.trim()}
      style={{
        height: 38,
        padding: '0 16px',
        fontSize: 14,
        ...style,
      }}
      {...rest}
    >
      {children}
    </Button>
  )
}

export interface CreateButtonProps extends PrimaryButtonProps {
  label?: ReactNode
}

/**
 * Nút Tạo mới / Thêm mới chuẩn hoá với icon dấu cộng và gradient cam ấm.
 */
export function CreateButton({
  label = 'Thêm mới',
  icon = <PlusOutlined />,
  ...rest
}: CreateButtonProps) {
  return (
    <PrimaryButton icon={icon} {...rest}>
      {label}
    </PrimaryButton>
  )
}

export interface FilterButtonProps extends Omit<ButtonProps, 'type'> {
  activeCount?: number
  active?: boolean
  label?: ReactNode
  onToggle?: () => void
}

/**
 * Nút Bộ lọc có badge đếm số lượng bộ lọc đang kích hoạt.
 */
export function FilterButton({
  activeCount = 0,
  active = false,
  label = 'Bộ lọc',
  icon = <FilterOutlined />,
  onToggle,
  style,
  ...rest
}: FilterButtonProps) {
  const isActive = active || activeCount > 0
  const btnStyle: CSSProperties = {
    height: 38,
    padding: '0 14px',
    borderRadius: 'var(--radius-sm)',
    border: isActive ? '1px solid var(--brand-primary)' : '1px solid var(--apple-input-border)',
    background: isActive ? 'var(--brand-primary-light)' : '#ffffff',
    color: isActive ? 'var(--brand-primary)' : 'var(--apple-text-secondary)',
    fontWeight: isActive ? 600 : 500,
    display: 'inline-flex',
    alignItems: 'center',
    gap: 6,
    transition: 'all 0.2s ease',
    ...style,
  }

  return (
    <Badge count={activeCount} size="small" offset={[-2, 4]} color="var(--brand-primary)">
      <Button
        type="default"
        icon={icon}
        onClick={onToggle}
        style={btnStyle}
        {...rest}
      >
        <span>{label}</span>
      </Button>
    </Badge>
  )
}
