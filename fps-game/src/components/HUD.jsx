// src/components/HUD.jsx
import { useGameStore } from '../store/userStore'

const MAX_AMMO = 72

export default function HUD() {
  const { health, shield, energy, ammo, kills, isHit } = useGameStore()

  const hpColor   = health > 50 ? '#00d4ff' : health > 25 ? '#ffaa00' : '#ff3333'
  const hpPct     = health
  const shieldPct = shield
  const energyPct = energy

  return (
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

      {/* Top border */}
      <div style={{ position:'absolute', top:0, left:0, right:0, height:1, background:'rgba(0,180,220,0.4)' }} />

      {/* Top center — player ID */}
      <div style={{
        position:'absolute', top:14, left:'50%', transform:'translateX(-50%)',
        background:'rgba(0,10,25,0.82)', border:'1px solid rgba(0,180,220,0.3)',
        padding:'5px 20px', whiteSpace:'nowrap'
      }}>
        <span style={{ fontSize:10, letterSpacing:2, color:'rgba(0,200,230,0.6)' }}>
          ARMOUR BIO · A23KKA0007FALCON
        </span>
      </div>

      

      {/* ── Bottom Center — Health / Shield / Energy ── */}
   

      {/* ── Bottom Right — Ammo + Kills ── */}
      <div style={{
        position:'absolute', bottom:14, right:14,
        background:'rgba(0,10,25,0.82)', border:'1px solid rgba(0,180,220,0.3)',
        padding:'10px 14px', display:'flex', flexDirection:'column', alignItems:'flex-end', gap:6
      }}>
        <div style={{ display:'flex', alignItems:'baseline', gap:8 }}>
          <span style={{ fontSize:9, letterSpacing:2, color:'rgba(0,200,230,0.5)' }}>AMMO</span>
          <span style={{ fontSize:28, fontWeight:'bold', color: ammo > 20 ? '#00d4ff' : '#ff4444', letterSpacing:3 }}>
            {String(Math.round(ammo)).padStart(3, '0')}
          </span>
        </div>

        {/* Ammo pips */}
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
          <span style={{ fontSize:9, letterSpacing:2, color:'rgba(0,200,230,0.5)' }}>KILLS  </span>
          <span style={{ fontSize:20, fontWeight:'bold', color:'#ff4444', letterSpacing:2 }}>{kills}</span>
        </div>
      </div>

      {/* ── Crosshair ── */}
      <div className='text-bold ' style={{ position:'absolute', top:'50%', left:'50%', transform:'translate(-50%,-50%)' }}>
       +
      </div>

      {/* Bottom border */}
      <div style={{ position:'absolute', bottom:0, left:0, right:0, height:1, background:'rgba(0,180,220,0.2)' }} />
    </div>
  )
}