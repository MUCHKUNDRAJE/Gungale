import { useEffect, useRef } from 'react'
import { useGameStore } from '../store/UserStore.js'

const MAX_AMMO = 72

export default function HUD() {
  const { health, shield, energy, ammo, kills, isHit, GunChoose, isLocked, isGameOver } = useGameStore()

  const isCritical = health <= 25
  const hpColor    = health > 50 ? '#28992c' : health > 25 ? '#ffaa00' : '#ff3333'
  const hpPct      = health / 100

  // ── Loss sound ───────────────────────────────────────
  const lossSoundPlayed = useRef(false)
  useEffect(() => {
    if (isGameOver && !lossSoundPlayed.current) {
      lossSoundPlayed.current = true
      const audio = new Audio('/sounds/game_over.mp3')
      audio.volume = 0.8
      audio.play().catch(() => {})
    }
  }, [isGameOver])

  return (
    <>
      <style>{`
        @keyframes criticalPulse {
          0%, 100% { opacity: 1; }
          50%       { opacity: 0.3; }
        }
        @keyframes barFlash {
          0%, 100% { opacity: 1; }
          50%       { opacity: 0.4; }
        }
        @keyframes gameOverFade {
          from { opacity: 0; transform: scale(0.95); }
          to   { opacity: 1; transform: scale(1); }
        }
      `}</style>

      {/* ── Game Over screen ── */}
      {isGameOver && (
        <div style={{
          position: 'fixed', inset: 0,
          background: 'rgba(5,0,0,0.92)',
          display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center',
          zIndex: 100,
          fontFamily: "'Courier New', monospace",
          color: 'white',
          animation: 'gameOverFade 0.6s ease forwards',
        }}>
          <h1 className="league-gothic" style={{
            fontSize: 100,
            letterSpacing: 6,
            color: '#ff2222',
            textShadow: '0 0 40px #ff000088',
            marginBottom: 8,
          }}>
            GAME OVER
          </h1>

          <p className="league-gothic" style={{
            fontSize: 18,
            color: 'rgba(255,100,100,0.6)',
            letterSpacing: 3,
            marginBottom: 12,
          }}>
            YOU WERE ELIMINATED
          </p>

          <p className="league-gothic" style={{
            fontSize: 24,
            color: 'rgba(255,200,200,0.5)',
            letterSpacing: 2,
            marginBottom: 48,
          }}>
            KILLS: {kills}
          </p>

          <button
            className="league-gothic"
            onClick={() => window.location.reload()}
            style={{
              border: '1px solid rgba(255,50,50,0.5)',
              background: 'rgba(255,30,30,0.12)',
              color: 'white',
              padding: '14px 60px',
              fontSize: 36,
              letterSpacing: 3,
              cursor: 'pointer',
              transition: 'background 0.2s',
            }}
            onMouseEnter={e => e.target.style.background = 'rgba(255,30,30,0.28)'}
            onMouseLeave={e => e.target.style.background = 'rgba(255,30,30,0.12)'}
          >
            PLAY AGAIN
          </button>
        </div>
      )}

      {/* ── Menu — shown when NOT locked ── */}
      {!isLocked && !isGameOver && (
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
          onClick={() => document.querySelector('canvas')?.requestPointerLock?.()}
        >
          <h1 className="league-gothic" style={{ fontSize: 64, letterSpacing: 4, marginBottom: 8 }}>
            GUN GALE
          </h1>
          <p className="league-gothic" style={{ fontSize: 14, color: 'rgba(0,200,230,0.6)', letterSpacing: 2, marginBottom: 40 }}>
            ELIMINATE ALL TARGETS
          </p>
          <div className="league-gothic" style={{
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
          <h1 className="tiktok-sans mt-10 capitalize" style={{ fontSize: 12 }}>
            A single Player FPS game Created by Muchkundraje Thote
          </h1>
        </div>
      )}

      {/* ── In-game HUD ── */}
      {isLocked && !isGameOver && (
        <div style={{
          position: 'fixed', inset: 0,
          pointerEvents: 'none', zIndex: 10,
          fontFamily: "'Courier New', monospace",
        }}>
          {isHit && (
            <div style={{
              position: 'absolute', inset: 0,
              outline: '3px solid rgba(255,0,0,0.65)',
              pointerEvents: 'none',
            }} />
          )}

          {isCritical && (
            <div style={{
              position: 'absolute', inset: 0,
              boxShadow: 'inset 0 0 200px 80px rgba(255,0,0,0.18)',
              animation: 'criticalPulse 0.8s ease-in-out infinite',
              pointerEvents: 'none',
            }} />
          )}

          <div style={{ background: 'rgba(0,10,25,0.82)', border: '1px solid rgba(0,180,220,0.3)' }}
            className="text-white absolute right-5 top-5">
            <p className="tiktok-sans capitalize text-md px-6 py-2">
              <i className="ri-poker-diamonds-fill"></i> Objective - Kill all the ghosts in the surrounding
            </p>
          </div>

          <div className="text-white capitalize mt-7 ml-7">
            <div className="h-30 w-60">
              <img className="w-full h-full object-cover" src={`./images/${GunChoose}.png`} alt={GunChoose} />
            </div>
            <p className="ml-7 league-gothic text-3xl">{GunChoose}</p>
          </div>

          <div style={{
            position: 'absolute', bottom: 14, right: 14,
            background: 'rgba(0,10,25,0.82)', border: '1px solid rgba(0,180,220,0.3)',
            padding: '10px 14px', display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 6,
          }}>
            <div className="flex items-center justify-center gap-2">
              <span className="league-gothic text-3xl" style={{ letterSpacing: 2, color: 'rgba(0,200,230,0.5)' }}>AMMO</span>
              <p className="text-5xl text-sky-700">∞</p>
            </div>
            <div style={{ display: 'flex', gap: 2 }}>
              {Array.from({ length: 15 }).map((_, i) => (
                <div key={i} style={{
                  width: 3, height: 9, borderRadius: 1,
                  background: i < Math.ceil(ammo / (MAX_AMMO / 15))
                    ? `rgba(0,180,220,${1 - i * 0.04})`
                    : 'rgba(0,180,220,0.1)',
                }} />
              ))}
            </div>
            <div style={{ borderTop: '1px solid rgba(0,180,220,0.2)', paddingTop: 6, width: '100%', textAlign: 'right' }}>
              <span className="league-gothic" style={{ letterSpacing: 2, color: 'rgba(0,200,230,0.5)' }}>KILLS  </span>
              <span style={{ fontSize: 20, fontWeight: 'bold', color: '#ff4444', letterSpacing: 2 }}>{kills}</span>
            </div>
          </div>

          <div className="text-bold text-2xl text-white"
            style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)' }}>
            <i className="ri-drag-move-line"></i>
          </div>

          <div className="absolute right-10 top-20">
            <div className="flex flex-col gap-1">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono font-bold ml-8" style={{ color: hpColor }}>
                  <p className="league-gothic [-webkit-text-stroke:0.3px_white] text-7xl">
                    {Math.ceil(health)}
                  </p>
                </span>
              </div>
              <div className="flex items-center justify-between perspective-dramatic gap-5">
                <span className="text-2xl league-gothic font-bold tracking-widest -translate-y-2 uppercase"
                  style={{ color: 'white' }}>
                  HP
                </span>
                <div className="relative w-40 h-6 overflow-hidden translate-z-4 -translate-y-2 rotate-x-20"
                  style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid white' }}>
                  <div
                    className="absolute left-0 top-0 h-full border border-white"
                    style={{
                      width: `${hpPct * 100}%`,
                      background: `linear-gradient(90deg, ${hpColor}99, ${hpColor})`,
                      boxShadow: `0 0 8px ${hpColor}`,
                      transition: 'width 0.2s ease, background 0.4s ease',
                      animation: isCritical ? 'barFlash 0.8s ease-in-out infinite' : 'none',
                    }}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}