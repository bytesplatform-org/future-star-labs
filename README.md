# Future Star Labs

The Future Star Labs site: physics, materials and energy from first principles, told as eight scenes. `MATTER → ENERGY → SIGNAL → DISCOVERY`.

```bash
npm run dev     # http://localhost:3000
npm run build
```

## How it fits together

**Hero** (`components/home/Hero.tsx`):
- The name is set as three lines that drift apart along x, alternately, as the page scrolls, and lean away from the pointer.
- The pointer stirs a thermal fluid (`lib/hero/thermalTrail.ts`, a stable-fluids solver after the bytesplatform.com ink trail). The dye is heat: it rises with buoyancy and is drawn as isotherms.
- Once the arrival has played, the same pass draws the headline from a glyph atlas (`lib/hero/heroType.ts`), placed every frame from the live DOM.
  - The fluid refracts the letters, splitting them into blue and orange fringes.
  - The heat burns them toward white and fills the hollow STAR.
- The DOM `<h1>` stays underneath for readers and search, and stays visible without WebGL or float render targets, or under reduced motion.

**Navigation** (`components/site/SiteNav.tsx`):
- It mirrors futurestarlabs.com's menu (data in `lib/content/site.ts`).
- Pages this rebuild doesn't have yet link to the original site, marked ↗.
- Subjects opens a panel listing the notebook chapters. Below `xl` the nav becomes a full-screen menu.

**GLSL** (`lib/gl/engine.ts`):
- A small Three.js stage on GSAP's ticker. `components/gl/ShaderCanvas.tsx` mounts a fullscreen shader pass.
- It drives the hero's thermal trail and the Seebeck experiment (`lib/shaders/seebeckJunction.ts`, state in `lib/gl/junctionState.ts`).

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
