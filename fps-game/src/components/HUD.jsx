// src/components/HUD.jsx
import { useGameStore } from '../store/userStore'

const MAX_AMMO = 72

export default function HUD() {
  const { health, shield, energy, ammo, kills, isHit , GunChoose} = useGameStore()

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
     
      {/* Top center — player ID */}

      <div style={{    background:'rgba(0,10,25,0.82)', border:'1px solid rgba(0,180,220,0.3)',}} className='text-white  absolute right-5 top-5'>
           
           <p className='tiktok-sans capitalize text-md px-6 py-2'> <i class="ri-poker-diamonds-fill"></i> Objective - Kills all the Ghost in the surrounding </p>
        </div>
      

      {/* ── Bottom Center — Health / Shield / Energy ── */}
     <div className='text-white capitalize  mt-7 ml-7'>
           <div  className=' h-30 w-60 '>
              <img className=' w-full h-full object-cover' src={`./images/${GunChoose}.png`} alt="" />
           </div>
           <p className='ml-7 league-gothic  text-3xl' >{GunChoose}</p>
        </div>


      {/* ── Bottom Right — Ammo + Kills ── */}
      <div style={{
        
        position:'absolute', bottom:14, right:14,
        background:'rgba(0,10,25,0.82)', border:'1px solid rgba(0,180,220,0.3)',
        padding:'10px 14px', display:'flex', flexDirection:'column', alignItems:'flex-end', gap:6
      }}>
         

       
        <div className='flex items-center justify-center  gap-2'>
          <span className='league-gothic  text-3xl' style={{ letterSpacing:2, color:'rgba(0,200,230,0.5)' }}>AMMO</span>
          <p className='text-5xl text-sky-700'>∞</p>
         
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
          <span className='league-gothic' style={{ letterSpacing:2, color:'rgba(0,200,230,0.5)' }}>KILLS  </span>
          <span style={{ fontSize:20, fontWeight:'bold', color:'#ff4444', letterSpacing:2 }}>{kills}</span>
        </div>
       
      </div>

      {/* ── Crosshair ── */}
      <div className=' text-bold text-2xl text-white ' style={{ position:'absolute', top:'50%', left:'50%', transform:'translate(-50%,-50%)' }}>
       <i class="ri-drag-move-line"></i>
      </div>

      {/* Bottom border */}
        </div>
  )
}