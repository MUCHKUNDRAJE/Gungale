// src/components/BulletHole.jsx
import { useRef, useEffect } from 'react'
import { useThree } from '@react-three/fiber'
import * as THREE from 'three'

const MAX_DECALS   = 40    // max bullet holes before oldest removed
const DECAL_SIZE   = 0.18  // size of bullet hole

export default function BulletHoleSystem({ hitsRef }) {
  const { scene } = useThree()
  const decals    = useRef([])

  // Expose spawnHole so BulletSystem can call it
  useEffect(() => {
    if (!hitsRef) return
    hitsRef.current = { spawnHole }
  }, [])

  function spawnHole(position, normal, surfaceObject) {
    // Orient decal to surface normal
    const quaternion = new THREE.Quaternion()
    quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), normal)

    // Slight random rotation around normal
    const randRot = new THREE.Quaternion()
    randRot.setFromAxisAngle(normal, Math.random() * Math.PI * 2)
    quaternion.premultiply(randRot)

    // Bullet hole geometry — flat plane slightly offset from surface
    const geo = new THREE.PlaneGeometry(DECAL_SIZE, DECAL_SIZE)
    const mat = new THREE.MeshBasicMaterial({
      color: '#111111',
      transparent: true,
      opacity: 0.85,
      depthWrite: false,          // prevents z-fighting
      polygonOffset: true,
      polygonOffsetFactor: -1,
      polygonOffsetUnits: -1,
      side: THREE.DoubleSide,
    })

    const hole = new THREE.Mesh(geo, mat)
    hole.position.copy(position).addScaledVector(normal, 0.008) // tiny offset off wall
    hole.quaternion.copy(quaternion)

    // Outer ring
    const ringGeo = new THREE.RingGeometry(DECAL_SIZE * 0.45, DECAL_SIZE * 0.65, 12)
    const ringMat = new THREE.MeshBasicMaterial({
      color: '#2a1a0a',
      transparent: true,
      opacity: 0.5,
      depthWrite: false,
      polygonOffset: true,
      polygonOffsetFactor: -1,
      polygonOffsetUnits: -1,
      side: THREE.DoubleSide,
    })
    const ring = new THREE.Mesh(ringGeo, ringMat)
    ring.position.copy(position).addScaledVector(normal, 0.007)
    ring.quaternion.copy(quaternion)

    // Crack lines radiating out
    const crackGroup = new THREE.Group()
    const numCracks = 4 + Math.floor(Math.random() * 3)
    for (let i = 0; i < numCracks; i++) {
      const angle = (i / numCracks) * Math.PI * 2 + Math.random() * 0.4
      const len   = DECAL_SIZE * (0.5 + Math.random() * 0.5)
      const pts   = [
        new THREE.Vector3(0, 0, 0),
        new THREE.Vector3(Math.cos(angle) * len, Math.sin(angle) * len, 0)
      ]
      const crackGeo = new THREE.BufferGeometry().setFromPoints(pts)
      const crackMat = new THREE.LineBasicMaterial({
        color: '#1a0a00',
        transparent: true,
        opacity: 0.4,
      })
      crackGroup.add(new THREE.Line(crackGeo, crackMat))
    }
    crackGroup.position.copy(position).addScaledVector(normal, 0.009)
    crackGroup.quaternion.copy(quaternion)

    scene.add(hole)
    scene.add(ring)
    scene.add(crackGroup)

    const decalEntry = { hole, ring, cracks: crackGroup, age: 0 }
    decals.current.push(decalEntry)

    // Remove oldest if over limit
    if (decals.current.length > MAX_DECALS) {
      const old = decals.current.shift()
      scene.remove(old.hole)
      scene.remove(old.ring)
      scene.remove(old.cracks)
      old.hole.geometry.dispose()
      old.ring.geometry.dispose()
    }
  }

  return null
}