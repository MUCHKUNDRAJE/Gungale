// src/components/Boss.jsx
import { useRef, useState, forwardRef, useImperativeHandle, useEffect } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import { RigidBody, CapsuleCollider } from '@react-three/rapier'
import { useGLTF } from '@react-three/drei'
import * as THREE from 'three'
import { useGameStore } from '../store/UserStore.js'

const BOSS_HP             = 4000 
const BOSS_SPEED          = 2.8
const BOSS_STOP_RANGE     = 2
const BOSS_DAMAGE         = 15
const BOSS_DMG_INTERVAL   = 0.6
const CHASE_SPEED_ENRAGED = 5
const SPAWN_POSITION      = [-47, 0.01, 3.0]

useGLTF.preload('/models/boss.glb')

// ✅ Fixed — no bossRef prop, only ref from forwardRef
const Boss = forwardRef(function Boss(_, ref) {
  const { camera }  = useThree()
  const rigidRef    = useRef()
  const modelRef    = useRef()
  const groupRef    = useRef()
  const { scene }   = useGLTF('/models/boss.glb')

  const [hp, setHp]     = useState(BOSS_HP)
  const [dead, setDead] = useState(false)
  const hpRef           = useRef(BOSS_HP)
  const damageTimer     = useRef(0)
  const currentYaw      = useRef(0)
  const bobTimer        = useRef(0)
  const hitFlashTimer   = useRef(0)
  const isFlashing      = useRef(false)
  const originalColors  = useRef([])

  const setHealth       = useGameStore((s) => s.setHealth)
  const triggerHit      = useGameStore((s) => s.triggerHit)
  const setBossDefeated = useGameStore((s) => s.setBossDefeated)
  const setBossActive   = useGameStore((s) => s.setBossActive)
  const setBossHp       = useGameStore((s) => s.setBossHp)
  const health          = useGameStore((s) => s.health)
  const isLocked        = useGameStore((s) => s.isLocked)
  const healthRef       = useRef(health)
  useEffect(() => { healthRef.current = health }, [health])

  const spawnDone  = useRef(false)
  const spawnTimer = useRef(0)

  const clonedScene = useRef((() => {
    const clone = scene.clone(true)
    clone.traverse((obj) => {
      if (obj.isMesh) {
        obj.material          = obj.material.clone()
        obj.castShadow        = true
        obj.receiveShadow     = true
        obj.frustumCulled     = false
        obj.userData.isBoss   = true   // ✅ keep isBoss
        obj.userData.isEnemy  = true   // ✅ ADD isEnemy so BulletSystem finds it
        obj.userData.enemyId  = 'boss'
        originalColors.current.push({ mesh: obj, color: obj.material.color.clone() })
      }
    })
    return clone
  })())

  // ✅ Expose takeDamage correctly via ref
  useImperativeHandle(ref, () => ({
    takeDamage(dmg) {
      if (dead || hpRef.current <= 0) return

      hpRef.current = Math.max(0, hpRef.current - dmg)
      setHp(hpRef.current)
      setBossHp(hpRef.current)   // ✅ updates HUD bar

      // Flash red
      hitFlashTimer.current = 0.2
      isFlashing.current = true
      clonedScene.current.traverse((obj) => {
        if (obj.isMesh && obj.material) obj.material.color.set('#ff0000')
      })

      if (hpRef.current <= 0) {
        setDead(true)
        // Restore color on death
        originalColors.current.forEach(({ mesh, color }) => {
          if (mesh.material) mesh.material.color.copy(color)
        })
        setTimeout(() => {
          setBossDefeated(true)
          setBossActive(false)
        }, 2000)
      }
    }
  }))

  useFrame((_, delta) => {
    // Restore color after flash
    if (isFlashing.current) {
      hitFlashTimer.current -= delta
      if (hitFlashTimer.current <= 0) {
        isFlashing.current = false
        originalColors.current.forEach(({ mesh, color }) => {
          if (mesh.material) mesh.material.color.copy(color)
        })
      }
    }

    if (!rigidRef.current || dead || !isLocked) return

    // Spawn rise
    if (!spawnDone.current) {
      spawnTimer.current += delta
      const p     = Math.min(spawnTimer.current / 2.5, 1)
      const eased = 1 - Math.pow(1 - p, 3)
      const newY  = -3 + eased * 3
      const pos   = rigidRef.current.translation()
      rigidRef.current.setTranslation({ x: pos.x, y: newY, z: pos.z }, true)
      if (p >= 1) spawnDone.current = true
      return
    }

    const body = rigidRef.current
    const pos  = body.translation()

    bobTimer.current += delta
    if (groupRef.current) {
      groupRef.current.position.y = Math.sin(bobTimer.current * 1.0) * 0.06
    }

    const dir = new THREE.Vector3(
      camera.position.x - pos.x,
      0,
      camera.position.z - pos.z
    )
    const dist = dir.length()

    const enraged   = hpRef.current / BOSS_HP < 0.3
    const moveSpeed = enraged ? CHASE_SPEED_ENRAGED : BOSS_SPEED

    if (dist > BOSS_STOP_RANGE) {
      dir.normalize()
      body.setTranslation({
        x: pos.x + dir.x * moveSpeed * delta,
        y: pos.y,
        z: pos.z + dir.z * moveSpeed * delta,
      }, true)

      const targetYaw = Math.atan2(dir.x, dir.z)
      let diff = targetYaw - currentYaw.current
      while (diff >  Math.PI) diff -= Math.PI * 2
      while (diff < -Math.PI) diff += Math.PI * 2
      currentYaw.current += diff * Math.min(delta * 5, 1)
      if (modelRef.current) modelRef.current.rotation.y = currentYaw.current
    }

    // Contact damage to player
    if (dist <= BOSS_STOP_RANGE) {
      damageTimer.current -= delta
      if (damageTimer.current <= 0) {
        damageTimer.current = BOSS_DMG_INTERVAL
        const newHp = Math.max(0, healthRef.current - BOSS_DAMAGE)
        setHealth(newHp)
        healthRef.current = newHp
        triggerHit()
      }
    } else {
      damageTimer.current = 0
    }
  })

  const hpPct   = hp / BOSS_HP
  const enraged = hpPct < 0.3
  const hpColor = hpPct > 0.5 ? '#00ff44' : hpPct > 0.25 ? '#ffaa00' : '#ff2200'

  if (dead) return null

  return (
    <RigidBody
      ref={rigidRef}
      position={[SPAWN_POSITION[0], -3, SPAWN_POSITION[2]]}
      type="kinematicPosition"
      colliders={false}
      enabledRotations={[false, false, false]}
      friction={0.8}
      restitution={0}
    >
      <CapsuleCollider args={[0.6, 0.5]} position={[0, 1.0, 0]} />

      <group ref={groupRef} userData={{ isBoss: true, isEnemy: true, enemyId: 'boss' }}>
        <group ref={modelRef}>
          <primitive
            object={clonedScene.current}
            scale={0.4}
            position={[0, 0, 0]}
            rotation={[0, -1.5, 0]}
            userData={{ isBoss: true, isEnemy: true, enemyId: 'boss' }}
          />
        </group>

        {/* Boss HP bar */}
        <group position={[0, 3.5, 0]}>
          <mesh renderOrder={999}>
            <planeGeometry args={[1.8, 0.14]} />
            <meshBasicMaterial color="#330000" transparent opacity={0.9} depthWrite={false} depthTest={false} />
          </mesh>
          <mesh position={[(hpPct - 1) * 0.9, 0, 0.001]} renderOrder={1000}>
            <planeGeometry args={[1.8 * hpPct, 0.13]} />
            <meshBasicMaterial
              color={enraged ? '#ff0000' : hpColor}
              depthWrite={false} depthTest={false}
            />
          </mesh>
        </group>
      </group>
    </RigidBody>
  )
})

// ✅ Fixed — passes bossRef correctly as ref
export default function BossSpawner({ bossRef }) {
  const bossActive   = useGameStore((s) => s.bossActive)
  const bossDefeated = useGameStore((s) => s.bossDefeated)

  if (!bossActive || bossDefeated) return null

  return <Boss ref={bossRef} />
}