import '@fontsource-variable/inter'
import dayjs from 'dayjs'
import 'dayjs/locale/vi'
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { App } from '@/app/App'
import { setupSession } from '@/features/auth'
import { createQueryClient } from '@/lib/query-client'
import '@/styles/global.css'

dayjs.locale('vi')

const queryClient = createQueryClient()
setupSession(queryClient)

// Chỉ đăng ký Service Worker ở môi trường production (tránh can thiệp dev/HMR)
if (import.meta.env.PROD && 'serviceWorker' in navigator && window.location.protocol.startsWith('http')) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch(() => {})
  })
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App queryClient={queryClient} />
  </StrictMode>,
)
