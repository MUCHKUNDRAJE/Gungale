// src/components/BulletSystem.jsx
import { useRef, useEffect, forwardRef, useImperativeHandle } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'

const MAX_BULLETS   = 20
const BULLET_SPEED  = 80
const BULLET_LIFE   = 1.2
const BULLET_RADIUS = 0.04
const BULLET_DAMAGE = 25     // per shot — 4 shots to kill

export const BulletSystem = forwardRef(({ hitsRef, enemyGroupsRef }, ref) => {
  const { scene, camera } = useThree()
  const bullets     = useRef([])
  const bulletPool  = useRef([])
  const impactPool  = useRef([])
  const poolReady   = useRef(false)

  // Kill counter
  const killCount = useRef(0)

  useImperativeHandle(ref, () => ({ fire: fireBullet }))

  useEffect(() => {
    const geo = new THREE.SphereGeometry(BULLET_RADIUS, 4, 4)
    const mat = new THREE.MeshBasicMaterial({ color: '#ffdd44' })
    for (let i = 0; i < MAX_BULLETS; i++) {
      const m = new THREE.Mesh(geo, mat)
      m.visible = false
      scene.add(m)
      bulletPool.current.push(m)
    }

    const igeo = new THREE.SphereGeometry(0.1, 6, 6)
    for (let i = 0; i < 8; i++) {
      const imat = new THREE.MeshBasicMaterial({ color: '#ff8800', transparent: true, opacity: 0.9 })
      const m = new THREE.Mesh(igeo, imat)
      m.visible = false
      scene.add(m)
      impactPool.current.push(m)
    }

    poolReady.current = true
    return () => {
      bulletPool.current.forEach(m => scene.remove(m))
      impactPool.current.forEach(m => scene.remove(m))
    }
  }, [scene])

  function fireBullet() {
    if (!poolReady.current) return

    const direction = new THREE.Vector3()
    camera.getWorldDirection(direction)
    direction.x += (Math.random() - 0.5) * 0.012
    direction.y += (Math.random() - 0.5) * 0.012
    direction.normalize()

    const startPos  = camera.position.clone().add(direction.clone().multiplyScalar(0.6))
    const raycaster = new THREE.Raycaster(startPos, direction, 0, 300)

    // Get all hittable objects
    const hittable = scene.children.filter(c =>
      !['DirectionalLight','AmbientLight','HemisphereLight','PointLight'].includes(c.type)
      && !c.isCamera
    )
    const hits = raycaster.intersectObjects(hittable, true)

    let hitPoint  = null
    let hitNormal = new THREE.Vector3(0, 0, 1)
    let hitDist   = 300
    let hitEnemy  = null
    let hitEnemyId = null

    if (hits.length > 0) {
      const first    = hits[0]
      hitPoint       = first.point.clone()
      hitDist        = first.distance
      hitNormal      = first.face?.normal?.clone() ?? new THREE.Vector3(0, 1, 0)

      // Transform normal to world space
      const normalMatrix = new THREE.Matrix3().getNormalMatrix(first.object.matrixWorld)
      hitNormal.applyMatrix3(normalMatrix).normalize()

      // Check if enemy was hit
      let obj = first.object
      while (obj) {
        if (obj.userData?.isEnemy) {
          hitEnemyId = obj.userData.enemyId
          break
        }
        obj = obj.parent
      }
    }

    const bullet = bulletPool.current.find(m => !m.visible) || bulletPool.current[0]
    bullet.position.copy(startPos)
    bullet.visible = true

    bullets.current.push({
      mesh: bullet,
      velocity: direction.clone().multiplyScalar(BULLET_SPEED),
      life: BULLET_LIFE,
      startPos: startPos.clone(),
      maxDist: hitDist,
      hitPoint,
      hitNormal,
      hitEnemyId,
      hasHit: false,
    })
  }

  function spawnImpact(position) {
    const m = impactPool.current.find(x => !x.visible) || impactPool.current[0]
    m.position.copy(position)
    m.visible = true
    m.material.opacity = 0.9
    setTimeout(() => { m.visible = false }, 100)
  }

  useFrame((_, delta) => {
    for (let i = bullets.current.length - 1; i >= 0; i--) {
      const b = bullets.current[i]
      b.life -= delta
      b.mesh.position.addScaledVector(b.velocity, delta)

      const traveled = b.mesh.position.distanceTo(b.startPos)

      if (!b.hasHit && traveled >= b.maxDist && b.hitPoint) {
        b.hasHit = true
        b.mesh.visible = false

        spawnImpact(b.hitPoint)

        if (b.hitEnemyId !== null && b.hitEnemyId !== undefined) {
          // Hit an enemy — deal damage
          const enemyMesh = enemyGroupsRef?.current?.[b.hitEnemyId]
          if (enemyMesh?.takeDamage) {
            enemyMesh.takeDamage(BULLET_DAMAGE)
          }
          // Orange impact flash for enemy
          const flash = impactPool.current.find(x => !x.visible) || impactPool.current[0]
          flash.position.copy(b.hitPoint)
          flash.material.color.set('#ff4400')
          flash.visible = true
          setTimeout(() => { flash.visible = false }, 80)
        } else {
          // Hit a wall — spawn bullet hole decal
          if (hitsRef?.current?.spawnHole) {
            hitsRef.current.spawnHole(b.hitPoint, b.hitNormal)
          }
        }

        bullets.current.splice(i, 1)
        continue
      }

      if (b.life <= 0 || traveled > 300) {
        b.mesh.visible = false
        bullets.current.splice(i, 1)
      }
    }
  })

  return null
})

export default BulletSystem