# AGENTS.md — music-study

Guidance for AI coding agents working in this repository.

## Project overview

UI-only music study app: note-reading practice on a grand staff. A random line of
scale notes is dealt; the user plays them on a MIDI keyboard in order and the
session scores each key press. Client-side only — no server or API.

- Stack: TypeScript, Solid (via `solid-vanilla`), Vite, Pico CSS, Web MIDI API
- Staff rendering uses the Bravura SMuFL font (`src/fonts/Bravura.woff2`)
- Live site: <https://richardwa.github.io/music-study>

## Layout

```
src/
  index.html        # Vite entry page
  index.ts          # app bootstrap
  index.css         # global styles
  util.ts           # shared helpers
  app/
    app.ts          # root app component
    components.ts   # UI components
    routes.ts       # routing
    staff.ts        # grand-staff / SMuFL rendering
docs/               # build output = GitHub Pages root (committed)
```


## How solid-vanilla works

Everything is a fluent chainable `RNode` wrapping a real DOM element (`node.el`). Key API (all from `"solid-vanilla"`):

- **Creation**: `h(tag)` for any tag; helpers `div()`, `span()`, `button()`, `grid(cols)`, `hbox()`, `vbox()`, `fragment()` (display:contents).
- **Children**: `node.inner(...children)` — accepts `RNode`, strings, signals, or arrays; replaces children and re-runs on subsequent calls.
- **Attributes/props**: `.attr(key, value)`; classes via `.cn(name)`; inline styles via `.css(name, value)`.
- **Events**: `.on(event, handler)`.
- **Side effects / async**: `.do(fn)` runs immediately with the node; inside `do(async (node) => ...)` you can await and then call `node.inner(...)` to fill content.
- **Reactivity**: `signal(initial)` returns a `Signal` with `.get()` / `.set(v)`. `node.watch(signalOrSignals, (node) => ...)` re-runs `fn` whenever the signal(s) change (auto-cleanup on unmount). Attribute/css values can also be a function or a signal for live updates.
- **Memoization**: inside a `watch`, `node.memo(key, () => RNode)` reuses the child keyed by `key` instead of recreating it — use for list rows (key by stable id).
- **Routing**: `new HashRouter(rootNode)`, `router.addRoute(path, componentFn)`, mount with `router.getRoot()`, navigate via `router.navigate(path)`.
- **Lifecycle**: `.onUnmount(fn)`; `node.unmount()` removes element and disposes watchers/intervals (`node.setInterval` is auto-cleaned).
- **Entry**: `render(element, ...nodes)` mounts nodes into a DOM element.

Example component:

```ts
const counter = () => {
  const count = signal(0);
  return button()
    .on("click", () => count.set(count.get() + 1))
    .watch(count, (node) => node.inner(`count: ${count.get()}`));
};

## Commands

Use **bun** (not npm/yarn/pnpm).

- `bun install` — install dependencies
- `bun run dev` — dev server on port 5173 (strict)
- `bun run build` — prettier format + `tsc` typecheck + build to `docs/`
- `bun run format` — prettier over `*.json`, `*.ts`, `./src`

## Conventions

- Strict TypeScript; keep `tsc` passing before committing (`bun run build`).
- Prettier runs automatically on build (prebuild); format new code with it.
- Build output goes to `docs/` — it is committed and serves GitHub Pages, so
  run `bun run build` before pushing when user-facing code changes.
- Asset paths must stay relative (`base: "./"`) so the site works from the
  project subpath on GitHub Pages.
- Client settings are persisted in localStorage (staff config, key, scale,
  note labels).
- No test suite; verify changes via `bun run build` and manual dev-server checks.
- try to keep files under 300 lines.
