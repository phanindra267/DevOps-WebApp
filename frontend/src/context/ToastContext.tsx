import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  ReactNode,
} from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { FiCheckCircle, FiInfo, FiX, FiXCircle } from 'react-icons/fi'

/* ─── Types ──────────────────────────────────────────────────────────── */

export type ToastType = 'success' | 'error' | 'info'

export interface ToastMessage {
  id: number
  type: ToastType
  message: string
}

export interface ToastApi {
  success: (message: string) => number
  error: (message: string) => number
  info: (message: string) => number
  dismiss: (id: number) => void
  toasts: ToastMessage[]
}

interface ToastContextValue extends ToastApi {
  /** True when ToastProvider is rendering its own viewport. Used by
   *  <ToastViewport /> to avoid rendering a second, duplicate viewport. */
  autoViewport: boolean
}

const noop = () => {}

const ToastContext = createContext<ToastContextValue>({
  success: () => 0,
  error: () => 0,
  info: () => 0,
  dismiss: noop,
  toasts: [],
  autoViewport: false,
})

const DURATION = 4000

/* ─── Visual config ──────────────────────────────────────────────────── */

const theme: Record<
  ToastType,
  { color: string; bg: string; border: string; Icon: typeof FiInfo; label: string }
> = {
  success: {
    color: 'var(--green, #34d399)',
    bg: 'var(--green-glow, rgba(52,211,153,0.14))',
    border: 'rgba(52,211,153,0.35)',
    Icon: FiCheckCircle,
    label: 'Success',
  },
  error: {
    color: 'var(--red, #f87171)',
    bg: 'var(--red-glow, rgba(248,113,113,0.14))',
    border: 'rgba(248,113,113,0.38)',
    Icon: FiXCircle,
    label: 'Error',
  },
  info: {
    color: 'var(--cyan, #22d3ee)',
    bg: 'var(--cyan-glow, rgba(34,211,238,0.14))',
    border: 'rgba(34,211,238,0.35)',
    Icon: FiInfo,
    label: 'Information',
  },
}

/* ─── Provider ───────────────────────────────────────────────────────── */

export interface ToastProviderProps {
  children: ReactNode
  /** Render the toast viewport automatically (default: true). Set to false
   *  if you prefer to mount <ToastViewport /> yourself somewhere in the tree. */
  autoViewport?: boolean
}

export function ToastProvider({ children, autoViewport = true }: ToastProviderProps) {
  const [toasts, setToasts] = useState<ToastMessage[]>([])
  const idRef = useRef(0)

  const dismiss = useCallback((id: number) => {
    setToasts((list) => list.filter((t) => t.id !== id))
  }, [])

  const push = useCallback((type: ToastType, message: string) => {
    const id = ++idRef.current
    setToasts((list) => [...list, { id, type, message }])
    return id
  }, [])

  const api = useMemo<ToastApi>(
    () => ({
      success: (message) => push('success', message),
      error: (message) => push('error', message),
      info: (message) => push('info', message),
      dismiss,
      toasts,
    }),
    [push, dismiss, toasts],
  )

  const value = useMemo<ToastContextValue>(
    () => ({ ...api, autoViewport }),
    [api, autoViewport],
  )

  return (
    <ToastContext.Provider value={value}>
      {children}
      {autoViewport && <ToastViewport __auto />}
    </ToastContext.Provider>
  )
}

/** Access the toast helpers: `const toast = useToast(); toast.success('Saved')`. */
export function useToast(): ToastApi {
  return useContext(ToastContext)
}

/* ─── Single toast card ──────────────────────────────────────────────── */

function ToastCard({ toast, onDismiss }: { toast: ToastMessage; onDismiss: (id: number) => void }) {
  const { color, bg, border, Icon, label } = theme[toast.type] ?? theme.info

  useEffect(() => {
    const timer = window.setTimeout(() => onDismiss(toast.id), DURATION)
    return () => window.clearTimeout(timer)
  }, [toast.id, onDismiss])

  return (
    <motion.div
      layout
      className={`toast toast-${toast.type}`}
      role={toast.type === 'error' ? 'alert' : 'status'}
      aria-label={`${label}: ${toast.message}`}
      initial={{ opacity: 0, x: 40, scale: 0.92 }}
      animate={{ opacity: 1, x: 0, scale: 1 }}
      exit={{ opacity: 0, x: 24, scale: 0.94, transition: { duration: 0.18 } }}
      transition={{ type: 'spring', stiffness: 360, damping: 30 }}
      style={{
        pointerEvents: 'auto',
        display: 'flex',
        alignItems: 'flex-start',
        gap: 11,
        width: 'min(360px, calc(100vw - 32px))',
        padding: '13px 14px 15px',
        borderRadius: 12,
        background: 'var(--card, #111827)',
        border: `1px solid ${border}`,
        borderLeft: `3px solid ${color}`,
        boxShadow: '0 12px 40px rgba(0,0,0,0.55), 0 0 22px rgba(0,0,0,0.25)',
        position: 'relative',
        overflow: 'hidden',
        color: 'var(--text, #f0f6ff)',
        fontFamily: 'inherit',
      }}
    >
      <span
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: 26,
          height: 26,
          borderRadius: 8,
          flexShrink: 0,
          background: bg,
          color,
        }}
      >
        <Icon size={16} />
      </span>

      <span style={{ flex: 1, minWidth: 0, fontSize: 13, lineHeight: 1.45, paddingTop: 3 }}>
        {toast.message}
      </span>

      <button
        type="button"
        aria-label="Dismiss notification"
        onClick={() => onDismiss(toast.id)}
        className="toast-close"
        style={{
          flexShrink: 0,
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: 22,
          height: 22,
          borderRadius: 6,
          border: 'none',
          background: 'transparent',
          color: 'var(--text-muted, #6b7a99)',
          cursor: 'pointer',
        }}
      >
        <FiX size={14} />
      </button>

      {/* auto-dismiss progress bar */}
      <motion.span
        aria-hidden="true"
        className="toast-progress"
        initial={{ scaleX: 1 }}
        animate={{ scaleX: 0 }}
        transition={{ duration: DURATION / 1000, ease: 'linear' }}
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          bottom: 0,
          height: 2,
          background: color,
          transformOrigin: 'left',
          opacity: 0.75,
        }}
      />
    </motion.div>
  )
}

/* ─── Viewport ───────────────────────────────────────────────────────── */

export interface ToastViewportProps {
  className?: string
  /** @internal – set by ToastProvider for its automatically mounted viewport. */
  __auto?: boolean
}

export function ToastViewport({ className, __auto }: ToastViewportProps) {
  const { toasts, dismiss, autoViewport } = useContext(ToastContext)

  // ToastProvider already mounts a viewport. Prevent a duplicate when a page
  // also renders <ToastViewport /> explicitly.
  if (autoViewport && !__auto) return null

  return (
    <div
      className={`toast-viewport${className ? ` ${className}` : ''}`}
      aria-live="polite"
      aria-atomic="false"
      style={{
        position: 'fixed',
        top: 20,
        right: 20,
        zIndex: 2000,
        display: 'flex',
        flexDirection: 'column',
        gap: 10,
        pointerEvents: 'none',
      }}
    >
      <AnimatePresence initial={false}>
        {toasts.map((toast) => (
          <ToastCard key={toast.id} toast={toast} onDismiss={dismiss} />
        ))}
      </AnimatePresence>
    </div>
  )
}
