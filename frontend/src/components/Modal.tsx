import React, { useEffect, useId, useRef } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { FiX } from 'react-icons/fi'

interface ModalProps {
  title: string
  onClose: () => void
  onConfirm?: () => void
  confirmLabel?: string
  confirmClass?: string
  children: React.ReactNode
  loading?: boolean
  open?: boolean  // optional – controls conditional rendering from parent
}

export default function Modal({
  title,
  onClose,
  onConfirm,
  confirmLabel = 'Confirm',
  confirmClass = 'btn-primary',
  children,
  loading,
  open,
}: ModalProps) {
  // Backwards compatible: when `open` is omitted the modal is visible.
  // When explicitly `false`, it is hidden (and animated out).
  const visible = open !== false
  const titleId = useId()
  const closeButtonRef = useRef<HTMLButtonElement>(null)

  /* ESC to close + body scroll lock while visible. */
  useEffect(() => {
    if (!visible) return

    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', handleKey)

    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    return () => {
      document.removeEventListener('keydown', handleKey)
      document.body.style.overflow = previousOverflow
    }
  }, [visible, onClose])

  /* Focus the close button when the dialog opens. */
  useEffect(() => {
    if (visible) {
      const t = window.setTimeout(() => closeButtonRef.current?.focus(), 0)
      return () => window.clearTimeout(t)
    }
  }, [visible])

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          className="modal-overlay"
          onClick={onClose}
          // Neutralise the legacy CSS keyframes so they don't fight framer-motion.
          style={{ animation: 'none' }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.18 }}
        >
          <motion.div
            className="modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby={titleId}
            onClick={(e) => e.stopPropagation()}
            initial={{ opacity: 0, scale: 0.94, y: 24 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 12 }}
            transition={{ type: 'spring', stiffness: 320, damping: 26 }}
            style={{
              animation: 'none',
              display: 'flex',
              flexDirection: 'column',
              width: 'min(580px, 92vw)',
              minWidth: 0,
              maxWidth: 'min(580px, 92vw)',
              maxHeight: '85vh',
              overflow: 'hidden',
            }}
          >
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'flex-start',
                gap: 16,
                marginBottom: 16,
                flexShrink: 0,
              }}
            >
              <div className="modal-title" id={titleId} style={{ marginBottom: 0 }}>
                {title}
              </div>
              <button
                ref={closeButtonRef}
                className="btn btn-sm btn-icon"
                onClick={onClose}
                type="button"
                aria-label="Close dialog"
                style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}
              >
                <FiX size={16} />
              </button>
            </div>

            <div style={{ flex: 1, minHeight: 0, overflowY: 'auto', paddingRight: 4 }}>
              {children}
            </div>

            <div className="modal-actions" style={{ flexShrink: 0 }}>
              <button className="btn" onClick={onClose} type="button">
                Cancel
              </button>
              {onConfirm && (
                <button
                  className={`btn ${confirmClass}`}
                  onClick={onConfirm}
                  disabled={loading}
                  type="button"
                >
                  {loading ? '…' : confirmLabel}
                </button>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
