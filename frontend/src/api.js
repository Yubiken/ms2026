const API_URL = import.meta.env.VITE_API_URL


// LOGIN
export async function login(email, password) {

  const response = await fetch(`${API_URL}/login`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      email,
      password
    })
  })

  const data = await response.json()

  if (!response.ok) {
    throw new Error(data.detail || "Login failed")
  }

  return data
}


// REGISTER
export async function register(email, password) {

  const response = await fetch(`${API_URL}/register`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      email,
      password
    })
  })

  const data = await response.json()

  if (!response.ok) {
    throw new Error(data.detail || "Register failed :(")
  }

  return data
}


// 🔐 REQUEST Z TOKENEM
export async function apiRequest(endpoint, options = {}) {

  const token = localStorage.getItem("token")

  const response = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
      ...(options.headers || {})
    }
  })

  // TOKEN WYGASŁ
  if (response.status === 401) {

    console.log("Token expired → logout")

    localStorage.removeItem("token")
    localStorage.removeItem("username")

    window.location.href = "/login"

    return null
  }

  return response.json()
}