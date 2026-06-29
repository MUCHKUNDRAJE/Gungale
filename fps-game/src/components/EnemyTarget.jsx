import { useRef, useState, forwardRef, useImperativeHandle } from 'react'
import { useFrame } from '@react-three/fiber'
import { RigidBody, CapsuleCollider } from '@react-three/rapier'
import { useGLTF } from '@react-three/drei'
import * as THREE from 'three'
import { useGameStore } from '../store/userStore'



const ENEMY_HP = 100

useGLTF.preload('/models/target.glb')

const Enemy = forwardRef(function Enemy({ position, onKill, id }, ref) {
  const rigidRef  = useRef()
  const groupRef  = useRef()
  const { scene } = useGLTF('/models/target.glb')
  const [hp, setHp]               = useState(ENEMY_HP)
  const [dead, setDead]           = useState(false)
  const [deathAnim, setDeathAnim] = useState(false)
  const deathTimer = useRef(0)
  const bobTimer   = useRef(Math.random() * Math.PI * 2)
  const hpRef      = useRef(ENEMY_HP)
  const addKill = useGameStore((s) => s.addKill)

  // Clone so each enemy is independent
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

      // Flash red on GLB materials
      clonedScene.current.traverse((obj) => {
        if (obj.isMesh && obj.material) {
          const orig = obj.material.color.clone()
          obj.material.color.set('#ff2200')
          setTimeout(() => {
            if (obj.material) obj.material.color.copy(orig)
          }, 80)
        }
      })

      if (hpRef.current <= 0) {
         addKill()
        setDead(true)
        setDeathAnim(true)

        // Physics ragdoll kick on death
        if (rigidRef.current) {
          rigidRef.current.setBodyType(0)   // 0 = dynamic, lets it fall
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
    bobTimer.current += delta
    groupRef.current.position.y = Math.sin(bobTimer.current * 1.2) * 0.03
  })

  const hpPct = hp / ENEMY_HP

  if (dead && deathTimer.current > 2) return null

  return (
    <RigidBody
      ref={rigidRef}
      position={position}
      type="fixed"
      colliders={false}
      enabledRotations={[false, false, false]}
      friction={0.8}
      restitution={0}
    >
      {/* Capsule sized to 0.5 height model */}
      <CapsuleCollider
        args={[0.12, 0.12]}     // [halfHeight, radius] for 0.5 tall model
        position={[0, 0.25, 0]} // sit it just above ground
      />

      <group
        ref={groupRef}
        userData={{ isEnemy: true, enemyId: id }}
      >
        {/* GLB model */}
        <primitive
          object={clonedScene.current}
          scale={1.2}
          position={[0, 1, 0]}
          rotation={[0, Math.PI, 0]}
          userData={{ isEnemy: true, enemyId: id }}
        />

        {/* ── Health bar — unchanged ── */}
        <group position={[0, 2, 0]}>
          {/* BG */}
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
          {/* Fill */}
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
    { id: 0, position: [-32,  0.01, 7.85]  },
    { id: 1, position: [-19,  0.01, 12.85]  },
     { id: 2, position: [-35,  0.01, -3.85]  },
      { id: 3, position: [-28,  0.01, 1.85]  },
       { id: 4, position: [-24,  0.01, 0.890]  },
        { id: 5, position: [-2,  0.01, 8.85]  },
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