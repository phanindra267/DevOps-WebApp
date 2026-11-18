import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { login as apiLogin, getMe } from '../lib/api'

interface AuthContextType {
  token: string | null
  user: { username: string; role: string } | null
  isAuthenticated: boolean
  ready: boolean
  login: (username: string, password: string) => Promise<void>
  logout: () => void
}

export const AuthContext = createContext<AuthContextType>({
  token: null,
  user: null,
  isAuthenticated: false,
  ready: false,
  login: async () => {},
  logout: () => {},
})

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(null)
  const [user, setUser] = useState<{ username: string; role: string } | null>(null)
  const [ready, setReady] = useState(false)

  // Restore the saved session only AFTER mount. Server and client therefore
  // render the same initial HTML (no hydration mismatch), and route guards
  // wait for `ready` before deciding to redirect to /login.
  useEffect(() => {
    const saved = localStorage.getItem('token')
    if (saved) setToken(saved)
    setReady(true)
  }, [])

  useEffect(() => {
    if (token) {
      getMe()
        .then((res) => setUser(res.data))
        .catch(() => {
          localStorage.removeItem('token')
          setToken(null)
        })
    }
  }, [token])

  const login = async (username: string, password: string) => {
    const res = await apiLogin(username, password)
    const t = res.data.token
    localStorage.setItem('token', t)
    setToken(t)
    const me = await getMe()
    setUser(me.data)
  }

  const logout = () => {
    localStorage.removeItem('token')
    setToken(null)
    setUser(null)
  }

  return (
    <AuthContext.Provider value={{ token, user, isAuthenticated: !!token, ready, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
