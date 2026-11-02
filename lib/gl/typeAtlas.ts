/**
 * Display type drawn in GL, kept true to the DOM it shadows.
 *
 * Each word is rasterised once, filled, into an atlas in the DOM's own
 * font, size and tracking. Hollow words are outlined in the shader from
 * that fill, not stroked here: canvas strokeText traces every contour of a
 * glyph, so letters built from overlapping shapes (Aldrich's A) would show
 * their inner seams, where the browser's own text-stroke merges them.
 *
 * Every frame the words are placed from the live layout — their left edge
 * and baseline — so CSS and GSAP motion carry straight into the GL copy.
 * The DOM text stays in place for readers and search.
 */

import * as THREE from "three";

export type AtlasWord = {
  /** the inline-block holding the word (data-hollow when set as an outline) */
  word: HTMLElement;
  /** an empty inline-block on the same line; its bottom edge is the baseline */
  baseline: HTMLElement;
};

/**
 * where one word sits on screen and in the atlas, all in device px
 * (top-left origin); outline is half the stroke width, 0 for filled words
 */
export type WordPlacement = { x: number; y: number; w: number; h: number; ax: number; ay: number; outline: number };

type Row = { ay: number; w: number; h: number; ascent: number };

export type TypeAtlas = {
  fill: HTMLCanvasElement;
  rows: Row[];
  /** per word: half the outline width in device px, 0 when filled */
  outline: number[];
  pad: number;
};

/** Collects the words under root: [data-atlas-word] elements, each with a [data-baseline] sibling. */
export function atlasWords(root: ParentNode): AtlasWord[] {
  return Array.from(root.querySelectorAll<HTMLElement>("[data-atlas-word]")).map(word => ({
    word,
    baseline: word.parentElement!.querySelector<HTMLElement>("[data-baseline]")!,
  }));
}

export function buildAtlas(words: AtlasWord[], pixelRatio: number): TypeAtlas {
  const pad = Math.ceil(16 * pixelRatio);
  const scratch = document.createElement("canvas").getContext("2d")!;

  const specs = words.map(({ word }) => {
    const cs = getComputedStyle(word);
    const size = parseFloat(cs.fontSize) * pixelRatio;
    const font = `${cs.fontStyle} ${cs.fontWeight} ${size}px ${cs.fontFamily}`;
    const tracking = (parseFloat(cs.letterSpacing) || 0) * pixelRatio;
    const raw = word.textContent?.trim() ?? "";
    const text = cs.textTransform === "uppercase" ? raw.toUpperCase() : raw;
    // Marked, not inferred: once the GL copy takes over, every DOM word is transparent.
    const hollow = word.dataset.hollow !== undefined;
    const stroke = parseFloat(cs.getPropertyValue("-webkit-text-stroke-width")) || 1;

    scratch.font = font;
    // Each glyph's x from the kerned advance of everything before it, plus tracking.
    const xs = Array.from(text, (_, i) => scratch.measureText(text.slice(0, i)).width + tracking * i);
    const width = scratch.measureText(text).width + tracking * text.length;
    const m = scratch.measureText(text);
    const ascent = Math.ceil(m.fontBoundingBoxAscent ?? size);
    const descent = Math.ceil(m.fontBoundingBoxDescent ?? size * 0.25);
    return { font, text, xs, width, ascent, descent, hollow, stroke: stroke * pixelRatio };
  });

  const w = Math.ceil(Math.max(...specs.map(s => s.width)) + pad * 2);
  const rows: Row[] = [];
  let y = 0;
  for (const s of specs) {
    const h = s.ascent + s.descent + pad * 2;
    rows.push({ ay: y, w, h, ascent: s.ascent });
    y += h;
  }

  const fill = document.createElement("canvas");
  fill.width = w;
  fill.height = Math.ceil(y);
  const fc = fill.getContext("2d")!;
  fc.fillStyle = "#fff";
  fc.textBaseline = "alphabetic";

  specs.forEach((s, i) => {
    const baseline = rows[i].ay + pad + s.ascent;
    fc.font = s.font;
    Array.from(s.text).forEach((ch, j) => fc.fillText(ch, pad + s.xs[j], baseline));
  });

  return { fill, rows, outline: specs.map(s => (s.hollow ? s.stroke / 2 : 0)), pad };
}

