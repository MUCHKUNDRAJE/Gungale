import { useRef, useEffect } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import { PointerLockControls } from '@react-three/drei'
import { RigidBody, CapsuleCollider, useRapier } from '@react-three/rapier'
import * as THREE from 'three'

const SPEED = 3
const JUMP_FORCE = 6

// Head bob settings
const BOB_SPEED = 30
const BOB_AMOUNT = 0.09
const BOB_SIDE = 0.09

// Player height offset — camera sits at top of capsule
const PLAYER_HEIGHT = 0.9

export default function Player() {
  const { camera } = useThree()
  const controlsRef = useRef()
  const keys = useRef({})
  const onGround = useRef(false)
  const playerRef = useRef()        // rapier rigid body ref

  // Bob state
  const bobTimer = useRef(0)
  const currentBobY = useRef(0)
  const currentBobX = useRef(0)

  // Ground detection — raycast downward
  const { rapier, world } = useRapier()
  const groundRay = new rapier.Ray(
    { x: 0, y: 0, z: 0 },
    { x: 0, y: -1, z: 0 }   // shoot ray downward
  )

  useEffect(() => {
    const down = (e) => (keys.current[e.code] = true)
    const up   = (e) => (keys.current[e.code] = false)
    window.addEventListener('keydown', down)
    window.addEventListener('keyup', up)
    return () => {
      window.removeEventListener('keydown', down)
      window.removeEventListener('keyup', up)
    }
  }, [])

  useFrame((_, delta) => {
    if (!controlsRef.current?.isLocked) return
    if (!playerRef.current) return

    const body = playerRef.current

    // ── Ground check via raycast ──────────────────────────
    const bodyPos = body.translation()
    groundRay.origin.x = bodyPos.x
    groundRay.origin.y = bodyPos.y
    groundRay.origin.z = bodyPos.z

    const hit = world.castRay(
      groundRay,
      PLAYER_HEIGHT + 0.15,   // ray length = capsule half height + small buffer
      true,
      undefined,
      undefined,
      body                    // exclude player's own body
    )
    onGround.current = hit !== null

    // ── Movement direction ────────────────────────────────
    const forward = new THREE.Vector3()
    const right = new THREE.Vector3()
    camera.getWorldDirection(forward)
    forward.y = 0
    forward.normalize()
    right.crossVectors(forward, new THREE.Vector3(0, 1, 0)).normalize()

    const isMoving =
      keys.current['KeyW'] || keys.current['KeyS'] ||
      keys.current['KeyA'] || keys.current['KeyD']

    const move = new THREE.Vector3()
    if (keys.current['KeyW']) move.add(forward)
    if (keys.current['KeyS']) move.sub(forward)
    if (keys.current['KeyD']) move.add(right)
    if (keys.current['KeyA']) move.sub(right)

    if (move.lengthSq() > 0) move.normalize()

    // Get current velocity from physics body
    const vel = body.linvel()

    // Set horizontal velocity, preserve vertical (gravity handled by rapier)
    body.setLinvel({
      x: move.x * SPEED,
      y: vel.y,             // keep rapier's gravity/jump Y
      z: move.z * SPEED,
    }, true)

    // ── Jump ──────────────────────────────────────────────
    if (keys.current['Space'] && onGround.current) {
      body.setLinvel({ x: vel.x, y: JUMP_FORCE, z: vel.z }, true)
    }

    // ── Sync camera to physics body position ──────────────
    camera.position.set(
      bodyPos.x,
      bodyPos.y + PLAYER_HEIGHT,   // camera at top of capsule
      bodyPos.z
    )

    // ── Head Bob ──────────────────────────────────────────
    if (isMoving && onGround.current) {
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

    // Lock rotation — rapier would rotate the capsule without this
    body.setAngvel({ x: 0, y: 0, z: 0 }, true)
  })

  return (
    <>
      {/* Physics capsule — invisible, handles collision */}
      <RigidBody
        ref={playerRef}
        position={[0, 0.5, 0]}          // spawn position — adjust to your map
        enabledRotations={[false, false, false]}  // no tipping over
        friction={0}                  // no friction — we control movement manually
        restitution={0}               // no bounce
        mass={70}
        linearDamping={5}             // stops sliding when you release keys
        colliders={false}             // we add our own below
      >
        <CapsuleCollider
          args={[PLAYER_HEIGHT * 0.5, 0.4]}  // [halfHeight, radius]
        />
      </RigidBody>

      {/* Camera controls */}
      <PointerLockControls
        ref={controlsRef}
        onLock={() => console.log('locked')}
        onUnlock={() => console.log('unlocked')}
      />
    </>
  )
}