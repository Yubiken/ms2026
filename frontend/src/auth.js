import { jwtDecode } from "jwt-decode"


export function getToken() {
  return localStorage.getItem("token")
}


export function saveToken(token) {
  localStorage.setItem("token", token)
}


export function removeToken() {
  localStorage.removeItem("token")
}


export function isLoggedIn() {
  return !!getToken()
}


export function getUsername() {

  const token = getToken()

  if (!token) return null

  try {

    const decoded = jwtDecode(token)

    return decoded.sub

  } catch {

    return null

  }

}