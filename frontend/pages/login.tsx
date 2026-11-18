import React, { useState } from 'react'
import Head from 'next/head'
import { useRouter } from 'next/router'
import { motion } from 'framer-motion'
import { useAuth } from '../src/context/AuthContext'
import { useToast } from '../src/context/ToastContext'
import {
  FiCloud, FiLock, FiUser, FiArrowRight, FiEye, FiEyeOff,
  FiShield, FiActivity, FiServer, FiCheckCircle,
} from 'react-icons/fi'

export default function LoginPage() {
  const { login } = useAuth()
  const toast = useToast()
  const router = useRouter()
  const [form, setForm] = useState({ username: '', password: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true); setError('')
    try {
      await login(form.username, form.password)
      toast.success('Welcome back — secure local session restored.')
      router.push('/')
    } catch (err: any) {
      const msg = err?.response?.data?.error || 'Invalid credentials. Please try again.'
      setError(msg)
      toast.error(msg)
    } finally { setLoading(false) }
  }

  const fillDemo = () => {
    setForm({ username: 'admin', password: 'admin123' })
    toast.info('Demo credentials filled. Press Sign In.')
  }

  return (
    <>
      <Head><title>Sign In | CloudOps Sentinel</title></Head>
      <div className="login-page">
        <div className="login-bg-grid" />
        <div className="login-bg-glow" />
        <motion.div className="login-orb orb-one" animate={{ y: [0, -18, 0], x: [0, 12, 0] }}
          transition={{ duration: 9, repeat: Infinity, ease: 'easeInOut' }} />
        <motion.div className="login-orb orb-two" animate={{ y: [0, 20, 0], x: [0, -10, 0] }}
          transition={{ duration: 11, repeat: Infinity, ease: 'easeInOut' }} />

        <motion.div className="login-box"
          initial={{ opacity: 0, y: 26, scale: .97 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: .5, ease: [0.16, 1, 0.3, 1] }}>

          <div className="login-logo">
            <motion.div className="login-logo-icon pulse-glow"
              animate={{ rotate: [0, 4, -4, 0] }} transition={{ duration: 7, repeat: Infinity }}>
              <FiCloud size={24} color="#a5b4fc" />
            </motion.div>
          </div>

          <div style={{ textAlign: 'center', marginBottom: 24 }}>
            <div className="login-title gradient-text">CloudOps Sentinel</div>
            <div className="login-subtitle" style={{ marginBottom: 12 }}>
              DevSecOps Control Plane · Session 2026–27
            </div>
            <div style={{ display: 'flex', gap: 6, justifyContent: 'center', flexWrap: 'wrap' }}>
              {[
                { icon: FiShield, label: 'IAM + MFA' },
                { icon: FiServer, label: 'Terraform' },
                { icon: FiActivity, label: 'Observability' },
              ].map((c) => {
                const Icon = c.icon
                return <span key={c.label} className="ui-chip" style={{ cursor: 'default', fontSize: 10.5 }}>
                  <Icon size={11} /> {c.label}
                </span>
              })}
            </div>
          </div>

          {error && (
            <motion.div className="error-msg" initial={{ x: -8, opacity: 0 }} animate={{ x: 0, opacity: 1 }}>
              <FiShield size={13} style={{ verticalAlign: -2, marginRight: 6 }} />{error}
            </motion.div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label">Username</label>
              <div style={{ position: 'relative' }}>
                <FiUser size={15} color="var(--text-dim)" style={{ position: 'absolute', left: 12, top: 13 }} />
                <input className="form-input" style={{ paddingLeft: 36 }} placeholder="admin"
                  value={form.username} autoComplete="username"
                  onChange={(e) => setForm((f) => ({ ...f, username: e.target.value }))} autoFocus required />
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">Password</label>
              <div style={{ position: 'relative' }}>
                <FiLock size={15} color="var(--text-dim)" style={{ position: 'absolute', left: 12, top: 13 }} />
                <input className="form-input" style={{ paddingLeft: 36, paddingRight: 40 }}
                  type={showPassword ? 'text' : 'password'} placeholder="••••••••"
                  value={form.password} autoComplete="current-password"
                  onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))} required />
                <button type="button" onClick={() => setShowPassword((v) => !v)}
                  className="nav-icon-btn" style={{ position: 'absolute', right: 6, top: 5 }}
                  aria-label={showPassword ? 'Hide password' : 'Show password'} data-tip={showPassword ? 'Hide' : 'Show'}>
                  {showPassword ? <FiEyeOff size={15} /> : <FiEye size={15} />}
                </button>
              </div>
            </div>

            <button className="btn btn-primary w-full btn-dynamic"
              style={{ width: '100%', justifyContent: 'center', padding: '13px', marginTop: 6, fontWeight: 700 }}
              type="submit" disabled={loading}>
              {loading ? (
                <><span className="status-dot ping-dot" style={{ background: '#fff' }} /> Authenticating…</>
              ) : (<>Sign In <FiArrowRight size={16} /></>)}
            </button>
          </form>

          <button className="btn btn-sm w-full" onClick={fillDemo} type="button"
            style={{ width: '100%', justifyContent: 'center', marginTop: 12, fontSize: 12 }}>
            <FiCheckCircle size={13} color="var(--green)" /> Use local demo credentials
          </button>

          <div className="login-divider">
            <div className="login-divider-line" />
            <div className="login-divider-text">LOCAL ENVIRONMENT</div>
            <div className="login-divider-line" />
          </div>

          <div style={{ fontSize: 11, color: 'var(--text-dim)', textAlign: 'center', lineHeight: 1.7 }}>
            Running locally on <code style={{ color: 'var(--accent-bright)', fontFamily: 'monospace' }}>http://localhost:3000</code><br />
            No cloud resources are provisioned or billed.
          </div>
        </motion.div>
      </div>
    </>
  )
}
