# Future Star Labs

The Future Star Labs site: physics, materials and energy from first principles, told as eight scenes. `MATTER → ENERGY → SIGNAL → DISCOVERY`.

```bash
npm run dev     # http://localhost:3000
npm run build
```

## How it fits together

**Loader and boot** (`components/home/Loader.tsx`, `lib/boot.ts`):
- Anything that must be ready before the home page is seen registers `bootTask(promise)`: fonts, page load, the hero's GL headline. The loader holds until they settle (never under ~1s, never over 9s).
- Progress is real, with a creep so it never looks stuck.
- On exit the screen splits along its middle: the top half (and its half of LOADING) slides left, the bottom half slides right.
- Entrances and pointer trails wait on `onBootDone`, so nothing plays or trails under the loader.
- There's no loader under reduced motion, without JS, or on client navigation back home.

**Hero** (`components/home/Hero.tsx`):
- The name is set as three lines that drift apart along x, alternately, as the page scrolls, and lean away from the pointer.
- The headline is readied in GL behind the loader and enters as it parts, each word materialising from its own side behind a burning front. It's drawn in GL (`lib/gl/typeAtlas.ts` glyph atlas, placed every frame from the live DOM) through a thermal fluid the pointer stirs (`lib/hero/thermalTrail.ts`).
  - The fluid bends the letters, splitting them into blue and orange fringes.
  - Its heat burns them toward white and fills the hollow STAR.
  - The fluid itself is never drawn in the open.
- The DOM `<h1>` stays underneath for readers and search, and stays visible without WebGL or float render targets, or under reduced motion.

**Pointer trail** (`components/gl/FilmTrail.tsx`, `lib/gl/filmTrail.ts`):
- A small liquid-film trail over the whole home page, after the pearl trail on bytesplatform.com.
- It fades out about 1.8s after the pointer stops, then the solver sleeps.
- Fine pointers only, and not under reduced motion.

**Navigation** (`components/site/SiteNav.tsx`):
- It mirrors futurestarlabs.com's menu (data in `lib/content/site.ts`).
- Pages this rebuild doesn't have yet link to the original site, marked ↗.
- Subjects opens a panel listing the notebook chapters. Below `xl` the nav becomes a full-screen menu.

**GLSL** (`lib/gl/engine.ts`): a small Three.js stage on GSAP's ticker. `components/gl/ShaderCanvas.tsx` mounts a fullscreen shader pass; every stage pauses offscreen. On the home page:
- hero headline: `lib/hero/thermalTrail.ts`
- pointer film trail: `lib/gl/filmTrail.ts`
- Fig. 02 interference plate in the intro: `lib/shaders/interference.ts`
- each field's phenomenon, lit in the active row: `lib/shaders/phenomena.ts`
- heat under the thermocouple diagram, following the scene's steps: `lib/shaders/coupleHeat.ts`
- the Seebeck experiment: `lib/shaders/seebeckJunction.ts`
- the footer wordmark as a signal: `lib/shaders/signalType.ts`

Display type drawn in GL (the hero and footer wordmarks) shares `lib/gl/typeAtlas.ts`. Mark words `data-atlas-word` (plus `data-hollow` for outlines) beside a `data-baseline` marker; the DOM text stays underneath.

**Motion**:
- Lenis (`lib/animation/scroll.ts`) drives the scroll and keeps ScrollTrigger in step.
- GSAP runs the scrubbed pieces.
- Reveals are CSS (`[data-reveal="mask|sweep|rule|settle"]` in `globals.css`), armed by one observer.

**Reduced motion and no JS**: `html.motion` is set before first paint only when motion is allowed. Without it, the scroll scenes collapse and everything is visible.

**Content**:
- Everything factual lives in `lib/content/`, sourced from futurestarlabs.com. `subjects.ts` generates `/subjects/[slug]`.
- Write equations with `_x` subscripts (`T_h`) and render them through `components/site/Expr.tsx`.

**Type**: Aldrich for everything, IBM Plex Mono for technical labels.

> CSS modules aren't used here. The Turbopack rule in `next.config.ts` runs Tailwind over every `*.css`, so component styles live in `app/globals.css` under prefixed class names (`hero-*`, `te-*`, `method-*`).
