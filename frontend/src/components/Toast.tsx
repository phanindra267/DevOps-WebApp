/**
 * Convenience re-exports so the toast system can be imported from either
 * `src/components/Toast` or `src/context/ToastContext`.
 */
export {
  ToastProvider,
  ToastViewport,
  useToast,
} from '../context/ToastContext'

export type {
  ToastApi,
  ToastMessage,
  ToastProviderProps,
  ToastType,
  ToastViewportProps,
} from '../context/ToastContext'
