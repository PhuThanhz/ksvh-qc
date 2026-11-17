import { AdminLayout } from '@/components/layout/AdminLayout'
import type { MenuEntry } from '@/components/layout/menu.types'
import { MobileLayout } from '@/components/layout/MobileLayout'
import { ROUTES } from '@/constants/routes'
import { useLogout, useSession } from '@/features/auth'
import { useConfirm } from '@/hooks/useConfirm'
import { useNotify } from '@/hooks/useNotify'

/** Ghép layout (không biết gì về phiên) với dữ liệu phiên + đăng xuất. */
export function AdminShell({ menu }: { menu: readonly MenuEntry[] }) {
  const { user } = useSession()
  const logout = useLogout()
  const confirm = useConfirm()
  const notify = useNotify()

  const handleLogout = async () => {
    const ok = await confirm({
      title: 'Đăng xuất khỏi hệ thống?',
      content: 'Bạn sẽ cần đăng nhập lại để tiếp tục làm việc.',
      okText: 'Đăng xuất',
      danger: true,
    })
    if (!ok) return
    logout.mutate(undefined, {
      onSuccess: () => notify.info('Đã đăng xuất thành công'),
    })
  }

  return <AdminLayout menu={menu} user={user} onLogout={handleLogout} loggingOut={logout.isPending} />
}

export function MobileShell({ tabs }: { tabs: readonly MenuEntry[] }) {
  const logout = useLogout()
  const confirm = useConfirm()
  const notify = useNotify()

  const handleLogout = async () => {
    const ok = await confirm({
      title: 'Đăng xuất?',
      content: 'Xác nhận thoát khỏi phiên làm việc hiện tại.',
      okText: 'Đăng xuất',
      danger: true,
    })
    if (!ok) return
    logout.mutate(undefined, {
      onSuccess: () => notify.info('Đã đăng xuất thành công'),
    })
  }

  return (
    <MobileLayout
      title="KSVH QC"
      rootPath={ROUTES.qc.root}
      tabs={tabs}
      headerRight={
        <span role="button" onClick={handleLogout} style={{ cursor: 'pointer', color: '#8c8c8c', fontSize: 13 }}>
          Thoát
        </span>
      }
    />
  )
}
