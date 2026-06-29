// src/components/HUD.jsx
export default function HUD() {
  return (
    <div style={{
      position: 'fixed', inset: 0,
      pointerEvents: 'none', zIndex: 10
    }}>
      {/* Crosshair */}
      <div style={{
        position: 'absolute',
        top: '50%', left: '50%',
        transform: 'translate(-50%, -50%)',
        width: 20, height: 20,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        color: 'rgba(255,255,255,0.8)', fontSize: 24
      }}>+</div>

      {/* Instructions */}
      <div style={{
        position: 'absolute', bottom: 20, left: 20,
        color: 'white', fontSize: 14,
        background: 'rgba(0,0,0,0.4)', padding: '8px 12px', borderRadius: 8
      }}>
        Click to capture mouse · WASD move · Space jump · Esc release
      </div>
    </div>
  )
}