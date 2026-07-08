// src/App.jsx
import GameCanvas from './components/GameCanvas'
import HUD from './components/HUD'
import MobileControls from './components/MobileControls'
import BGM from './components/BGM'
import BossCutscene from './components/BossCutscene'

export default function App() {
  return (
    <div style={{ margin: 0, overflow: 'hidden', background: '#000' }}>
     
      <HUD />
       {/* <MobileControls /> */}
          <BGM src="/sounds/bgm.mp3" volume={0.1} />
          <BossCutscene/>
      <GameCanvas />
    </div>
  )
}