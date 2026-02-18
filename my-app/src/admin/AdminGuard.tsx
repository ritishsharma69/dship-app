import { useEffect } from 'react'
import { useRouter } from '../lib/router'
import { decodeDemoTokenEmail, getAuthEmail, getAuthToken } from '../lib/auth'

const DEFAULT_ADMIN_EMAIL = 'khushiyanstore@gmail.com'

export default function AdminGuard({ children }: { children: React.ReactNode }) {
  const { navigate } = useRouter()

  const tok = getAuthToken()
  const email = (getAuthEmail() || (tok ? decodeDemoTokenEmail(tok) : '') || '').toLowerCase()
  const ok = !!tok && !!email && email === DEFAULT_ADMIN_EMAIL

  useEffect(() => {
    if (!ok) navigate('/admin/login', { replace: true })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ok])

  if (!ok) return null
  return <>{children}</>
}

