/** Shared GLSL chunks, spliced into fragment shaders as strings. */

// 2D simplex noise — Ashima Arts / Stefan Gustavson (MIT).
export const simplex2D = /* glsl */ `
  vec3 permute(vec3 x) { return mod(((x * 34.0) + 1.0) * x, 289.0); }
  float snoise(vec2 v) {
    const vec4 C = vec4(0.211324865405187, 0.366025403784439, -0.577350269189626, 0.024390243902439);
    vec2 i = floor(v + dot(v, C.yy));
    vec2 x0 = v - i + dot(i, C.xx);
    vec2 i1 = (x0.x > x0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
    vec4 x12 = x0.xyxy + C.xxzz;
    x12.xy -= i1;
    i = mod(i, 289.0);
    vec3 p = permute(permute(i.y + vec3(0.0, i1.y, 1.0)) + i.x + vec3(0.0, i1.x, 1.0));
    vec3 m = max(0.5 - vec3(dot(x0, x0), dot(x12.xy, x12.xy), dot(x12.zw, x12.zw)), 0.0);
    m = m * m;
    m = m * m;
    vec3 x = 2.0 * fract(p * C.www) - 1.0;
    vec3 h = abs(x) - 0.5;
    vec3 ox = floor(x + 0.5);
    vec3 a0 = x - ox;
    m *= 1.79284291400159 - 0.85373472095314 * (a0 * a0 + h * h);
    vec3 g;
    g.x = a0.x * x0.x + h.x * x0.y;
    g.yz = a0.yz * x12.xz + h.yz * x12.yw;
    return 130.0 * dot(m, g);
  }

  float fbm3(vec2 p) {
    float v = 0.5 * snoise(p);
    v += 0.25 * snoise(p * 2.03 + 17.1);
    v += 0.125 * snoise(p * 4.01 + 31.7);
    return v;
  }

  float hash12(vec2 p) {
    vec3 p3 = fract(vec3(p.xyx) * 0.1031);
    p3 += dot(p3, p3.yzx + 33.33);
    return fract((p3.x + p3.y) * p3.z);
  }
`;

/**
 * The site's temperature ramp: cold electric blue → steel → thermal orange.
 * Colour carries meaning — blue is low energy, orange is heat.
 */
export const thermalRamp = /* glsl */ `
  const vec3 COLD = vec3(0.24, 0.42, 1.0);
  const vec3 STEEL = vec3(0.60, 0.64, 0.70);
  const vec3 HOT = vec3(1.0, 0.40, 0.13);
  const vec3 SIGNAL = vec3(0.56, 0.46, 1.0);

  vec3 thermal(float k) {
    k = clamp(k, 0.0, 1.0);
    return k < 0.5 ? mix(COLD, STEEL, k * 2.0) : mix(STEEL, HOT, k * 2.0 - 1.0);
  }
`;
