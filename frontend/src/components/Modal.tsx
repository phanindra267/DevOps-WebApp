import React from 'react'
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
  // If `open` prop is provided, respect it
  if (open === false) return null

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: 20,
          }}
        >
          <div className="modal-title">{title}</div>
          <button
            className="btn btn-sm btn-icon"
            onClick={onClose}
            type="button"
            style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}
          >
            <FiX size={16} />
          </button>
        </div>

        {children}

        <div className="modal-actions">
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
      </div>
    </div>
  )
}
