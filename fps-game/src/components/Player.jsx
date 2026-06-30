import { useRef, useEffect, useState } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import { PointerLockControls } from '@react-three/drei'
import { RigidBody, CapsuleCollider, useRapier } from '@react-three/rapier'
import * as THREE from 'three'
import GunViewModel from './GunviewModel'
import MuzzleFlash from './MuzzleFlash'
import BulletSystem from './BulletSystem'
import BulletHoleSystem from './BulletHole'
import EnemyTargets from './EnemyTarget'
import { useGameStore } from '../store/userStore'

const SPEED =5
const JUMP_FORCE = 6


const BOB_SPEED = 0
const BOB_AMOUNT = 0
const BOB_SIDE = 0

const PLAYER_HEIGHT = 0.9
const FIRE_RATE  = 8

export default function Player() {
  const { camera } = useThree()
  const controlsRef = useRef()
  const keys = useRef({})
  const onGround = useRef(false)
  const playerRef = useRef()
   const bulletRef   = useRef()    

  const bobTimer = useRef(0)
  const currentBobY = useRef(0)
  const currentBobX = useRef(0)
  const hitsRef        = useRef(null)   // bullet hole spawner
const enemyGroupsRef = useRef({}) 

const setAmmo = useGameStore((s) => s.setAmmo)
const ammo    = useGameStore((s) => s.ammo)


  // Firing
  const isFiring      = useRef(false)
  const fireTimer     = useRef(0)

const isMovingRef = useRef(false)
  const [isShooting, setIsShooting] = useState(false)

  const { rapier, world } = useRapier()
  const groundRay = new rapier.Ray(
    { x: 0, y: 0, z: 0 },
    { x: 0, y: -1, z: 0 }
  )

  useEffect(() => {
    const down = (e) => (keys.current[e.code] = true)
    const up = (e) => (keys.current[e.code] = false)

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

  useFrame((_, delta) => {
    if (!controlsRef.current?.isLocked) return
    if (!playerRef.current) return

    const body = playerRef.current

    // Ground check
    const bodyPos = body.translation()
    groundRay.origin.x = bodyPos.x
    groundRay.origin.y = bodyPos.y
    groundRay.origin.z = bodyPos.z

    const hit = world.castRay(
      groundRay,
      PLAYER_HEIGHT + 0.15,
      true,
      undefined,
      undefined,
      body
    )
    onGround.current = hit !== null
   
    if (isFiring.current) {
  fireTimer.current -= delta
  if (fireTimer.current <= 0) {
    bulletRef.current?.fire()          // ✅ actually fires the bullet
    setIsShooting(true)
    setTimeout(() => setIsShooting(false), 60)
    fireTimer.current = 1 / FIRE_RATE
  }
} else {
  fireTimer.current = 0
}
    // Movement direction
    const forward = new THREE.Vector3()
    const right = new THREE.Vector3()
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
      x: move.x * SPEED,
      y: vel.y,
      z: move.z * SPEED,
    }, true)

    // Jump
    if (keys.current['Space'] && onGround.current) {
      body.setLinvel({ x: vel.x, y: JUMP_FORCE, z: vel.z }, true)
    }
  console.log(bodyPos)
    // Sync camera to physics body
    camera.position.set(
      bodyPos.x,
      bodyPos.y + PLAYER_HEIGHT,
      bodyPos.z
    )

    // Head bob
    if (moving && onGround.current) {
      bobTimer.current += delta * BOB_SPEED
      const targetBobY = Math.sin(bobTimer.current) * BOB_AMOUNT
      const targetBobX = Math.sin(bobTimer.current * 0.5) * BOB_SIDE
      currentBobY.current = THREE.MathUtils.lerp(currentBobY.current, targetBobY, 0.15)
      currentBobX.current = THREE.MathUtils.lerp(currentBobX.current, targetBobX, 0.15)
    } else {
      bobTimer.current = 0
      currentBobY.current = THREE.MathUtils.lerp(currentBobY.current, 0, 0.1)
      currentBobX.current = THREE.MathUtils.lerp(currentBobX.current, 0, 0.1)
    }

    camera.position.y += currentBobY.current
    const sway = right.clone().multiplyScalar(currentBobX.current)
    camera.position.add(sway)

    body.setAngvel({ x: 0, y: 0, z: 0 }, true)
  })

  return (
    <>
      <RigidBody
        ref={playerRef}
        position={[0, 0.5, 0]}
        enabledRotations={[false, false, false]}
        friction={0}
        restitution={0}
        mass={70}
        linearDamping={5}
        colliders={false}
      >
        <CapsuleCollider
          args={[PLAYER_HEIGHT * 0.5, 0.4]}
        />
      </RigidBody>

      <PointerLockControls
        ref={controlsRef}
        onLock={() => console.log('locked')}
        onUnlock={() => console.log('unlocked')}
      />

      <GunViewModel
        isMovingRef={isMovingRef}
        isShooting={isShooting}
      />
        <MuzzleFlash isShooting={isShooting} />
    <BulletSystem ref={bulletRef} hitsRef={hitsRef} enemyGroupsRef={enemyGroupsRef} />
<BulletHoleSystem hitsRef={hitsRef} />
<EnemyTargets enemyRefs={enemyGroupsRef} />
    </>
  )
}