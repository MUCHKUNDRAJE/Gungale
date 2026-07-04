import { useRef, useState, forwardRef, useImperativeHandle, useEffect } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import { RigidBody, CapsuleCollider } from '@react-three/rapier'
import { useGLTF } from '@react-three/drei'
import * as THREE from 'three'
import { useGameStore } from '../store/UserStore.js'

const ENEMY_HP = 200

const WANDER_SPEED       = 1.2
const CHASE_SPEED        = 3.5
const CHASE_RANGE        = 12
const STOP_RANGE         = 1.5
const WANDER_RADIUS      = 6
const TARGET_REACH_DIST  = 0.3
const MIN_WAIT           = 1.5
const MAX_WAIT           = 3.5
const TURN_LERP          = 6
const HIT_FLASH_DURATION = 0.06
const DAMAGE_INTERVAL    = 0.8
const CONTACT_DAMAGE     = 5

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
  const { camera } = useThree()
  const rigidRef   = useRef()
  const groupRef   = useRef()
  const modelRef   = useRef()
  const { scene }  = useGLTF('/models/ghost.glb')

  const [hp, setHp]               = useState(ENEMY_HP)
  const [dead, setDead]           = useState(false)
  const [deathAnim, setDeathAnim] = useState(false)
  const isGameOver = useGameStore((s) => s.isGameOver)

  const deathTimer  = useRef(0)
  const bobTimer    = useRef(Math.random() * Math.PI * 2)
  const hpRef       = useRef(ENEMY_HP)
  const damageTimer = useRef(0)

  const addKill    = useGameStore((s) => s.addKill)
  const setHealth  = useGameStore((s) => s.setHealth)
  const triggerHit = useGameStore((s) => s.triggerHit)
  const health     = useGameStore((s) => s.health)
  const healthRef  = useRef(100)

  useEffect(() => { healthRef.current = health }, [health])

  const hitFlashTimer = useRef(0)
  const isFlashing    = useRef(false)

  const spawnPos   = useRef(position)
  const targetPos  = useRef(randomPointInRadius(position, WANDER_RADIUS))
  const waitTimer  = useRef(Math.random() * MAX_WAIT)
  const isWaiting  = useRef(true)
  const isChasing  = useRef(false)
  const currentYaw = useRef(0)
    const isLocked = useGameStore((s)=>s.isLocked);

  const originalColors = useRef([])

  // ── Hit sound ────────────────────────────────────────
  const hitSoundRef  = useRef(null)
  const deadSoundRef = useRef(null)

  useEffect(() => {
    let listener = camera.children.find(c => c.type === 'AudioListener')
    if (!listener) {
      listener = new THREE.AudioListener()
      camera.add(listener)
    }

    const hitSound  = new THREE.Audio(listener)
    const deadSound = new THREE.Audio(listener)
    const loader    = new THREE.AudioLoader()

    loader.load('/sounds/enemy_hit.wav', (buf) => {
      hitSound.setBuffer(buf)
      hitSound.setVolume(0.5)
    })
    loader.load('/sounds/enemy_dead.mp3', (buf) => {
      deadSound.setBuffer(buf)
      deadSound.setVolume(0.7)
    })

    hitSoundRef.current  = hitSound
    deadSoundRef.current = deadSound
  }, [camera])

  const clonedScene = useRef((() => {
    const clone = scene.clone(true)
    clone.traverse((obj) => {
      if (obj.isMesh) {
        obj.material         = obj.material.clone()
        obj.castShadow       = true
        obj.receiveShadow    = true
        obj.frustumCulled    = true
        obj.userData.isEnemy = true
        obj.userData.enemyId = id
        originalColors.current.push({
          mesh:  obj,
          color: obj.material.color.clone()
        })
      }
    })
    return clone
  })())

  useImperativeHandle(ref, () => ({
    takeDamage(dmg) {
      if (dead || hpRef.current <= 0) return

      hpRef.current = Math.max(0, hpRef.current - dmg)
      setHp(hpRef.current)

      // Play hit sound
      if (hitSoundRef.current?.buffer) {
        if (hitSoundRef.current.isPlaying) hitSoundRef.current.stop()
        hitSoundRef.current.setPlaybackRate(0.9 + Math.random() * 0.2)
        hitSoundRef.current.play()
      }

      hitFlashTimer.current = HIT_FLASH_DURATION
      isFlashing.current    = true
      clonedScene.current.traverse((obj) => {
        if (obj.isMesh && obj.material) obj.material.color.set('#ff0000')
      })

      if (hpRef.current <= 0) {
        addKill()
        setDead(true)
        setDeathAnim(true)

        // Play death sound
        if (deadSoundRef.current?.buffer) {
          if (deadSoundRef.current.isPlaying) deadSoundRef.current.stop()
          deadSoundRef.current.play()
        }

        isFlashing.current = false
        originalColors.current.forEach(({ mesh, color }) => {
          if (mesh.material) mesh.material.color.copy(color)
        })

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
    if (isFlashing.current) {
      hitFlashTimer.current -= delta
      if (hitFlashTimer.current <= 0) {
        isFlashing.current = false
        originalColors.current.forEach(({ mesh, color }) => {
          if (mesh.material) mesh.material.color.copy(color)
        })
      }
    }
  if (isGameOver || !isLocked) return 
    if (!groupRef.current || dead) return
    if (!rigidRef.current) return

    bobTimer.current += delta
    groupRef.current.position.y = Math.sin(bobTimer.current * 1.2) * 0.03

    const body    = rigidRef.current
    const pos     = body.translation()
    const current = new THREE.Vector3(pos.x, pos.y, pos.z)

    const playerPos    = camera.position.clone()
    playerPos.y        = pos.y
    const distToPlayer = current.distanceTo(playerPos)

    isChasing.current = distToPlayer < CHASE_RANGE

    if (isChasing.current) {
      const dir  = new THREE.Vector3(camera.position.x - pos.x, 0, camera.position.z - pos.z)
      const dist = dir.length()

      if (dist > STOP_RANGE) {
        dir.normalize()
        body.setTranslation({
          x: pos.x + dir.x * CHASE_SPEED * delta,
          y: pos.y,
          z: pos.z + dir.z * CHASE_SPEED * delta,
        }, true)

        const targetYaw = Math.atan2(dir.x, dir.z)
        let diff = targetYaw - currentYaw.current
        while (diff >  Math.PI) diff -= Math.PI * 2
        while (diff < -Math.PI) diff += Math.PI * 2
        currentYaw.current += diff * Math.min(delta * TURN_LERP, 1)
        if (modelRef.current) modelRef.current.rotation.y = currentYaw.current
      }

      if (dist <= STOP_RANGE) {
        damageTimer.current -= delta
        if (damageTimer.current <= 0) {
          damageTimer.current = DAMAGE_INTERVAL
          const newHp = Math.max(0, healthRef.current - CONTACT_DAMAGE)
          setHealth(newHp)
          healthRef.current = newHp
          triggerHit()
        }
      } else {
        damageTimer.current = 0
      }

    } else {
      damageTimer.current = 0

      if (isWaiting.current) {
        waitTimer.current -= delta
        if (waitTimer.current <= 0) {
          targetPos.current = randomPointInRadius(spawnPos.current, WANDER_RADIUS)
          isWaiting.current = false
        }
      } else {
        const dir  = new THREE.Vector3(targetPos.current.x - pos.x, 0, targetPos.current.z - pos.z)
        const dist = dir.length()

        if (dist < TARGET_REACH_DIST) {
          isWaiting.current = true
          waitTimer.current = MIN_WAIT + Math.random() * (MAX_WAIT - MIN_WAIT)
        } else {
          dir.normalize()
          body.setTranslation({
            x: pos.x + dir.x * WANDER_SPEED * delta,
            y: pos.y,
            z: pos.z + dir.z * WANDER_SPEED * delta,
          }, true)

          const targetYaw = Math.atan2(dir.x, dir.z)
          let diff = targetYaw - currentYaw.current
          while (diff >  Math.PI) diff -= Math.PI * 2
          while (diff < -Math.PI) diff += Math.PI * 2
          currentYaw.current += diff * Math.min(delta * TURN_LERP, 1)
          if (modelRef.current) modelRef.current.rotation.y = currentYaw.current
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
      type="kinematicPosition"
      colliders={false}
      enabledRotations={[false, false, false]}
      friction={0.8}
      restitution={0}
    >
      <CapsuleCollider args={[0.12, 0.12]} position={[0, 0.25, 0]} />

      <group ref={groupRef} userData={{ isEnemy: true, enemyId: id }}>
        <group ref={modelRef}>
          <primitive
            object={clonedScene.current}
            scale={0.3}
            position={[0, 1, 0]}
            rotation={[0, 0, 0]}
            userData={{ isEnemy: true, enemyId: id }}
          />
        </group>

        <group position={[0, 2, 0]}>
          <mesh renderOrder={999}>
            <planeGeometry args={[0.7, 0.08]} />
            <meshBasicMaterial color="#330000" transparent opacity={0.8} depthWrite={false} depthTest={false} />
          </mesh>
          <mesh position={[(hpPct - 1) * 0.35, 0, 0.001]} renderOrder={1000}>
            <planeGeometry args={[0.7 * hpPct, 0.07]} />
            <meshBasicMaterial
              color={hpPct > 0.5 ? '#00ff44' : hpPct > 0.25 ? '#ffaa00' : '#ff2200'}
              depthWrite={false} depthTest={false}
            />
          </mesh>
        </group>
      </group>
    </RigidBody>
  )
})

export default function EnemyTargets({ enemyRefs }) {
  const [enemies, setEnemies] = useState([
    { id: 0, position: [-32, 0.01,  7.85] },
    { id: 1, position: [-19, 0.01, 12.85] },
    { id: 2, position: [-35, 0.01, -3.85] },
    { id: 3, position: [-28, 0.01,  1.85] },
    { id: 4, position: [-24, 0.01,  0.89] },
    { id: 5, position: [-2,  0.01,  8.85] },
    { id: 6, position: [-47, 0.01,  6.75] },
    { id: 7, position: [-48, 0.01,  0.13] },
    { id: 8, position: [-62, 0.01,  8.85] },
    { id: 9, position: [-62, 0.01,  0.75] },
  ])

  const handleKill = (id) => setEnemies(prev => prev.filter(e => e.id !== id))

  return (
    <>
      {enemies.map(e => (
        <Enemy
          key={e.id}
          id={e.id}
          position={e.position}
          onKill={handleKill}
          ref={(el) => { if (enemyRefs) enemyRefs.current[e.id] = el }}
        />
      ))}
    </>
  )
}