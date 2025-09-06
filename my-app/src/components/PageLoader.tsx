import { useEffect } from 'react'
import { show as showLoader, hide as hideLoader } from '../lib/loader'

export default function PageLoader() {
  useEffect(() => {
    showLoader('Loading…')
    return () => hideLoader()
  }, [])
  return null
}

