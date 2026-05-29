import { useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '../stores/authStore'
import type { UserRole } from '../types'

export function useRequireAuth(allowedRoles?: UserRole[]) {
  const { user, loading } = useAuthStore()
  const navigate = useNavigate()
  const rolesKey = useRef(allowedRoles?.join(',') ?? '')

  useEffect(() => {
    if (loading) return
    if (!user) {
      navigate('/login', { replace: true })
      return
    }
    if (allowedRoles && !allowedRoles.includes(user.role)) {
      navigate('/', { replace: true })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, loading, navigate, rolesKey.current])

  return { user, loading }
}
