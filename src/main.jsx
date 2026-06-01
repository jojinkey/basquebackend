import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import Lenis from 'lenis'
import { registerSW } from 'virtual:pwa-register'
import { syncOfflineOrders } from './services/orderApi'

import './index.css'
import App from './App.jsx'
import { CartProvider } from './context/CartContext.jsx'

const lenis = new Lenis({
  duration: 1.4,
  easing: t => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
  smoothWheel: true,
  wheelMultiplier: 0.8,
  touchMultiplier: 1.2,
})

function raf(time) {
  lenis.raf(time)
  requestAnimationFrame(raf)
}

requestAnimationFrame(raf)

registerSW({
  immediate: true,
})

const trySyncOfflineOrders = async () => {
  try {
    await syncOfflineOrders()
  } catch (error) {
    console.log('Offline order sync failed:', error)
  }
}

trySyncOfflineOrders()

window.addEventListener('online', () => {
  trySyncOfflineOrders()
})

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <CartProvider>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </CartProvider>
  </StrictMode>
)