import { AdminLayout } from '@/components/layout/AdminLayout'
import type { MenuEntry } from '@/components/layout/menu.types'
import { MobileLayout } from '@/components/layout/MobileLayout'
import { ROUTES } from '@/constants/routes'
import { useLogout, useSession } from '@/features/auth'

/** Ghép layout (không biết gì về phiên) với dữ liệu phiên + đăng xuất. */
export function AdminShell({ menu }: { menu: readonly MenuEntry[] }) {
  const { user } = useSession()
  const logout = useLogout()
  return <AdminLayout menu={menu} user={user} onLogout={() => logout.mutate()} loggingOut={logout.isPending} />
}

export function MobileShell({ tabs }: { tabs: readonly MenuEntry[] }) {
  const logout = useLogout()
  return (
    <MobileLayout
      title="KSVH QC"
      rootPath={ROUTES.qc.root}
      tabs={tabs}
      headerRight={
        <span role="button" onClick={() => logout.mutate()}>
          Thoát
        </span>
      }
    />
  )
}
