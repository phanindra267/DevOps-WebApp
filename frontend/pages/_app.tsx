import type { AppProps } from 'next/app'
import { useRouter } from 'next/router'
import { AuthProvider, useAuth } from '../src/context/AuthContext'
import Layout from '../src/components/Layout'
import '../styles/globals.css'
import { useEffect } from 'react'

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!isAuthenticated && router.pathname !== '/login') {
      router.push('/login')
    }
  }, [isAuthenticated, router])

  if (!isAuthenticated && router.pathname !== '/login') {
    return null
  }

  return <>{children}</>
}

function AppContent({ Component, pageProps }: AppProps) {
  const router = useRouter()

  if (router.pathname === '/login') {
    return <Component {...pageProps} />
  }

  return (
    <ProtectedRoute>
      <Layout>
        <Component {...pageProps} />
      </Layout>
    </ProtectedRoute>
  )
}

export default function App(props: AppProps) {
  return (
    <AuthProvider>
      <AppContent {...props} />
    </AuthProvider>
  )
}
