import React from 'react'
import Head from 'next/head'
import Link from 'next/link'
import { useRouter } from 'next/router'
import { useState } from 'react'
import { useAuth } from '../src/context/AuthContext'
import { FiCloud, FiLock, FiUser, FiArrowRight } from 'react-icons/fi'

export default function LoginPage() {
  const { login } = useAuth()
  const router = useRouter()
  const [form, setForm] = useState({ username: '', password: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      await login(form.username, form.password)
      router.push('/')
    } catch (err: any) {
      setError(err?.response?.data?.error || 'Invalid credentials. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <Head>
        <title>Sign In | CloudOps Sentinel</title>
      </Head>
      <div className="login-page">
        <div className="login-bg-grid" />
        <div className="login-bg-glow" />

        <div className="login-box">
          <div className="login-logo">
            <div className="login-logo-icon">
              <FiCloud size={24} color="#6366f1" />
            </div>
          </div>

          <div style={{ textAlign: 'center', marginBottom: 28 }}>
            <div className="login-title">CloudOps Sentinel</div>
            <div className="login-subtitle" style={{ marginBottom: 0 }}>
              DevSecOps Platform · Sign in to continue
            </div>
          </div>

          {error && <div className="error-msg">⚠ {error}</div>}

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label">Username</label>
              <input
                className="form-input"
                placeholder="admin"
                value={form.username}
                onChange={(e) => setForm((f) => ({ ...f, username: e.target.value }))}
                autoFocus
                required
              />
            </div>
            <div className="form-group">
              <label className="form-label">Password</label>
              <input
                className="form-input"
                type="password"
                placeholder="••••••••"
                value={form.password}
                onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
                required
              />
            </div>

            <button
              className="btn btn-primary w-full"
              style={{ width: '100%', justifyContent: 'center', padding: '12px', marginTop: 8 }}
              type="submit"
              disabled={loading}
            >
              {loading ? 'Authenticating…' : '→ Sign In'}
            </button>
          </form>

          <div className="login-divider">
            <div className="login-divider-line" />
            <div className="login-divider-text">LOCAL ENVIRONMENT</div>
            <div className="login-divider-line" />
          </div>

          <div style={{ fontSize: 11, color: 'var(--text-dim)', textAlign: 'center', lineHeight: 1.7 }}>
            Running locally on <code style={{ color: 'var(--accent-bright)', fontFamily: 'monospace' }}>http://localhost:3000</code><br />
            No cloud resources are provisioned or billed.
          </div>
        </div>
      </div>
    </>
  )
}
