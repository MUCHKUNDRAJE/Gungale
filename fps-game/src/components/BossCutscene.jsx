// src/components/BossCutscene.jsx
import { useEffect, useRef, useState } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { useGLTF } from '@react-three/drei'
import { useGameStore } from '../store/UserStore.js'

const TOTAL_ENEMIES = 18

// ── Spinning boss model inside mini canvas ────────────────
function SpinningBoss() {
  const { scene } = useGLTF('/models/boss.glb')
  const ref       = useRef()
  const clone     = useRef(scene.clone(true)).current

  useFrame((_, delta) => {
    if (ref.current) ref.current.rotation.y += delta * 0.9
  })

  return (
    <primitive
      ref={ref}
      object={clone}
      scale={0.3}               // ← tune this to your boss size
      position={[0, -1, 0]}  // ← adjust vertical position
    />
  )
}

useGLTF.preload('/models/boss.glb')

export default function BossCutscene() {
  const kills         = useGameStore((s) => s.kills)
  const cutscene      = useGameStore((s) => s.cutscenePlaying)
  const setCutscene   = useGameStore((s) => s.setCutscene)
  const setBossActive = useGameStore((s) => s.setBossActive)

  const [phase, setPhase]       = useState('idle')
  const [shake, setShake]       = useState(false)
  const [showText, setShowText] = useState('')
  const [bossVisible, setBossVisible] = useState(false)
  const [bossY, setBossY]       = useState(0)
  const animFrame               = useRef(null)
  const triggered               = useRef(false)

  useEffect(() => {
    if (kills >= TOTAL_ENEMIES && !triggered.current) {
      triggered.current = true
      setCutscene(true)
      setPhase('rumble')
    }
  }, [kills])

  useEffect(() => {
    if (phase === 'idle') return

    if (phase === 'rumble') {
      setShake(true)
      setShowText('THE GROUND TREMBLES...')
      setTimeout(() => setPhase('emerge'), 2200)
    }

    if (phase === 'emerge') {
      setShake(false)
      setBossVisible(true)
      setBossY(0)
      setShowText('SOMETHING RISES FROM BELOW...')

      let start = null
      const duration = 2500
      const animate = (ts) => {
        if (!start) start = ts
        const p      = Math.min((ts - start) / duration, 1)
        const eased  = 1 - Math.pow(1 - p, 3)
        setBossY(eased)
        if (p < 1) animFrame.current = requestAnimationFrame(animate)
        else setPhase('roar')
      }
      animFrame.current = requestAnimationFrame(animate)
    }

    if (phase === 'roar') {
      setShowText('')
      setTimeout(() => setShowText('⚠ THE PHANTOM OVERLORD AWAKENS ⚠'), 300)
      setTimeout(() => setShowText('YOUR SOUL WILL BE DEVOURED'), 1800)
      setTimeout(() => setPhase('done'), 3500)
    }

    if (phase === 'done') {
      setShowText('')
      setTimeout(() => {
        setCutscene(false)
        setBossActive(true)
      }, 600)
    }

    return () => {
      if (animFrame.current) cancelAnimationFrame(animFrame.current)
    }
  }, [phase])

  if (!cutscene) return null

  const bossTranslate = `translateY(${(1 - bossY) * 120}%)`

  return (
    <div style={{
      position: 'fixed', inset: 0,
      background: 'rgba(0,0,0,0.88)',
      zIndex: 200,
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'flex-end',
      fontFamily: "'Courier New', monospace",
      overflow: 'hidden',
      animation: shake ? 'shake 0.15s infinite' : 'none',
    }}>

      <style>{`
        @keyframes shake {
          0%,100% { transform: translate(0,0); }
          25%      { transform: translate(-6px, 3px); }
          50%      { transform: translate(6px, -3px); }
          75%      { transform: translate(-3px, 6px); }
        }
        @keyframes redPulse {
          0%,100% { text-shadow: 0 0 30px #ff0000aa; }
          50%      { text-shadow: 0 0 80px #ff0000ff, 0 0 20px #ff4444; }
        }
        @keyframes flicker {
          0%,100% { opacity:1; }
          45%      { opacity:0.85; }
          50%      { opacity:0.6; }
          55%      { opacity:0.9; }
        }
        @keyframes groundCrack {
          from { transform: scaleX(0); opacity:0; }
          to   { transform: scaleX(1); opacity:1; }
        }
        @keyframes bossGlow {
          0%,100% { filter: drop-shadow(0 0 20px #ff000088); }
          50%      { filter: drop-shadow(0 0 60px #ff0000ff) drop-shadow(0 0 20px #aa0000); }
        }
      `}</style>

      {/* Ground crack */}
      {bossVisible && (
        <div style={{
          position: 'absolute', bottom: '28%', left: '50%',
          transform: 'translateX(-50%)',
          width: 300, height: 8,
          background: 'radial-gradient(ellipse, #ff4400 0%, #ff000088 40%, transparent 70%)',
          animation: 'groundCrack 0.5s ease forwards',
          borderRadius: 4,
          boxShadow: '0 0 30px #ff440088',
        }} />
      )}

      {/* Ground glow */}
      {bossVisible && (
        <div style={{
          position: 'absolute', bottom: '22%', left: '50%',
          transform: 'translateX(-50%)',
          width: 500, height: 120,
          background: 'radial-gradient(ellipse, rgba(200,0,0,0.4) 0%, transparent 70%)',
          borderRadius: '50%',
          animation: 'bossGlow 1.2s ease-in-out infinite',
        }} />
      )}

      {/* ── Boss GLB rendered in mini Canvas ── */}
      {bossVisible && (
        <div style={{
          position: 'absolute',
          bottom: '20%',
          left: '50%',
          transform: `translateX(-50%) ${bossTranslate}`,
          width: 600,
          height: 500,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          animation: phase === 'roar' ? 'bossGlow 0.8s ease-in-out infinite' : 'none',
        }}>

          {/* Mini R3F Canvas — transparent bg so cutscene bg shows through */}
          <Canvas
            camera={{ position: [0, 1.5, 4], fov: 45 }}
            style={{
              width: '100%',
              height: '100%',
              background: 'transparent',
            }}
            gl={{
              alpha: true,          // transparent background
              antialias: true,
              preserveDrawingBuffer: false,
            }}
          >
            {/* Red dramatic lighting */}
            <ambientLight intensity={0.3} />
            <directionalLight position={[2, 4, 2]}   intensity={2}   color="#ff4444" />
            <directionalLight position={[-2, 2, -2]} intensity={1}   color="#ff2200" />
            <pointLight       position={[0, 2, 3]}   intensity={3}   color="#ff0000" distance={8} />
            <pointLight       position={[0, -1, 2]}  intensity={1.5} color="#aa0000" distance={6} />

            <SpinningBoss />
          </Canvas>

          <p style={{
            marginTop: 0,
            fontSize: 13,
            letterSpacing: 3,
            color: '#ff4444',
            opacity: 0.85,
            animation: 'flicker 2s infinite',
          }}>
            PHANTOM OVERLORD
          </p>
        </div>
      )}

      {/* Cinematic bars */}
      <div style={{ position:'absolute', top:0,    left:0, right:0, height:80, background:'#000' }} />
      <div style={{ position:'absolute', bottom:0, left:0, right:0, height:80, background:'#000' }} />

      {/* Center text */}
      <div className='league-gothic text-bold whitespace-nowrap' style={{
        position: 'absolute', top: '50%', left: '50%',
        transform: 'translate(-50%, -50%)',
        textAlign: 'center',
      }}>
        {showText && (
          <p style={{
            fontSize: showText.includes('OVERLORD') ? 48 : 28,
            letterSpacing: 4,
            color: showText.includes('OVERLORD') ? '#ff2222' : 'rgba(255,200,200,0.8)',
            animation: showText.includes('OVERLORD')
              ? 'redPulse 0.8s ease-in-out infinite'
              : 'flicker 1.5s infinite',
            textTransform: 'uppercase',
            maxWidth: 600,
            lineHeight: 1.6,
          }}>
            {showText}
          </p>
        )}
      </div>

      {/* Skip */}
      <div
        style={{
          position: 'absolute', top: 90, right: 24,
          color: 'rgba(255,255,255,0.3)', fontSize: 11,
          letterSpacing: 2, cursor: 'pointer',
          pointerEvents: 'auto',
        }}
        onClick={() => {
          if (animFrame.current) cancelAnimationFrame(animFrame.current)
          setCutscene(false)
          setBossActive(true)
        }}
      >
        SKIP ▶
      </div>
    </div>
  )
}