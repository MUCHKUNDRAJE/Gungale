// src/components/GunViewModel.jsx
import { useRef, useEffect, useState } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import { useGLTF } from '@react-three/drei'
import * as THREE from 'three'
import { useGameStore } from '../store/userStore'

// ── Per-weapon config ──────────────────────────────────────
const WEAPONS = [
  {
    name: 'PP-19',
    path: '/models/gun.glb',
    sound: '/sounds/gunshot.wav',
    position: [0.3, -0.3, -0.5],
    rotation: [0, Math.PI, 0],
    scale: 0.008,
  },
  {
    name: 'hand Gun',
    path: '/models/handgun.glb',
    sound: '/sounds/pistol.m4a',
    position: [0.3, -0.3, -0.5],
    rotation: [0, 96, 0.4],
    scale: 0.4,
  },
  {
    name: 'AK 74',
    path: '/models/ak-742.glb',
    sound: '/sounds/gunshot.wav',
    position: [0.3, -0.3, -0.5],
    rotation: [0, Math.PI, 0],
    scale: 1.3,
  },
]

const SWAY_AMOUNT  = 0.04
const BOB_AMOUNT   = 0.018
const BOB_SPEED    = 10
const LERP_SPEED   = 8

// Swap animation timing
const SWAP_DOWN_TIME = 0.15
const SWAP_UP_TIME   = 0.2
const SWAP_DROP_DIST = 0.4

// Preload all models
WEAPONS.forEach(w => useGLTF.preload(w.path))

function WeaponModel({ weapon, isMovingRef, isShooting, swapState }) {
  const { camera } = useThree()
  const { scene }  = useGLTF(weapon.path)
  const gunRef        = useRef()
  const clonedScene   = useRef()
  const centerOffset  = useRef(new THREE.Vector3())
  const [ready, setReady] = useState(false)

  // ── Audio setup ──────────────────────────────────────
  const soundRef        = useRef()
  const prevShootSound  = useRef(false)

  useEffect(() => {
    clonedScene.current = scene.clone(true)
    const box    = new THREE.Box3().setFromObject(clonedScene.current)
    const center = box.getCenter(new THREE.Vector3())
    centerOffset.current.copy(center).negate()

    clonedScene.current.traverse((obj) => {
      if (obj.isMesh) {
        obj.castShadow    = false
        obj.receiveShadow = false
        obj.frustumCulled = false
      }
    })

    setReady(true)
  }, [scene])

  // Setup audio listener + sound on mount
  useEffect(() => {
    let listener = camera.children.find(c => c.type === 'AudioListener')
    if (!listener) {
      listener = new THREE.AudioListener()
      camera.add(listener)
    }

    const sound = new THREE.Audio(listener)
    soundRef.current = sound

    const loader = new THREE.AudioLoader()
    loader.load(weapon.sound, (buffer) => {
      sound.setBuffer(buffer)
      sound.setVolume(0.6)
    })

    return () => {
      if (sound.isPlaying) sound.stop()
      camera.remove(listener)
    }
  }, [camera, weapon.sound])

  // Play sound when isShooting flips true
  useEffect(() => {
    if (isShooting && !prevShootSound.current && soundRef.current?.buffer) {
      if (soundRef.current.isPlaying) soundRef.current.stop()

      // Slight random pitch variation for realism
      const pitch = 0.92 + Math.random() * 0.16
      soundRef.current.setPlaybackRate(pitch)
      soundRef.current.play()
    }
    prevShootSound.current = isShooting
  }, [isShooting])

  const bobTimer    = useRef(0)
  const swayX       = useRef(0)
  const swayY       = useRef(0)
  const currentBobY = useRef(0)
  const recoilZ     = useRef(0)
  const recoilRot   = useRef(0)
  const prevShoot   = useRef(false)

  useFrame((state, delta) => {
    if (!gunRef.current) return
    const isMoving = isMovingRef.current
    const t = Math.min(delta * LERP_SPEED, 1)

    // Recoil
    if (isShooting && !prevShoot.current) {
      recoilZ.current   = 0.12
      recoilRot.current = 0.08
    }
    prevShoot.current = isShooting
    recoilZ.current   += (0 - recoilZ.current)   * t * 1.5
    recoilRot.current += (0 - recoilRot.current) * t * 1.5

    // Walk bob
    if (isMoving) {
      bobTimer.current += delta * BOB_SPEED
      const targetBob = Math.sin(bobTimer.current) * BOB_AMOUNT
      currentBobY.current += (targetBob - currentBobY.current) * t
    } else {
      bobTimer.current = 0
      currentBobY.current += (0 - currentBobY.current) * t
    }

    // Mouse sway
    const mouseX = state.mouse.x
    const mouseY = state.mouse.y
    swayX.current += (-mouseX * SWAY_AMOUNT - swayX.current) * t
    swayY.current += (-mouseY * SWAY_AMOUNT - swayY.current) * t

    // Swap drop offset
    const swapDrop = swapState.current.dropAmount

    const camPos = new THREE.Vector3(...weapon.position)
    camPos.x += swayX.current
    camPos.y += swayY.current + currentBobY.current - swapDrop
    camPos.z += recoilZ.current

    const worldPos = camPos.clone().applyMatrix4(camera.matrixWorld)
    gunRef.current.position.copy(worldPos)
    gunRef.current.quaternion.copy(camera.quaternion)

    const euler = new THREE.Euler(
      weapon.rotation[0] + recoilRot.current,
      weapon.rotation[1],
      weapon.rotation[2],
      'YXZ'
    )
    gunRef.current.quaternion.multiply(new THREE.Quaternion().setFromEuler(euler))
  })

  if (!ready || !clonedScene.current) return null

  return (
    <group ref={gunRef} scale={weapon.scale}>
      <group position={[centerOffset.current.x, centerOffset.current.y, centerOffset.current.z]}>
        <primitive object={clonedScene.current} />
      </group>
    </group>
  )
}

