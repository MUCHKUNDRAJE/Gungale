# fps-game — WebGL FPS demo (React + Vite)

A small first-person shooter-style demo built with React, React Three Fiber, Rapier physics and Vite. The project includes a GLB map model, a physics-driven player capsule, pointer-lock mouse look, and simple HUD and post-processing for a polished look.

## Getting started

Prerequisites: Node.js (16+) and npm or an equivalent package manager.

Install dependencies and run the dev server:

```bash
npm install
npm run dev
```

Open the URL shown by Vite (usually http://localhost:5173) in a WebGL-capable browser (Chrome, Edge, or Firefox).

Build for production:

```bash
npm run build
npm run preview   # serve the production build locally
```

## Controls

- Click the canvas to capture the mouse (pointer lock).
- Move: WASD
- Jump: Space
- Release mouse: Esc
- Aim: Move the mouse while pointer is locked

The HUD displays a crosshair and a small instruction panel.

## Project structure (key files)

- `index.html` — app entry.
- `src/main.jsx` — React bootstrap.
- `src/App.jsx` — mounts `HUD` and `GameCanvas`.
- `src/components/GameCanvas.jsx` — R3F Canvas, lighting, postprocessing and physics provider.
- `src/components/Player.jsx` — physics player capsule, movement, jump, head-bob and pointer-lock controls.
- `src/components/World.jsx` — loads `/public/models/map.glb` and converts meshes to static colliders.
- `public/models/map.glb` — GLB map used in the demo.

## Notes & tips

- The player uses a Rapier `RigidBody` capsule with a downward raycast for reliable ground detection.
- Toggle physics debug by setting `debug={true}` on the `Physics` component in `GameCanvas.jsx`.
- The project already includes `dev`, `build`, and `preview` scripts in `package.json`.

## Troubleshooting

- If the scene is black or won't render, confirm WebGL is enabled and the browser supports required features.
- Large `map.glb` files may take time to load; open the browser console for progress/errors.

## License & credits

This repository is a demo. Assets (models/materials) may have separate licenses — check `public/models` for source information.

Enjoy — let me know if you want a README variant with deployment steps (GitHub Pages / Netlify) or a short developer guide for adding new weapons, enemies, or networked multiplayer.
