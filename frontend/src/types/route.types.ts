import type { RouteObject } from 'react-router'
import type { AccessRule } from '@/permissions/permissions'

/** Khoá icon menu; app/router/menu-icons.tsx ánh xạ sang icon thật (file routes không chứa JSX). */
export type MenuIconKey = 'dashboard' | 'users' | 'inspections' | 'checkin' | 'home'

/**
 * Metadata gắn vào route (handle):
 * - access: quyền cần để vào trang (ProtectedRoute kiểm tra cho mọi route khớp)
 * - menu: có mặt thì route hiện trong menu/tab, tự ẩn khi thiếu quyền
 */
export interface RouteHandle {
  access?: AccessRule
  menu?: { label: string; icon: MenuIconKey }
}

type DistributiveOmit<T, K extends PropertyKey> = T extends unknown ? Omit<T, K> : never

/** RouteObject của react-router nhưng `handle` có kiểu chặt (RouteHandle) thay vì any. */
export type AppRoute = DistributiveOmit<RouteObject, 'handle'> & { handle?: RouteHandle }
