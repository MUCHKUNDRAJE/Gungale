import { create } from 'zustand'

export const useGameStore = create((set) => ({
  isLocked: false,        // pointer lock state
  playerPos: [0, 1, 0],
  setLocked: (v) => set({ isLocked: v }),
}))