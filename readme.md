# music-study

UI-only study app built on the solid-vanilla starter (client side only, no server/API).

Live at: <https://richardwa.github.io/music-study>

Note-reading practice on a grand staff: a random line of scale notes is dealt,
play them on a MIDI keyboard in order, and the session scores your key presses.

## Features
- solid vanilla framework
- vite dev server + build
- grand staff rendering (Bravura SMuFL font), bar lines every 4 notes
- configurable staff (treble / bass / both), key, scale, note labels — persisted in localStorage
- Web MIDI input for practice; device status shown in the toolbar
- per-session score: correct / attempts, accuracy %, and wrong presses
- Start button deals a new session of 16 notes; the session ends when the last note is reached

## Commands
- `bun install`
- `bun run dev` — dev server on port 5173
- `bun run build` — typecheck + build to `docs/`

## GitHub Pages
The site is deployed at <https://richardwa.github.io/music-study>.
The build output targets `docs/`, which is the GitHub Pages root. Enable Pages via
**Settings → Pages → Deploy from a branch**, branch `<branch>`, folder `/docs`.
Asset paths are relative, so the site works from a project subpath or a custom domain.