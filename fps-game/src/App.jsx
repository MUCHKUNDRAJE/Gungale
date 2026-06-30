// src/App.jsx
import GameCanvas from './components/GameCanvas'
import HUD from './components/HUD'
import MobileControls from './components/MobileControls'

export default function App() {
  return (
    <div style={{ margin: 0, overflow: 'hidden', background: '#000' }}>
      <HUD />
       {/* <MobileControls /> */}
      <GameCanvas />
    </div>
  )
}