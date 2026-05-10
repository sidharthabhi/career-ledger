import { createContext, useContext, useState, useEffect } from 'react'
import { authApi } from './api'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const token = localStorage.getItem('cl_token')
    const cached = localStorage.getItem('cl_user')
    if (token && cached) {
      try { setUser(JSON.parse(cached)) } catch {}
      // Verify with backend in background
      authApi.me()
        .then((u) => {
          setUser(u)
          localStorage.setItem('cl_user', JSON.stringify(u))
        })
        .catch(() => {
          localStorage.removeItem('cl_token')
          localStorage.removeItem('cl_user')
          setUser(null)
        })
        .finally(() => setLoading(false))
    } else {
      setLoading(false)
    }
  }, [])

  const login = async (username, password) => {
    const data = await authApi.login({ username, password })
    localStorage.setItem('cl_token', data.access_token)
    localStorage.setItem('cl_user', JSON.stringify(data.user))
    setUser(data.user)
    return data.user
  }

  const signup = async (payload) => {
    const data = await authApi.signup(payload)
    localStorage.setItem('cl_token', data.access_token)
    localStorage.setItem('cl_user', JSON.stringify(data.user))
    setUser(data.user)
    return data.user
  }

  const logout = () => {
    localStorage.removeItem('cl_token')
    localStorage.removeItem('cl_user')
    setUser(null)
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, signup, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
