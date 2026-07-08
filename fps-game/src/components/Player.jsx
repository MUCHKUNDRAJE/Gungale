import { useRef, useEffect, useState, useCallback } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import { PointerLockControls } from '@react-three/drei'
import { RigidBody, CapsuleCollider, useRapier } from '@react-three/rapier'
import * as THREE from 'three'
import GunViewModel from './GunViewModel.jsx'
import MuzzleFlash from './MuzzleFlash'
import BulletSystem from './BulletSystem'
import BulletHoleSystem from './BulletHole'
import EnemyTargets from './EnemyTarget'
import { useGameStore } from '../store/UserStore.js'
import BossCutscene from './BossCutscene'
import BossSpawner  from './Boss'

const SPEED        = 5
const SPRINT_SPEED = 10
const JUMP_FORCE   = 3

const BOB_SPEED  = 0
const BOB_AMOUNT = 0
const BOB_SIDE   = 0

const PLAYER_HEIGHT = 0.9
const FIRE_RATE     = 8

// Shake settings
const SHAKE_AMOUNT   = 0.06
const SHAKE_DURATION = 0.25

export default function Player() {
  const { camera }  = useThree()
  const controlsRef = useRef()
  const keys        = useRef({})
  const onGround    = useRef(false)
  const playerRef   = useRef()
  const bulletRef   = useRef()
  const bossRef = useRef()

  const bobTimer    = useRef(0)
  const currentBobY = useRef(0)
  const currentBobX = useRef(0)
  const hitsRef        = useRef(null)
  const enemyGroupsRef = useRef({})

  // ── Shake state ──────────────────────────────────────
  const shakeTimer     = useRef(0)
  const shakeSeedX     = useRef(0)
  const shakeSeedY     = useRef(0)

  // ── Hit sound ────────────────────────────────────────
  const hitSoundRef = useRef(null)

  useEffect(() => {
    const listener = new THREE.AudioListener()
    camera.add(listener)
    const sound  = new THREE.Audio(listener)
    const loader = new THREE.AudioLoader()
    loader.load('/sounds/hit.wav', (buffer) => {
      sound.setBuffer(buffer)
      sound.setVolume(0.7)
    })
    hitSoundRef.current = sound
    return () => camera.remove(listener)
  }, [camera])

  const setAmmo   = useGameStore((s) => s.setAmmo)
  const ammo      = useGameStore((s) => s.ammo)
  const setLocked = useGameStore((s) => s.setLocked)
  const isHit     = useGameStore((s) => s.isHit)
  const isGameOver = useGameStore((s) => s.isGameOver)
  const isLocked = useGameStore((s)=>s.isLocked);

  // Trigger shake + sound when isHit flips true
  const prevIsHit = useRef(false)
  useEffect(() => {
    if (isHit && !prevIsHit.current) {
      // Shake
      shakeTimer.current = SHAKE_DURATION
      shakeSeedX.current = (Math.random() - 0.5) * 2
      shakeSeedY.current = (Math.random() - 0.5) * 2

      // Sound
      if (hitSoundRef.current?.buffer) {
        if (hitSoundRef.current.isPlaying) hitSoundRef.current.stop()
        hitSoundRef.current.play()
      }
    }
    prevIsHit.current = isHit
  }, [isHit])

  const isFiring    = useRef(false)
  const fireTimer   = useRef(0)
  const isMovingRef = useRef(false)
  const [isShooting, setIsShooting] = useState(false)

  const { rapier, world } = useRapier()
  const groundRay = new rapier.Ray(
    { x: 0, y: 0, z: 0 },
    { x: 0, y: -1, z: 0 }
  )

  useEffect(() => {
    const down = (e) => (keys.current[e.code] = true)
    const up   = (e) => (keys.current[e.code] = false)

    const onMouseDown = (e) => {
      if (e.button === 0 && controlsRef.current?.isLocked) {
        setIsShooting(true)
        isFiring.current = true
        setAmmo(Math.max(0, ammo - 1))
        setTimeout(() => setIsShooting(false), 80)
      }
    }

    const onMouseUp = (e) => {
      if (e.button === 0) isFiring.current = false
    }

    window.addEventListener('keydown', down)
    window.addEventListener('keyup', up)
    window.addEventListener('mousedown', onMouseDown)
    window.addEventListener('mouseup', onMouseUp)
    return () => {
      window.removeEventListener('keydown', down)
      window.removeEventListener('keyup', up)
      window.removeEventListener('mousedown', onMouseDown)
      window.removeEventListener('mouseup', onMouseUp)
    }
  }, [])
    useEffect(() => {
  enemyGroupsRef.current['boss'] = {
    takeDamage: (dmg) => bossRef.current?.takeDamage(dmg)
  }
}, [])
  useFrame((_, delta) => {
    if (!playerRef.current) return
    const body    = playerRef.current
    const bodyPos = body.translation()

    camera.position.set(bodyPos.x, bodyPos.y + PLAYER_HEIGHT, bodyPos.z)

 

    if (!controlsRef.current?.isLocked) return

   if (isGameOver || !isLocked) {
    body.setLinvel({ x: 0, y: 0, z: 0 }, true)
    body.setAngvel({ x: 0, y: 0, z: 0 }, true)
    return
  }


console.log(camera.position)
    // Ground check
    groundRay.origin.x = bodyPos.x
    groundRay.origin.y = bodyPos.y
    groundRay.origin.z = bodyPos.z
    const hit = world.castRay(groundRay, PLAYER_HEIGHT + 0.15, true, undefined, undefined, body)
    onGround.current = hit !== null

    const isSprinting  = keys.current['ShiftLeft'] || keys.current['ShiftRight']
    const currentSpeed = isSprinting ? SPRINT_SPEED : SPEED
    

    // Fire
    if (isFiring.current) {
      fireTimer.current -= delta
      if (fireTimer.current <= 0) {
        bulletRef.current?.fire()
        setIsShooting(true)
        setTimeout(() => setIsShooting(false), 60)
        fireTimer.current = 1 / FIRE_RATE
      }
    } else {
      fireTimer.current = 0
    }




    // Movement
    const forward = new THREE.Vector3()
    const right   = new THREE.Vector3()
    camera.getWorldDirection(forward)
    forward.y = 0
    forward.normalize()
    right.crossVectors(forward, new THREE.Vector3(0, 1, 0)).normalize()

    const moving =
      keys.current['KeyW'] || keys.current['KeyS'] ||
      keys.current['KeyA'] || keys.current['KeyD']

    isMovingRef.current = !!moving

    const move = new THREE.Vector3()
    if (keys.current['KeyW']) move.add(forward)
    if (keys.current['KeyS']) move.sub(forward)
    if (keys.current['KeyD']) move.add(right)
    if (keys.current['KeyA']) move.sub(right)

    if (move.lengthSq() > 0) move.normalize()

    const vel = body.linvel()
    body.setLinvel({
      x: move.x * currentSpeed,
      y: vel.y,
      z: move.z * currentSpeed,
    }, true)

    if (keys.current['Space'] && onGround.current) {
      body.setLinvel({ x: vel.x, y: JUMP_FORCE, z: vel.z }, true)
    }

    // Head bob
    if (moving && onGround.current) {
      bobTimer.current   += delta * BOB_SPEED
      const targetBobY    = Math.sin(bobTimer.current) * BOB_AMOUNT
      const targetBobX    = Math.sin(bobTimer.current * 0.5) * BOB_SIDE
      currentBobY.current = THREE.MathUtils.lerp(currentBobY.current, targetBobY, 0.15)
      currentBobX.current = THREE.MathUtils.lerp(currentBobX.current, targetBobX, 0.15)
    } else {
      bobTimer.current    = 0
      currentBobY.current = THREE.MathUtils.lerp(currentBobY.current, 0, 0.1)
      currentBobX.current = THREE.MathUtils.lerp(currentBobX.current, 0, 0.1)
    }

    camera.position.y += currentBobY.current
    const sway = right.clone().multiplyScalar(currentBobX.current)
    camera.position.add(sway)

    // ── Camera shake ─────────────────────────────────────
    if (shakeTimer.current > 0) {
      shakeTimer.current -= delta
      const progress = shakeTimer.current / SHAKE_DURATION
      const amount   = SHAKE_AMOUNT * progress

      // Noise-like offset using sin with seeds
      const t = performance.now() * 0.01
      camera.position.x += Math.sin(t * 17 + shakeSeedX.current) * amount
      camera.position.y += Math.sin(t * 13 + shakeSeedY.current) * amount
    }
    
    body.setAngvel({ x: 0, y: 0, z: 0 }, true)
  })

  return (
    <>
      <RigidBody
        ref={playerRef}
        position={[0, 2, 0]}
        enabledRotations={[false, false, false]}
        friction={0}
        restitution={0}
        mass={70}
        linearDamping={5}
        colliders={false}
      >
        <CapsuleCollider args={[PLAYER_HEIGHT * 0.5, 0.4]} />
      </RigidBody>

      <PointerLockControls
        ref={controlsRef}
        onLock={() => setLocked(true)}
        onUnlock={() => setLocked(false)}
      />

      <GunViewModel isMovingRef={isMovingRef} isShooting={isShooting} />
      <MuzzleFlash isShooting={isShooting} />
      <BulletSystem ref={bulletRef} hitsRef={hitsRef} enemyGroupsRef={enemyGroupsRef} />
      <BulletHoleSystem hitsRef={hitsRef} />
      
      <BossSpawner bossRef={bossRef} />
      <EnemyTargets enemyRefs={enemyGroupsRef} />
    </>
  )
}