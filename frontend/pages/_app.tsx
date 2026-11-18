import type { AppProps } from 'next/app'
import { useRouter } from 'next/router'
import { AuthProvider, useAuth } from '../src/context/AuthContext'
import { ToastProvider } from '../src/context/ToastContext'
import Layout from '../src/components/Layout'
import '../styles/globals.css'
import { useEffect } from 'react'
import { AnimatePresence, motion } from 'framer-motion'

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, ready } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (ready && !isAuthenticated && router.pathname !== '/login') {
      router.push('/login')
    }
  }, [ready, isAuthenticated, router])

  // Identical markup on server and client until the local session is restored.
  if (!ready) {
    return (
      <div style={{
        minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: 'radial-gradient(circle at 50% 40%, #101a31 0%, #060810 70%)',
        color: '#38bdf8', fontFamily: 'sans-serif', flexDirection: 'column', gap: 14,
      }}>
        <div className="status-dot ping-dot" style={{ width: 12, height: 12, background: '#38bdf8' }} />
        <span style={{ letterSpacing: '.16em', textTransform: 'uppercase', fontSize: 12, fontWeight: 700 }}>
          Restoring secure session
        </span>
      </div>
    )
  }

  if (!isAuthenticated && router.pathname !== '/login') return null
  return <>{children}</>
}

function AppContent({ Component, pageProps }: AppProps) {
  const router = useRouter()

  // Scroll-reveal for any element marked .reveal (progressive enhancement).
  useEffect(() => {
    const timer = setTimeout(() => {
      const nodes = document.querySelectorAll('.reveal:not(.is-visible)')
      if (!('IntersectionObserver' in window)) {
        nodes.forEach((n) => n.classList.add('is-visible'))
        return
      }
      const io = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-visible')
            io.unobserve(entry.target)
          }
        })
      }, { threshold: 0.08, rootMargin: '0px 0px -40px 0px' })
      nodes.forEach((n) => io.observe(n))
    }, 120)
    return () => clearTimeout(timer)
  }, [router.pathname])

  if (router.pathname === '/login') {
    return (
      <AnimatePresence mode="wait">
        <motion.div key="login" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          transition={{ duration: .3 }}>
          <Component {...pageProps} />
        </motion.div>
      </AnimatePresence>
    )
  }

  return (
    <ProtectedRoute>
      <Layout>
        <AnimatePresence mode="wait">
          <motion.div key={router.pathname}
            initial={{ opacity: 0, y: 14, filter: 'blur(4px)' }}
            animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
            exit={{ opacity: 0, y: -8, filter: 'blur(3px)' }}
            transition={{ duration: .3, ease: [0.16, 1, 0.3, 1] }}
            className="ui-section">
            <Component {...pageProps} />
          </motion.div>
        </AnimatePresence>
      </Layout>
    </ProtectedRoute>
  )
}

export default function App(props: AppProps) {
  return (
    <ToastProvider>
      <AuthProvider>
        <AppContent {...props} />
      </AuthProvider>
    </ToastProvider>
  )
}
