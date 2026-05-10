export type UserRole = 'super_admin' | 'admin' | 'employee' | 'customer'

export function isSuperAdmin(role: UserRole) {
  return role === 'super_admin'
}

export function isAdmin(role: UserRole) {
  return ['admin', 'super_admin'].includes(role)
}

export function isEmployee(role: UserRole) {
  return ['employee', 'admin', 'super_admin'].includes(role)
}

export function getRedirectForRole(role: UserRole): string {
  const map: Record<UserRole, string> = {
    super_admin: '/superadmin',
    admin: '/admin',
    employee: '/admin/orders',
    customer: '/',
  }
  return map[role]
}
