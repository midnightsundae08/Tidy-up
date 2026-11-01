# Tidy Up

A cozy drag-and-drop game about putting things back where they belong.

Drag each tool into its drawer. Campaign is a sequence of handmade and generated levels. Endless is the same sorting with no clock and no last round. Challenges are three-round runs: Silhouette, One peek, Mixed cabinet, and Perfect fit.

The title screen loads the music, then **Start tidying** starts the theme. That theme loops on the menus. Other tracks play during a round, duck for a short fanfare when the round is cleared, and a new track starts on the next round.

## Develop

Node.js 20 or newer.

```bash
npm install
npm run dev
```

```bash
npm test
npm run build
```

`npm run dev` starts the Vite dev server. `npm run build` typechecks and writes the static site to `dist/`. Asset URLs are relative, so the build can be hosted at a subpath such as `/tidyup/`.

Music files live in `public/assets/` and are copied into the build as-is.

## Serve the build

`server.cjs` is a small Express app that serves `dist/` and falls back to `index.html`. It does not listen on a port. A parent server mounts it. Express is loaded from a sibling `main` app:

```text
../main/node_modules/express
```
