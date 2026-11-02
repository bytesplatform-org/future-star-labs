/**
 * The hero headline, as the thermal trail draws it. Each word is
 * rasterised once into two atlases — as set (hollow words stroked) and
 * filled — in the DOM's own font, size and tracking. Every frame the words
 * are placed from the live layout (their left edge and baseline), so the
 * scroll drift and pointer lean carry straight into the GL copy.
 */

import type { WordPlacement } from "./thermalTrail";

export type HeroWord = {
  /** the inline-block holding the word (data-hollow when set as an outline) */
  word: HTMLElement;
  /** an empty inline-block on the same line; its bottom edge is the baseline */
  baseline: HTMLElement;
};

type Row = { ay: number; w: number; h: number; ascent: number };

export type HeroAtlas = {
  display: HTMLCanvasElement;
  fill: HTMLCanvasElement;
  rows: Row[];
  pad: number;
};

export function buildAtlas(words: HeroWord[], pixelRatio: number): HeroAtlas {
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

  const make = () => {
    const c = document.createElement("canvas");
    c.width = w;
    c.height = Math.ceil(y);
    return c;
  };
  const display = make();
  const fill = make();
  const dc = display.getContext("2d")!;
  const fc = fill.getContext("2d")!;

  specs.forEach((s, i) => {
    const baseline = rows[i].ay + pad + s.ascent;
    for (const ctx of [dc, fc]) {
      ctx.font = s.font;
      ctx.fillStyle = "#fff";
      ctx.strokeStyle = "#fff";
      ctx.textBaseline = "alphabetic";
    }
    dc.lineWidth = s.stroke;
    Array.from(s.text).forEach((ch, j) => {
      const x = pad + s.xs[j];
      if (s.hollow) dc.strokeText(ch, x, baseline);
      else dc.fillText(ch, x, baseline);
      fc.fillText(ch, x, baseline);
    });
  });

  return { display, fill, rows, pad };
}

/** where each word sits now, in the canvas's device pixels */
export function placeWords(words: HeroWord[], atlas: HeroAtlas, canvas: DOMRect, pixelRatio: number): WordPlacement[] {
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
    };
  });
}
