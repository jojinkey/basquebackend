import { createContext, useContext, useState, useCallback } from 'react'

const ModalContext = createContext(null)

export const ModalProvider = ({ children }) => {
  const [modal, setModal] = useState({ isOpen: false, type: null, prefill: {} })

  const openModal = useCallback((type, prefill = {}) => {
    setModal({ isOpen: true, type, prefill })
  }, [])

  const closeModal = useCallback(() => {
    setModal({ isOpen: false, type: null, prefill: {} })
  }, [])

  return (
    <ModalContext.Provider value={{ modal, openModal, closeModal }}>
      {children}
    </ModalContext.Provider>
  )
}

export const useModal = () => {
  const ctx = useContext(ModalContext)
  if (!ctx) throw new Error('useModal must be used within ModalProvider')
  return ctx
}
