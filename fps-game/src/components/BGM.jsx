// src/components/BGM.jsx
import { useEffect, useRef, useState } from 'react'
import { useGameStore } from '../store/UserStore.js'

export default function BGM({ src = '/sounds/bgm.mp3', volume = 0.3 }) {
  const audioRef  = useRef(null)
  const isLocked  = useGameStore((s) => s.isLocked)
  const [muted, setMuted] = useState(false)

  // Create audio element once
  useEffect(() => {
    const audio       = new Audio(src)
    audio.loop        = true
    audio.volume      = volume
    audio.preload     = 'auto'
    audioRef.current  = audio

    return () => {
      audio.pause()
      audio.src = ''
    }
  }, [src])

  // Play when game starts (player locks pointer), pause when ESC
  useEffect(() => {
    const audio = audioRef.current
    if (!audio) return

    if (isLocked) {
      audio.play().catch(() => {
        // Browser blocked autoplay — will try again on next user gesture
        const resume = () => {
          audio.play()
          window.removeEventListener('click', resume)
          window.removeEventListener('touchstart', resume)
        }
        window.addEventListener('click', resume, { once: true })
        window.addEventListener('touchstart', resume, { once: true })
      })
    } else {
      audio.pause()
    }
  }, [isLocked])

  // Mute toggle
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.muted = muted
    }
  }, [muted])

  // Only show mute button when game is running
  if (!isLocked) return null

  return (
    <button
      onClick={() => setMuted(m => !m)}
      style={{
        position: 'fixed',
        bottom: 10,
        left: '4%',
        transform: 'translateX(-50%)',
        marginTop: 50,     // sit below your existing top-center HUD panel
        zIndex: 20,
        background: 'rgba(0,10,25,0.82)',
        border: '1px solid rgba(0,180,220,0.3)',
        color: muted ? 'rgba(0,180,220,0.3)' : '#00d4ff',
        padding: '4px 14px',
        fontSize: 11,
        letterSpacing: 2,
        cursor: 'pointer',
        fontFamily: "'Courier New', monospace",
        pointerEvents: 'auto',
      }}
    >
      {muted ? 
    <p className='league-gothic text-white text-xl'>♪ OFF</p> : <p className='league-gothic text-white text-xl'>♪ ON</p> }
    </button>
  )
}