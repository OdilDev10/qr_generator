import React, { CSSProperties } from 'react'
import { Dialog, DialogContent, DialogTitle } from './ui/dialog'

const CustomModal = ({
  isOpen,
  onClose,
  title,
  children,
  styles,
  className,
}: {
  isOpen: boolean
  onClose: () => void
  title: React.ReactNode
  children: React.ReactNode
  styles?: CSSProperties
  className?: string
}) => {
  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent
        style={{
          ...styles,
        }}
        // className={className}
        className={`dark:bg-gray-700 bg-gray-100 ${className}`}
      >
        <DialogTitle>{title}</DialogTitle>
        {children}
      </DialogContent>
    </Dialog>
  )
}

export default CustomModal