export default function GunViewModel({ isMovingRef, isShooting }) {
  const [weaponIndex, setWeaponIndex] = useState(0)
  const [renderedIndex, setRenderedIndex] = useState(0)
  const setGunChoose = useGameStore((s) => s.setGunChoose)

  const swapState = useRef({
    phase: 'idle',
    dropAmount: 0,
    timer: 0,
  })

  const isSwapping = useRef(false)

  useEffect(() => {
    const onWheel = (e) => {
      if (isSwapping.current) return

      const dir = e.deltaY > 0 ? 1 : -1
      const nextIndex = (weaponIndex + dir + WEAPONS.length) % WEAPONS.length

      if (nextIndex === weaponIndex) return

      setGunChoose(WEAPONS[nextIndex].name)
      isSwapping.current = true
      swapState.current.phase = 'down'
      swapState.current.timer = 0

      setWeaponIndex(nextIndex)
    }

    window.addEventListener('wheel', onWheel)
    return () => window.removeEventListener('wheel', onWheel)
  }, [weaponIndex])

  useFrame((_, delta) => {
    const s = swapState.current

    if (s.phase === 'down') {
      s.timer += delta
      const p = Math.min(s.timer / SWAP_DOWN_TIME, 1)
      s.dropAmount = p * SWAP_DROP_DIST

      if (p >= 1) {
        setRenderedIndex(weaponIndex)
        s.phase = 'up'
        s.timer = 0
      }
    } else if (s.phase === 'up') {
      s.timer += delta
      const p = Math.min(s.timer / SWAP_UP_TIME, 1)
      const eased = 1 - Math.pow(1 - p, 3)
      s.dropAmount = (1 - eased) * SWAP_DROP_DIST

      if (p >= 1) {
        s.phase = 'idle'
        s.dropAmount = 0
        isSwapping.current = false
      }
    }
  })

  return (
    <WeaponModel
      key={WEAPONS[renderedIndex].name}
      weapon={WEAPONS[renderedIndex]}
      isMovingRef={isMovingRef}
      isShooting={isShooting}
      swapState={swapState}
    />
  )
}