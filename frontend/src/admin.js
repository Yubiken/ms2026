import { jwtDecode } from "jwt-decode"

export function getAdminUsers() {
  return (import.meta.env.VITE_ADMIN_USERS || "")
    .split(",")
    .map(user => user.trim())
    .filter(Boolean)
}

export function isAdminToken(token) {
  if (!token) return false

  try {
    const decoded = jwtDecode(token)
    return getAdminUsers().includes(decoded.sub)
  } catch {
    return false
  }
}
