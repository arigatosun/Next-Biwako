// src/app/components/ui/Modal.tsx
'use client'

import React, { ReactNode } from 'react'
import { X } from 'lucide-react'

interface ModalProps {
  children: ReactNode
  onClose: () => void
}

export default function Modal({ children, onClose }: ModalProps) {
  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
      <div className="bg-white rounded-lg shadow-lg w-full max-w-md p-6 relative">
        <button onClick={onClose} className="absolute top-3 right-3 text-gray-500 hover:text-gray-700">
          <X className="h-5 w-5" />
        </button>
        {children}
      </div>
    </div>
  )
}
