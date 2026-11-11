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

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App queryClient={queryClient} />
  </StrictMode>,
)