/** where each word sits now, in the canvas's device pixels */
export function placeWords(words: AtlasWord[], atlas: TypeAtlas, canvas: DOMRect, pixelRatio: number): WordPlacement[] {
  return words.map(({ word, baseline }, i) => {
    const row = atlas.rows[i];
    const left = word.getBoundingClientRect().left - canvas.left;
    const base = baseline.getBoundingClientRect().bottom - canvas.top;
    return {
      x: left * pixelRatio - atlas.pad,
      y: base * pixelRatio - row.ascent - atlas.pad,
      w: row.w,
      h: row.h,
      ax: 0,
      ay: row.ay,
      outline: atlas.outline[i],
    };
  });
}

/* ── GPU side ─────────────────────────────────────────────────────────── */

/**
 * GLSL: `vec2 glyph(vec2 p)` for p in device px from the canvas's top-left.
 * x is the glyph as set, y the glyph filled. A hollow word's outline is the
 * band where the fill changes within half a stroke — the edge of the
 * glyph's union, so overlapping contours inside a letter never show.
 *
 * Each call also leaves which word p fell in (glyphWord, −1 for none) and
 * where within it (glyphLocal, 0..1 across its box), for per-word effects.
 */
export const glyphChunk = (words: number) => /* glsl */ `
  uniform sampler2D uFill;
  uniform vec2 uAtlasSize;
  uniform vec4 uWords[${words}];
  uniform vec3 uAtlas[${words}];

  float glyphWord = -1.0;
  vec2 glyphLocal = vec2(0.0);

  vec2 glyph(vec2 p) {
    vec2 g = vec2(0.0);
    glyphWord = -1.0;
    for (int i = 0; i < ${words}; i++) {
      vec2 q = p - uWords[i].xy;
      if (q.x >= 0.0 && q.y >= 0.0 && q.x < uWords[i].z && q.y < uWords[i].w) {
        glyphWord = float(i);
        glyphLocal = q / uWords[i].zw;
        vec2 at = uAtlas[i].xy + q;
        float f = texture2D(uFill, at / uAtlasSize).a;
        float shown = f;
        float r = uAtlas[i].z;
        if (r > 0.0) {
          float hi = f;
          float lo = f;
          for (int k = 0; k < 8; k++) {
            float ang = float(k) * 0.7853982;
            float s = texture2D(uFill, (at + vec2(cos(ang), sin(ang)) * r) / uAtlasSize).a;
            hi = max(hi, s);
            lo = min(lo, s);
          }
          shown = clamp(hi - lo, 0.0, 1.0);
        }
        g = max(g, vec2(shown, f));
      }
    }
    return g;
  }
`;

export type GlyphUniforms = {
  uFill: THREE.IUniform<THREE.Texture | null>;
  uAtlasSize: THREE.IUniform<THREE.Vector2>;
  uWords: THREE.IUniform<THREE.Vector4[]>;
  uAtlas: THREE.IUniform<THREE.Vector3[]>;
};

export function glyphUniforms(words: number): GlyphUniforms {
  return {
    uFill: { value: null },
    uAtlasSize: { value: new THREE.Vector2(1, 1) },
    uWords: { value: Array.from({ length: words }, () => new THREE.Vector4()) },
    uAtlas: { value: Array.from({ length: words }, () => new THREE.Vector3()) },
  };
}

/** Uploads an atlas; returns its texture for the caller to dispose. */
export function setGlyphAtlas(u: GlyphUniforms, fill: HTMLCanvasElement): THREE.Texture {
  u.uFill.value?.dispose();
  const t = new THREE.CanvasTexture(fill);
  t.flipY = false;
  t.generateMipmaps = false;
  t.minFilter = THREE.LinearFilter;
  t.magFilter = THREE.LinearFilter;
  u.uFill.value = t;
  u.uAtlasSize.value.set(fill.width, fill.height);
  return t;
}

export function setGlyphPlacements(u: GlyphUniforms, words: WordPlacement[]) {
  words.slice(0, u.uWords.value.length).forEach((p, i) => {
    u.uWords.value[i].set(p.x, p.y, p.w, p.h);
    u.uAtlas.value[i].set(p.ax, p.ay, p.outline);
  });
}
