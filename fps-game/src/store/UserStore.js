import { create } from 'zustand'

export const useGameStore = create((set) => ({
  health:    100,
  shield:    100,
  ammo:      72,
  energy:    100,
  kills:     0,
  isHit:     false,
  isLocked: false,
  GunChoose : "PP-19",  

  playerPos: [0, 1, 0],
  setLocked: (v) => set({ isLocked: v }),
  setGunChoose:  (v) => set({ GunChoose: v }),
  setHealth:  (v) => set({ health: v }),
  setShield:  (v) => set({ shield: v }),
  setAmmo:    (v) => set({ ammo: v }),
  setEnergy:  (v) => set({ energy: v }),
  addKill:    ()  => set((s) => ({ kills: s.kills + 1 })),
  triggerHit: ()  => {
    set({ isHit: true })
    setTimeout(() => set({ isHit: false }), 200)
  },
}))