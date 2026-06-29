// src/components/MuzzleFlash.jsx
import { useRef } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'

export default function MuzzleFlash({ isShooting }) {
  const { camera } = useThree()
  const meshRef    = useRef()
  const opacity    = useRef(0)

  useFrame((_, delta) => {
    if (!meshRef.current) return

    if (isShooting) {
      opacity.current = 1
    } else {
      opacity.current = Math.max(0, opacity.current - delta * 18)
    }

    meshRef.current.visible = opacity.current > 0.01
    meshRef.current.material.opacity = opacity.current

    if (meshRef.current.visible) {
      // Position at gun barrel — in front-right of camera
      const offset = new THREE.Vector3(0.22, -0.18, -0.7)
      const pos = offset.clone().applyMatrix4(camera.matrixWorld)
      meshRef.current.position.copy(pos)

      // Always face camera
      meshRef.current.quaternion.copy(camera.quaternion)

      // Random scale flicker
      const s = 0.6 + Math.random() * 0.5
      meshRef.current.scale.set(s, s, s)
    }
  })

  return (
    <mesh ref={meshRef} visible={false}>
      <planeGeometry args={[0.25, 0.25]} />
      <meshBasicMaterial
        color="#ffcc44"
        transparent
        opacity={1}
        depthWrite={false}
        side={THREE.DoubleSide}
      />
    </mesh>
  )
}