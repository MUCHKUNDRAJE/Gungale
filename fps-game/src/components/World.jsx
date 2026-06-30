import { useGLTF } from '@react-three/drei'
import { useEffect } from 'react'
import { RigidBody } from '@react-three/rapier'
import * as THREE from 'three'

export default function World() {
  const { scene } = useGLTF('/models/backrooms.glb')

  useEffect(() => {
    scene.traverse((obj) => {
      if (obj.isMesh) {
        obj.castShadow = true
        obj.receiveShadow = true

        if (obj.material) {
          obj.material.envMapIntensity = 2.5
          if (obj.material.color) {
            const c = obj.material.color
            if (c.r < 0.1 && c.g < 0.1 && c.b < 0.1) {
              c.setRGB(0.08, 0.09, 0.12)
            }
          }
          if (obj.material.roughness !== undefined) {
            obj.material.roughness = Math.min(obj.material.roughness, 0.75)
          }
          obj.material.needsUpdate = true
        }
      }
    })
  }, [scene])

  return (
    // type="fixed" = static world, never moves
    // colliders="trimesh" = exact mesh shape collision (perfect for maps)
    <RigidBody type="fixed" colliders="trimesh">
      <primitive object={scene} position={[0, 0, 0]} scale={1} />
    </RigidBody>
  )
}

useGLTF.preload('/models/backrooms.glb')