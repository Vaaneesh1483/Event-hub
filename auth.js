// DOM Elements
const signupForm = document.getElementById("signup-form")
const loginForm = document.getElementById("login-form")
const loginLink = document.getElementById("login-link")
const signupLink = document.getElementById("signup-link")
const signupFormContainer = document.getElementById("signup-form").parentElement
const loginFormContainer = document.getElementById("login-form-container")
const API_URL = "http://localhost:5000/api"
loginLink.addEventListener("click", (e) => {
  e.preventDefault()
  signupFormContainer.classList.add("hidden")
  loginFormContainer.classList.remove("hidden")
})

signupLink.addEventListener("click", (e) => {
  e.preventDefault()
  loginFormContainer.classList.add("hidden")
  signupFormContainer.classList.remove("hidden")
})
signupForm.addEventListener("submit", async (e) => {
  e.preventDefault()

  const username = document.getElementById("username").value
  const email = document.getElementById("email").value
  const password = document.getElementById("password").value
  if (!username || !email || !password) {
    showMessage("Please fill in all fields", "error")
    return
  }
  try {
    const response = await fetch(`${API_URL}/users/register`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ username, email, password }),
    })
    const data = await response.json()
    if (!response.ok) {
      throw new Error(data.message || "Registration failed")
    }
    localStorage.setItem("token", data.token)
    localStorage.setItem("user", JSON.stringify(data.user))
    window.location.href = "dashboard.html"
  } catch (error) {
    showMessage(error.message, "error")
  }
})
loginForm.addEventListener("submit", async (e) => {
  e.preventDefault()
  const email = document.getElementById("login-email").value
  const password = document.getElementById("login-password").value
  if (!email || !password) {
    showMessage("Please fill in all fields", "error")
    return
  }
  try {
    const response = await fetch(`${API_URL}/users/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ email, password }),
    })
    const data = await response.json()
    if (!response.ok) {
      throw new Error(data.message || "Login failed")
    }
    localStorage.setItem("token", data.token)
    localStorage.setItem("user", JSON.stringify(data.user))
    window.location.href = "dashboard.html"
  } catch (error) {
    showMessage(error.message, "error")
  }
})

function showMessage(message, type = "success") {
  let messageElement = document.querySelector(".message")
  if (!messageElement) {
    messageElement = document.createElement("div")
    messageElement.className = "message"
    document.querySelector(".container").prepend(messageElement)
  }
  messageElement.textContent = message
  messageElement.className = `message ${type}`
  messageElement.style.padding = "0.75rem 1.5rem"
  messageElement.style.marginBottom = "1rem"
  messageElement.style.borderRadius = "var(--radius)"
  messageElement.style.fontWeight = "500"

  if (type === "success") {
    messageElement.style.backgroundColor = "#d1fae5"
    messageElement.style.color = "#065f46"
  } else {
    messageElement.style.backgroundColor = "#fee2e2"
    messageElement.style.color = "#b91c1c"
  }
  setTimeout(() => {
    messageElement.remove()
  }, 3000)
}
window.addEventListener("DOMContentLoaded", () => {
  const token = localStorage.getItem("token")
  if (token) {
    window.location.href = "dashboard.html"
  }
})
