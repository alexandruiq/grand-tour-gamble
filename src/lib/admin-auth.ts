// Hardcoded admin credentials - change these for production
export const ADMIN_CREDENTIALS = {
  username: 'admin',
  password: 'grandtour2025'
}

export function validateAdminLogin(username: string, password: string): boolean {
  return username === ADMIN_CREDENTIALS.username && password === ADMIN_CREDENTIALS.password
}

export function isAdminAuthenticated(): boolean {
  if (typeof window === 'undefined') return false
  return localStorage.getItem('admin_authenticated') === 'true'
}

export function setAdminAuthenticated(authenticated: boolean) {
  if (typeof window === 'undefined') return
  if (authenticated) {
    localStorage.setItem('admin_authenticated', 'true')
  } else {
    localStorage.removeItem('admin_authenticated')
  }
}

export function signOutAdmin() {
  if (typeof window === 'undefined') return
  localStorage.removeItem('admin_authenticated')
  localStorage.removeItem('gameSession')
}