import { Suspense } from 'react'
import { Canvas } from '@react-three/fiber'
import { Sky, Environment } from '@react-three/drei'
import { EffectComposer, Bloom, SSAO, ChromaticAberration, Vignette, ToneMapping } from '@react-three/postprocessing'
import { BlendFunction, ToneMappingMode } from 'postprocessing'
import { Vector2 } from 'three'
import Player from './Player'
import World from './World'
import { Perf } from 'r3f-perf'
import { Physics } from '@react-three/rapier'      
import EnemyTargets from './EnemyTarget'
import Loader from './loader'

export default function GameCanvas() {
  return (
    <>
        <Loader />  
    <Canvas
      shadows
       gl={{
    antialias: false,
    powerPreference: 'high-performance',  // forces discrete GPU
    stencil: false,
    depth: true,
    alpha: false,                          // no transparency needed = faster
    preserveDrawingBuffer: false,          // don't keep frame in memory
    failIfMajorPerformanceCaveat: false,   // don't fallback to software render
  }}
      camera={{ fov: 75, near: 0.1, far: 1000 }}
      style={{ width: '100vw', height: '100vh' }}
    >
      {/* Sky */}
      {/* <Perf position="top-left" /> */}
      <Sky sunPosition={[80, 20, 100]} turbidity={8} rayleigh={0.5} />

      {/* Environment map — makes gold materials shine like Sketchfab */}
      <Environment preset="sunset" />

      {/* Lights */}
      <ambientLight intensity={1} />
      <directionalLight
        position={[60, 80, 40]}
        intensity={2.5}
        castShadow
        shadow-mapSize={[4096, 4096]}
        shadow-camera-far={400}
        shadow-camera-left={-120}
        shadow-camera-right={120}
        shadow-camera-top={120}
        shadow-camera-bottom={-120}
        shadow-bias={-0.0005}
      />
      {/* Cool fill from opposite side */}
      <directionalLight position={[-40, 20, -60]} intensity={0.4} color="#6688cc" />
      {/* Warm bounce from below */}
      <hemisphereLight skyColor="#ffe0a0" groundColor="#223344" intensity={0.8} />

  <Physics gravity={[0, -20, 0]}>
  <Suspense fallback={null}>
    <World />
  </Suspense>
  <Player />
  
</Physics>

      {/* ── Post Processing ── */}
      <EffectComposer>

        {/* Ambient Occlusion — darkens corners/crevices like Sketchfab */}
        <SSAO
          blendFunction={BlendFunction.MULTIPLY}
          samples={32}
          rings={4}
          distanceThreshold={1.0}
          distanceFalloff={0.0}
          rangeThreshold={0.5}
          rangeFalloff={0.1}
          luminanceInfluence={0.9}
          radius={20}
          bias={0.5}
          intensity={1.0}
        />

        {/* Bloom — makes gold edges glow */}
        {/* <Bloom
          intensity={0.1}
          luminanceThreshold={0.1}   // only bright areas bloom
          luminanceSmoothing={0.1}
          mipmapBlur
        /> */}

        {/* Chromatic Aberration — subtle RGB split on edges */}
        <ChromaticAberration
          blendFunction={BlendFunction.NORMAL}
          offset={new Vector2(0.0008, 0.0008)}
        />

        {/* Vignette — darkens screen edges like a camera lens */}
        <Vignette
          offset={0.4}
          darkness={0.6}
          blendFunction={BlendFunction.NORMAL}
        />

        {/* Tone Mapping — ACES filmic, same as Sketchfab's look */}
        <ToneMapping
          blendFunction={BlendFunction.NORMAL}
          mode={ToneMappingMode.ACES_FILMIC}
          resolution={256}
          whitePoint={4.0}
          middleGrey={0.6}
          minLuminance={0.01}
          averageLuminance={1.0}
          adaptationRate={1.0}
        />

      </EffectComposer>
    </Canvas>
    </>
  )
}