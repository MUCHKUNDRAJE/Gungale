// src/components/Loader.jsx
import { useProgress } from '@react-three/drei'
import { useEffect, useState } from 'react'

export default function Loader() {
  const { progress, active } = useProgress()
  const [show, setShow] = useState(true)

  useEffect(() => {
    if (!active && progress === 100) {
      setTimeout(() => setShow(false), 600)
    }
  }, [active, progress])

  if (!show) return null

  return (
    <div style={{
      position: 'fixed', inset: 0,
      background: 'rgba(5,10,20,1)',
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      zIndex: 200,
      fontFamily: "'Courier New', monospace",
      color: 'white',
      transition: 'opacity 0.5s ease',
      opacity: !active && progress === 100 ? 0 : 1,
    }}>
      <h1 className="league-gothic" style={{
        fontSize: 64, letterSpacing: 4, marginBottom: 4,
        color: '#00d4ff', textShadow: '0 0 30px #00d4ff88',
      }}>
        GUN GALE
      </h1>

      <p className="league-gothic" style={{
        fontSize: 13, letterSpacing: 3,
        color: 'rgba(0,200,230,0.5)', marginBottom: 48,
      }}>
        LOADING ASSETS
      </p>

      {/* Bar track */}
      <div style={{
        width: 280, height: 10,
        background: 'rgba(0,180,220,0.12)',
      
        marginBottom: 12,
      }}>
        <div style={{
          height: '100%',
          width: `${progress}%`,
          background: 'linear-gradient(90deg, #00d4ff88, #00d4ff)',

          transition: 'width 0.3s ease',
        }} />
      </div>

      <p className="league-gothic text-xl" style={{
       
        color: 'rgba(0,200,230,0.4)',
      }}>
        {Math.floor(progress)}%
      </p>
    </div>
  )
}