// src/components/GunViewModel.jsx
import { useRef, useEffect, useState } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import { useGLTF } from '@react-three/drei'
import * as THREE from 'three'

// const GUN_POSITION  = [0.3, -0.3, -0.5]
// const GUN_ROTATION  = [0, Math.PI, 0]
// const GUN_SCALE     = 0.008
const GUN_ROTATION  = [0,  96, 0.4]
const GUN_SCALE     = 0.4
const GUN_POSITION  = [0.3, -0.3, -0.5]

const SWAY_AMOUNT   = 0.04
const SWAY_SPEED    = 6
const BOB_AMOUNT    = 0.018
const BOB_SPEED     = 10
const LERP_SPEED    = 8

export default function GunViewModel({ isMovingRef, isShooting }) {
  const { camera } = useThree()
  const { scene }  = useGLTF('/models/handgun.glb')
  const gunRef     = useRef()
  const clonedScene = useRef()
  const centerOffset = useRef(new THREE.Vector3())

  useEffect(() => {
    clonedScene.current = scene.clone(true)

    // Find true center of model
    const box = new THREE.Box3().setFromObject(clonedScene.current)
    const size = box.getSize(new THREE.Vector3())
    const center = box.getCenter(new THREE.Vector3())
    console.log('Gun size:', size)
    console.log('Gun center:', center)
    centerOffset.current.copy(center).negate()

    clonedScene.current.traverse((obj) => {
      if (obj.isMesh) {
        obj.castShadow = false
        obj.receiveShadow = false
        obj.frustumCulled = false
      }
    })
  }, [scene])

  const bobTimer    = useRef(0)
  const swayX       = useRef(0)
  const swayY       = useRef(0)
  const currentBobY = useRef(0)
  const recoilZ     = useRef(0)
  const recoilRot   = useRef(0)
  const prevShoot   = useRef(false)

  useFrame((state, delta) => {
    if (!gunRef.current) return
    const isMoving = isMovingRef.current

    const t = Math.min(delta * LERP_SPEED, 1)

    // Recoil
    if (isShooting && !prevShoot.current) {
      recoilZ.current   = 0.12
      recoilRot.current = 0.08
    }
    prevShoot.current = isShooting
    recoilZ.current   += (0 - recoilZ.current)   * t * 1.5
    recoilRot.current += (0 - recoilRot.current) * t * 1.5

    // Walk bob
    if (isMoving) {
      bobTimer.current += delta * BOB_SPEED
      const targetBob = Math.sin(bobTimer.current) * BOB_AMOUNT
      currentBobY.current += (targetBob - currentBobY.current) * t
    } else {
      bobTimer.current = 0
      currentBobY.current += (0 - currentBobY.current) * t
    }

    // Mouse sway
    const mouseX = state.mouse.x
    const mouseY = state.mouse.y
    swayX.current += (-mouseX * SWAY_AMOUNT - swayX.current) * t
    swayY.current += (-mouseY * SWAY_AMOUNT - swayY.current) * t

    // Build position in camera local space
    const camPos = new THREE.Vector3(...GUN_POSITION)
    camPos.x += swayX.current
    camPos.y += swayY.current + currentBobY.current
    camPos.z += recoilZ.current

    // Convert to world space
    const worldPos = camPos.clone().applyMatrix4(camera.matrixWorld)
    gunRef.current.position.copy(worldPos)
    gunRef.current.quaternion.copy(camera.quaternion)

    // Apply rotation + recoil tilt
    const euler = new THREE.Euler(
      GUN_ROTATION[0] + recoilRot.current,
      GUN_ROTATION[1],
      GUN_ROTATION[2],
      'YXZ'
    )
    gunRef.current.quaternion.multiply(new THREE.Quaternion().setFromEuler(euler))
  })

  if (!clonedScene.current) return null

  return (
    <group ref={gunRef} scale={GUN_SCALE}>
      {/* Re-center model at its actual pivot */}
      <group position={[centerOffset.current.x, centerOffset.current.y, centerOffset.current.z]}>
        <primitive object={clonedScene.current} />
      </group>
    </group>
  )
}

useGLTF.preload('/models/handgun.glb')