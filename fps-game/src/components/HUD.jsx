// src/components/HUD.jsx
import { useState } from 'react'
import { useGameStore } from '../store/UserStore.js'

const MAX_AMMO = 72

export default function HUD() {
  const { health, shield, energy, ammo, kills, isHit, GunChoose, isLocked } = useGameStore()
  const setLocked = useGameStore((s) => s.setLocked)

  const hpColor   = health > 50 ? '#00d4ff' : health > 25 ? '#ffaa00' : '#ff3333'
  const hpPct     = health
  const shieldPct = shield
  const energyPct = energy

  return (
    <>
      {/* ── Menu — shown when NOT locked ── */}
      {!isLocked && (
        <div
          style={{
            position: 'fixed', inset: 0,
            background: 'rgba(5,10,20,0.9)',
            display: 'flex', flexDirection: 'column',
            alignItems: 'center', justifyContent: 'center',
            zIndex: 50,
            fontFamily: "'Courier New', monospace",
            color: 'white',
            cursor: 'pointer',
          }}
          onClick={() => {
            // dispatch a click to canvas so PointerLockControls picks it up
            document.querySelector('canvas')?.requestPointerLock?.()
          }}
        >
          <h1 className="league-gothic" style={{ fontSize: 64, letterSpacing: 4, marginBottom: 8 }}>
          GUN GALE
          </h1>
          <p className="league-gothic" style={{ fontSize: 14, color: 'rgba(0,200,230,0.6)', letterSpacing: 2, marginBottom: 40 }}>
            ELIMINATE ALL TARGETS
          </p>

          <div className='league-gothic' style={{
            border: '1px solid rgba(0,180,220,0.4)',
            background: 'rgba(0,180,220,0.08)',
            padding: '14px 40px',
            fontSize: 40, letterSpacing: 2,
          }}>
            CLICK TO PLAY
          </div>

          <div style={{ marginTop: 30, fontSize: 12, color: 'rgba(255,255,255,0.4)', letterSpacing: 1, textAlign: 'center', lineHeight: 1.8 }}>
            <p>WASD — move &nbsp;&nbsp; SPACE — jump</p>
            <p>MOUSE — look &nbsp;&nbsp; CLICK — fire &nbsp;&nbsp; SCROLL — switch weapon</p>
            <p>ESC — pause</p>
          </div>
        </div>
      )}

      {/* ── In-game HUD — shown when locked ── */}
      {isLocked && (
        <div style={{
          position: 'fixed', inset: 0,
          pointerEvents: 'none', zIndex: 10,
          fontFamily: "'Courier New', monospace",
        }}>

          {/* Hit flash */}
          {isHit && (
            <div style={{
              position: 'absolute', inset: 0,
              outline: '3px solid rgba(255,0,0,0.65)',
              pointerEvents: 'none'
            }} />
          )}

          {/* Top right — objective */}
          <div style={{ background:'rgba(0,10,25,0.82)', border:'1px solid rgba(0,180,220,0.3)' }} className="text-white absolute right-5 top-5">
            <p className="tiktok-sans capitalize text-md px-6 py-2">
              <i className="ri-poker-diamonds-fill"></i> Objective - Kill all the ghosts in the surrounding
            </p>
          </div>

          {/* Top left — current weapon */}
          <div className="text-white capitalize mt-7 ml-7">
            <div className="h-30 w-60">
              <img className="w-full h-full object-cover" src={`./images/${GunChoose}.png`} alt={GunChoose} />
            </div>
            <p className="ml-7 league-gothic text-3xl">{GunChoose}</p>
          </div>

          {/* Bottom right — ammo + kills */}
          <div style={{
            position:'absolute', bottom:14, right:14,
            background:'rgba(0,10,25,0.82)', border:'1px solid rgba(0,180,220,0.3)',
            padding:'10px 14px', display:'flex', flexDirection:'column', alignItems:'flex-end', gap:6
          }}>
            <div className="flex items-center justify-center gap-2">
              <span className="league-gothic text-3xl" style={{ letterSpacing:2, color:'rgba(0,200,230,0.5)' }}>AMMO</span>
              <p className="text-5xl text-sky-700">∞</p>
            </div>

            <div style={{ display:'flex', gap:2 }}>
              {Array.from({ length: 15 }).map((_, i) => (
                <div key={i} style={{
                  width: 3, height: 9, borderRadius: 1,
                  background: i < Math.ceil(ammo / (MAX_AMMO / 15))
                    ? `rgba(0,180,220,${1 - i * 0.04})`
                    : 'rgba(0,180,220,0.1)'
                }} />
              ))}
            </div>

            <div style={{ borderTop:'1px solid rgba(0,180,220,0.2)', paddingTop:6, width:'100%', textAlign:'right' }}>
              <span className="league-gothic" style={{ letterSpacing:2, color:'rgba(0,200,230,0.5)' }}>KILLS  </span>
              <span style={{ fontSize:20, fontWeight:'bold', color:'#ff4444', letterSpacing:2 }}>{kills}</span>
            </div>
          </div>

          {/* Crosshair */}
          <div className="text-bold text-2xl text-white" style={{ position:'absolute', top:'50%', left:'50%', transform:'translate(-50%,-50%)' }}>
            <i className="ri-drag-move-line"></i>
          </div>
        </div>
      )}
    </>
  )
}