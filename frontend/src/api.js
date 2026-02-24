const API_URL = "http://127.0.0.1:8000"

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
    throw new Error(data.detail || "Register failed")
  }

  return data
}