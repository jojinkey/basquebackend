import { useEffect, useRef, useState } from 'react'

const CustomCursor = () => {
  const dotRef = useRef(null)
  const ringRef = useRef(null)
  const mouse = useRef({ x: 0, y: 0 })
  const ringPos = useRef({ x: 0, y: 0 })
  const rafId = useRef(null)
  const [cursorState, setCursorState] = useState('default')

  useEffect(() => {
    const onMove = (e) => {
      mouse.current = { x: e.clientX, y: e.clientY }
      if (dotRef.current) {
        dotRef.current.style.transform = `translate(${e.clientX}px, ${e.clientY}px) translate(-50%, -50%)`
      }
    }

    const lerp = (a, b, t) => a + (b - a) * t

    const animate = () => {
      ringPos.current.x = lerp(ringPos.current.x, mouse.current.x, 0.12)
      ringPos.current.y = lerp(ringPos.current.y, mouse.current.y, 0.12)
      if (ringRef.current) {
        ringRef.current.style.transform = `translate(${ringPos.current.x}px, ${ringPos.current.y}px) translate(-50%, -50%)`
      }
      rafId.current = requestAnimationFrame(animate)
    }

    const onEnterInteractive = (e) => {
      const el = e.target
      if (el.tagName === 'VIDEO') setCursorState('video')
      else if (el.tagName === 'A' || el.tagName === 'BUTTON' || el.closest('button') || el.closest('a')) setCursorState('hovering')
    }

    const onLeaveInteractive = () => setCursorState('default')

    window.addEventListener('mousemove', onMove)
    document.querySelectorAll('a, button, video').forEach(el => {
      el.addEventListener('mouseenter', onEnterInteractive)
      el.addEventListener('mouseleave', onLeaveInteractive)
    })

    // MutationObserver to attach on new elements
    const observer = new MutationObserver(() => {
      document.querySelectorAll('a, button, video').forEach(el => {
        el.removeEventListener('mouseenter', onEnterInteractive)
        el.removeEventListener('mouseleave', onLeaveInteractive)
        el.addEventListener('mouseenter', onEnterInteractive)
        el.addEventListener('mouseleave', onLeaveInteractive)
      })
    })
    observer.observe(document.body, { childList: true, subtree: true })

    rafId.current = requestAnimationFrame(animate)

    return () => {
      window.removeEventListener('mousemove', onMove)
      cancelAnimationFrame(rafId.current)
      observer.disconnect()
    }
  }, [])

  const dotStyle = {
    position: 'fixed',
    top: 0,
    left: 0,
    width: cursorState === 'hovering' ? '0px' : '8px',
    height: cursorState === 'hovering' ? '0px' : '8px',
    background: 'var(--amber)',
    borderRadius: '50%',
    pointerEvents: 'none',
    zIndex: 99999,
    willChange: 'transform',
    transition: 'width 0.2s ease, height 0.2s ease',
  }

  const ringSize = cursorState === 'video' ? '72px' : cursorState === 'hovering' ? '56px' : '36px'
  const ringStyle = {
    position: 'fixed',
    top: 0,
    left: 0,
    width: ringSize,
    height: ringSize,
    border: `1.5px solid var(--amber)`,
    background: cursorState !== 'default' ? 'var(--amber-glow)' : 'var(--amber-glow)',
    borderRadius: '50%',
    pointerEvents: 'none',
    zIndex: 99998,
    willChange: 'transform',
    transition: 'width 0.3s var(--ease-out), height 0.3s var(--ease-out)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  }

  return (
    <>
      <div ref={dotRef} style={dotStyle} />
      <div ref={ringRef} style={ringStyle}>
        {cursorState === 'video' && (
          <span style={{
            fontFamily: 'var(--font-sc)',
            fontSize: '0.55rem',
            color: 'var(--amber)',
            letterSpacing: '0.1em',
            pointerEvents: 'none',
          }}>PLAY</span>
        )}
      </div>
    </>
  )
}

export default CustomCursor
