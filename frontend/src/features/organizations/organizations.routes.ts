import { createElement } from 'react'
import { Navigate } from 'react-router'
import { ROUTES } from '@/constants/routes'
import { PERMISSIONS } from '@/permissions'
import type { AppRoute } from '@/types/route.types'

export const organizationsAdminRoutes: AppRoute[] = [
  {
    path: ROUTES.admin.organizations,
    handle: {
      access: PERMISSIONS.ORGANIZATION.READ,
      menu: { label: 'Đơn vị & Cơ sở vận hành', icon: 'organizations', group: 'catalog' },
    },
    lazy: () =>
      import('@/features/organizations/pages/OrgUnitPage').then((m) => ({ Component: m.OrgUnitPage })),
  },
  {
    path: ROUTES.admin.companies,
    handle: {
      access: PERMISSIONS.ORGANIZATION.READ,
      menu: { label: 'Công ty thành viên', icon: 'companies', group: 'catalog' },
    },
    lazy: () =>
      import('@/features/organizations/pages/CompanyPage').then((m) => ({ Component: m.CompanyPage })),
  },
  {
    path: ROUTES.admin.restaurants,
    element: createElement(Navigate, { to: `${ROUTES.admin.organizations}?tab=restaurants`, replace: true }),
  },
  {
    path: ROUTES.admin.departments,
    element: createElement(Navigate, { to: `${ROUTES.admin.organizations}?tab=departments`, replace: true }),
  },
  {
    path: ROUTES.admin.orgUnits,
    element: createElement(Navigate, { to: ROUTES.admin.organizations, replace: true }),
  },
]
