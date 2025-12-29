import React, { ReactNode } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import './modal.css'

interface ModalProps {
  open: boolean
  title?: ReactNode
  children?: ReactNode
  footer?: ReactNode
  cancelText?: string
  okText?: string
  onCancel?: () => void
  onOk?: () => void
  width?: number
}

const Modal: React.FC<ModalProps> = ({
  open,
  title,
  children,
  footer,
  cancelText = 'Cancel',
  okText = 'OK',
  onCancel,
  onOk,
  width = 530,
}) => {
  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onCancel?.()}>
      <DialogContent className="update-modal-content" style={{ maxWidth: width }}>
        {title && (
          <DialogHeader>
            <DialogTitle className="update-modal-title">{title}</DialogTitle>
          </DialogHeader>
        )}
        
        <div className="update-modal-body">{children}</div>
        
        {typeof footer !== 'undefined' ? (
          footer !== null && (
            <DialogFooter className="update-modal-footer">
              <Button variant="outline" onClick={onCancel}>
                {cancelText}
              </Button>
              <Button onClick={onOk} className="bg-orange-500 hover:bg-orange-600">
                {okText}
              </Button>
            </DialogFooter>
          )
        ) : null}
      </DialogContent>
    </Dialog>
  )
}

export default Modal
