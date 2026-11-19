import { ROUTES } from '@/constants/routes'
import { PERMISSIONS } from '@/permissions'
import type { AppRoute } from '@/types/route.types'

const READ = PERMISSIONS.CRITERIA.READ

export const criteriaAdminRoutes: AppRoute[] = [
  {
    path: ROUTES.admin.criteriaGroups,
    handle: { access: READ, menu: { label: 'Nhóm tiêu chuẩn', icon: 'criteriaGroups', group: 'catalog' } },
    lazy: () => import('@/features/criteria/pages/CriterionGroupPage').then((m) => ({ Component: m.CriterionGroupPage })),
  },
  {
    path: ROUTES.admin.criteria,
    handle: { access: READ, menu: { label: 'Tiêu chí kiểm soát', icon: 'criteria', group: 'catalog' } },
    lazy: () => import('@/features/criteria/pages/CriteriaPage').then((m) => ({ Component: m.CriteriaPage })),
  },
  {
    path: ROUTES.admin.templates,
    handle: { access: READ, menu: { label: 'Mẫu phiếu kiểm tra', icon: 'templates', group: 'catalog' } },
    lazy: () => import('@/features/criteria/pages/TemplateListPage').then((m) => ({ Component: m.TemplateListPage })),
  },
  {
    path: ROUTES.admin.riskLevels,
    handle: { access: READ, menu: { label: 'Phân loại rủi ro', icon: 'riskLevels', group: 'catalog' } },
    lazy: () => import('@/features/criteria/pages/RiskLevelPage').then((m) => ({ Component: m.RiskLevelPage })),
  },
  {
    path: ROUTES.admin.riskRules,
    handle: { access: READ, menu: { label: 'Quy tắc tái phạm & Nâng mức', icon: 'riskRules', group: 'catalog' } },
    lazy: () => import('@/features/criteria/pages/RiskRulesPage').then((m) => ({ Component: m.RiskRulesPage })),
  },
]
