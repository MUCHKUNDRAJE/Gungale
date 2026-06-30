import { useRef, useState, forwardRef, useImperativeHandle } from 'react'
import { useFrame } from '@react-three/fiber'
import { RigidBody, CapsuleCollider } from '@react-three/rapier'
import { useGLTF } from '@react-three/drei'
import * as THREE from 'three'
import { useGameStore } from '../store/UserStore.js'

const ENEMY_HP = 100

// ── Movement tuning ─────────────────────────────────────────
const MOVE_SPEED      = 1.2     // units per second
const WANDER_RADIUS   = 6       // max distance from spawn point
const TARGET_REACH_DIST = 0.3   // how close = "reached" target
const MIN_WAIT  = 1.5           // seconds to pause at each point
const MAX_WAIT  = 3.5
const TURN_LERP = 4             // how fast it rotates to face direction

useGLTF.preload('/models/ghost.glb')

function randomPointInRadius(center, radius) {
  const angle = Math.random() * Math.PI * 2
  const dist  = Math.random() * radius
  return new THREE.Vector3(
    center[0] + Math.cos(angle) * dist,
    center[1],
    center[2] + Math.sin(angle) * dist
  )
}

const Enemy = forwardRef(function Enemy({ position, onKill, id }, ref) {
  const rigidRef  = useRef()
  const groupRef  = useRef()
  const modelRef  = useRef()
  const { scene } = useGLTF('/models/ghost.glb')
  const [hp, setHp]               = useState(ENEMY_HP)
  const [dead, setDead]           = useState(false)
  const [deathAnim, setDeathAnim] = useState(false)
  const deathTimer = useRef(0)
  const bobTimer   = useRef(Math.random() * Math.PI * 2)
  const hpRef      = useRef(ENEMY_HP)
  const addKill = useGameStore((s) => s.addKill)

  // ── Wander state ───────────────────────────────────────────
  const spawnPos    = useRef(position)
  const targetPos   = useRef(randomPointInRadius(position, WANDER_RADIUS))
  const waitTimer   = useRef(Math.random() * MAX_WAIT)  // randomize initial wait
  const isWaiting   = useRef(true)
  const currentYaw  = useRef(0)

  const clonedScene = useRef((() => {
    const clone = scene.clone(true)
    clone.traverse((obj) => {
      if (obj.isMesh) {
        obj.castShadow    = true
        obj.receiveShadow = true
        obj.frustumCulled = true
        obj.userData.isEnemy = true
        obj.userData.enemyId = id
      }
    })
    return clone
  })())

  useImperativeHandle(ref, () => ({
    takeDamage(dmg) {
      if (dead || hpRef.current <= 0) return

      hpRef.current = Math.max(0, hpRef.current - dmg)
      setHp(hpRef.current)

      clonedScene.current.traverse((obj) => {
        if (obj.isMesh && obj.material) {
          const orig = obj.material.color.clone()
          setTimeout(() => {
            if (obj.material) obj.material.color.copy(orig)
          }, 80)
        }
      })

      if (hpRef.current <= 0) {
        addKill()
        setDead(true)
        setDeathAnim(true)

        if (rigidRef.current) {
          rigidRef.current.setBodyType(0)
          rigidRef.current.applyImpulse({
            x: (Math.random() - 0.5) * 4,
            y: 2.5,
            z: (Math.random() - 0.5) * 4
          }, true)
          rigidRef.current.setEnabledRotations(true, true, true, true)
        }

        setTimeout(() => onKill(id), 1200)
      }
    }
  }))

  useFrame((_, delta) => {
    if (!groupRef.current || dead) return
    if (!rigidRef.current) return

    // Idle bob
    bobTimer.current += delta
    groupRef.current.position.y = Math.sin(bobTimer.current * 1.2) * 0.03

    // ── Wander AI ──────────────────────────────────────────
    const body = rigidRef.current
    const pos  = body.translation()

    if (isWaiting.current) {
      waitTimer.current -= delta
      if (waitTimer.current <= 0) {
        // Pick a new target and start moving
        targetPos.current = randomPointInRadius(spawnPos.current, WANDER_RADIUS)
        isWaiting.current = false
      }
    } else {
      const current = new THREE.Vector3(pos.x, pos.y, pos.z)
      const dir = new THREE.Vector3(
        targetPos.current.x - current.x,
        0,
        targetPos.current.z - current.z
      )
      const dist = dir.length()

      if (dist < TARGET_REACH_DIST) {
        // Reached — stop and wait before picking next target
        isWaiting.current = true
        waitTimer.current = MIN_WAIT + Math.random() * (MAX_WAIT - MIN_WAIT)
        body.setTranslation({ x: pos.x, y: pos.y, z: pos.z }, true)
      } else {
        dir.normalize()
        const newPos = {
          x: pos.x + dir.x * MOVE_SPEED * delta,
          y: pos.y,
          z: pos.z + dir.z * MOVE_SPEED * delta,
        }
        body.setTranslation(newPos, true)

        // Face movement direction smoothly
        const targetYaw = Math.atan2(dir.x, dir.z)
        let diff = targetYaw - currentYaw.current
        // Normalize angle difference to [-PI, PI]
        while (diff > Math.PI) diff -= Math.PI * 2
        while (diff < -Math.PI) diff += Math.PI * 2
        currentYaw.current += diff * Math.min(delta * TURN_LERP, 1)

        if (modelRef.current) {
          modelRef.current.rotation.y = currentYaw.current
        }
      }
    }
  })

  const hpPct = hp / ENEMY_HP

  if (dead && deathTimer.current > 2) return null

  return (
    <RigidBody
      ref={rigidRef}
      position={position}
      type="kinematicPosition"     // ✅ changed from "fixed" — lets us move it via setTranslation
      colliders={false}
      enabledRotations={[false, false, false]}
      friction={0.8}
      restitution={0}
    >
      <CapsuleCollider
        args={[0.12, 0.12]}
        position={[0, 0.25, 0]}
      />

      <group
        ref={groupRef}
        userData={{ isEnemy: true, enemyId: id }}
      >
        {/* GLB model — separate ref for rotation only */}
        <group ref={modelRef}>
          <primitive
            object={clonedScene.current}
            scale={0.3}
            position={[0, 1, 0]}
            rotation={[0, 0, 0]}
            userData={{ isEnemy: true, enemyId: id }}
          />
        </group>

        {/* Health bar — billboarded, doesn't rotate with model */}
        <group position={[0, 2, 0]}>
          <mesh renderOrder={999}>
            <planeGeometry args={[0.7, 0.08]} />
            <meshBasicMaterial
              color="#330000"
              transparent
              opacity={0.8}
              depthWrite={false}
              depthTest={false}
            />
          </mesh>
          <mesh position={[(hpPct - 1) * 0.35, 0, 0.001]} renderOrder={1000}>
            <planeGeometry args={[0.7 * hpPct, 0.07]} />
            <meshBasicMaterial
              color={hpPct > 0.5 ? '#00ff44' : hpPct > 0.25 ? '#ffaa00' : '#ff2200'}
              depthWrite={false}
              depthTest={false}
            />
          </mesh>
        </group>
      </group>
    </RigidBody>
  )
})

export default function EnemyTargets({ enemyRefs }) {
  const [enemies, setEnemies] = useState([
    { id: 0, position: [-32,  0.01, 7.85]   },
    { id: 1, position: [-19,  0.01, 12.85]  },
    { id: 2, position: [-35,  0.01, -3.85]  },
    { id: 3, position: [-28,  0.01, 1.85]   },
    { id: 4, position: [-24,  0.01, 0.890]  },
    { id: 5, position: [-2,   0.01, 8.85]   },
  ])

  const handleKill = (id) => {
    setEnemies(prev => prev.filter(e => e.id !== id))
  }

  return (
    <>
      {enemies.map(e => (
        <Enemy
          key={e.id}
          id={e.id}
          position={e.position}
          onKill={handleKill}
          ref={(el) => {
            if (enemyRefs) enemyRefs.current[e.id] = el
          }}
        />
      ))}
    </>
  )
}