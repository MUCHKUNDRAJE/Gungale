// src/components/MobileControls.jsx
import { useRef, useEffect } from 'react'
import { useGameStore } from '../store/UserStore.js'

export default function MobileControls() {
  const joystickRef   = useRef(null)
  const stickRef       = useRef(null)
  const lookAreaRef    = useRef(null)
  const fireBtnRef     = useRef(null)
  const jumpBtnRef     = useRef(null)

  const joystickActive = useRef(false)
  const joystickTouchId = useRef(null)
  const lookTouchId     = useRef(null)
  const lastLook        = useRef({ x: 0, y: 0 })

  const isLocked = useGameStore((s) => s.isLocked)

  useEffect(() => {
    const joystick = joystickRef.current
    const stick    = stickRef.current
    const lookArea = lookAreaRef.current
    if (!joystick || !stick || !lookArea) return

    const JOY_RADIUS = 50   // max stick travel in px

    // ── Joystick (movement) ──────────────────────────────
    function getJoyCenter() {
      const rect = joystick.getBoundingClientRect()
      return { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 }
    }

    function onJoyStart(e) {
      const touch = e.changedTouches[0]
      joystickTouchId.current = touch.identifier
      joystickActive.current = true
      updateJoy(touch)
    }

    function updateJoy(touch) {
      const center = getJoyCenter()
      let dx = touch.clientX - center.x
      let dy = touch.clientY - center.y
      const dist = Math.min(Math.sqrt(dx * dx + dy * dy), JOY_RADIUS)
      const angle = Math.atan2(dy, dx)
      dx = Math.cos(angle) * dist
      dy = Math.sin(angle) * dist

      stick.style.transform = `translate(${dx}px, ${dy}px)`

      // Normalize -1 to 1, write to global so Player.jsx can read it
      window.__joystick = {
        x: dx / JOY_RADIUS,
        y: dy / JOY_RADIUS,
      }
    }

    function onJoyMove(e) {
      if (!joystickActive.current) return
      for (const touch of e.changedTouches) {
        if (touch.identifier === joystickTouchId.current) {
          updateJoy(touch)
        }
      }
    }

    function onJoyEnd(e) {
      for (const touch of e.changedTouches) {
        if (touch.identifier === joystickTouchId.current) {
          joystickActive.current = false
          joystickTouchId.current = null
          stick.style.transform = `translate(0px, 0px)`
          window.__joystick = { x: 0, y: 0 }
        }
      }
    }

    // ── Look area (camera rotation via drag) ─────────────
    function onLookStart(e) {
      const touch = e.changedTouches[0]
      lookTouchId.current = touch.identifier
      lastLook.current = { x: touch.clientX, y: touch.clientY }
    }

    function onLookMove(e) {
      for (const touch of e.changedTouches) {
        if (touch.identifier === lookTouchId.current) {
          const dx = touch.clientX - lastLook.current.x
          const dy = touch.clientY - lastLook.current.y
          lastLook.current = { x: touch.clientX, y: touch.clientY }

          window.__lookDelta = window.__lookDelta || { x: 0, y: 0 }
          window.__lookDelta.x += dx
          window.__lookDelta.y += dy
        }
      }
    }

    function onLookEnd(e) {
      for (const touch of e.changedTouches) {
        if (touch.identifier === lookTouchId.current) {
          lookTouchId.current = null
        }
      }
    }

    joystick.addEventListener('touchstart', onJoyStart, { passive: true })
    window.addEventListener('touchmove', onJoyMove, { passive: true })
    window.addEventListener('touchend', onJoyEnd, { passive: true })
    window.addEventListener('touchcancel', onJoyEnd, { passive: true })

    lookArea.addEventListener('touchstart', onLookStart, { passive: true })
    window.addEventListener('touchmove', onLookMove, { passive: true })
    window.addEventListener('touchend', onLookEnd, { passive: true })
    window.addEventListener('touchcancel', onLookEnd, { passive: true })

    return () => {
      joystick.removeEventListener('touchstart', onJoyStart)
      window.removeEventListener('touchmove', onJoyMove)
      window.removeEventListener('touchend', onJoyEnd)
      window.removeEventListener('touchcancel', onJoyEnd)

      lookArea.removeEventListener('touchstart', onLookStart)
      window.removeEventListener('touchmove', onLookMove)
      window.removeEventListener('touchend', onLookEnd)
      window.removeEventListener('touchcancel', onLookEnd)
    }
  }, [])

  // ── Fire button ─────────────────────────────────────────
  useEffect(() => {
    const btn = fireBtnRef.current
    if (!btn) return

    const start = (e) => { e.preventDefault(); window.__mobileFiring = true }
    const end   = (e) => { e.preventDefault(); window.__mobileFiring = false }

    btn.addEventListener('touchstart', start, { passive: false })
    btn.addEventListener('touchend', end, { passive: false })
    btn.addEventListener('touchcancel', end, { passive: false })

    return () => {
      btn.removeEventListener('touchstart', start)
      btn.removeEventListener('touchend', end)
      btn.removeEventListener('touchcancel', end)
    }
  }, [])

  // ── Jump button ─────────────────────────────────────────
  useEffect(() => {
    const btn = jumpBtnRef.current
    if (!btn) return

    const start = (e) => { e.preventDefault(); window.__mobileJump = true }
    const end   = (e) => { e.preventDefault(); window.__mobileJump = false }

    btn.addEventListener('touchstart', start, { passive: false })
    btn.addEventListener('touchend', end, { passive: false })

    return () => {
      btn.removeEventListener('touchstart', start)
      btn.removeEventListener('touchend', end)
    }
  }, [])

  if (!isLocked) return null

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 20, pointerEvents: 'none' }}>

      {/* Look area — right 60% of screen, invisible drag zone */}
      <div
        ref={lookAreaRef}
        style={{
          position: 'absolute',
          top: 0, right: 0,
          width: '60%', height: '100%',
          pointerEvents: 'auto',
          touchAction: 'none',
        }}
      />

      {/* Joystick — bottom left */}
      <div
        ref={joystickRef}
        style={{
          position: 'absolute',
          bottom: 100, left: 40,
          width: 110, height: 110,
          borderRadius: '50%',
          background: 'rgba(0,180,220,0.12)',
          border: '2px solid rgba(0,180,220,0.4)',
          pointerEvents: 'auto',
          touchAction: 'none',
        }}
      >
        <div
          ref={stickRef}
          style={{
            position: 'absolute',
            top: '50%', left: '50%',
            width: 50, height: 50,
            marginTop: -25, marginLeft: -25,
            borderRadius: '50%',
            background: 'rgba(0,212,255,0.7)',
            border: '2px solid rgba(0,212,255,0.9)',
            transition: 'transform 0.05s linear',
          }}
        />
      </div>

      {/* Jump button */}
      <div
        ref={jumpBtnRef}
        style={{
          position: 'absolute',
          bottom: 200, right: 100,
          width: 64, height: 64,
          borderRadius: '50%',
          background: 'rgba(0,180,220,0.15)',
          border: '2px solid rgba(0,180,220,0.4)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: '#00d4ff', fontSize: 11, letterSpacing: 1,
          pointerEvents: 'auto', touchAction: 'none',
          fontFamily: "'Courier New', monospace",
        }}
      >
        JUMP
      </div>

      {/* Fire button */}
      <div
        ref={fireBtnRef}
        style={{
          position: 'absolute',
          bottom: 100, right: 40,
          width: 80, height: 80,
          borderRadius: '50%',
          background: 'rgba(255,60,60,0.18)',
          border: '2px solid rgba(255,60,60,0.5)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: '#ff4444', fontSize: 13, letterSpacing: 1, fontWeight: 'bold',
          pointerEvents: 'auto', touchAction: 'none',
          fontFamily: "'Courier New', monospace",
        }}
      >
        FIRE
      </div>
    </div>
  )
}