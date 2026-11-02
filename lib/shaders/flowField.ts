/**
 * A slow domain-warped noise field — the starter background. Uses the
 * stage's shared uniforms (uTime, uResolution, uMouse, uScroll) plus its
 * own palette.
 */

export const flowFieldFragment = /* glsl */ `
  precision highp float;

  uniform float uTime;
  uniform vec2 uResolution;
  uniform vec2 uMouse;
  uniform float uScroll;
  uniform vec3 uColorA;
  uniform vec3 uColorB;
  uniform vec3 uColorC;

  varying vec2 vUv;

  // 2D simplex noise — Ashima Arts / Stefan Gustavson (MIT).
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

  float fbm(vec2 p) {
    float v = 0.0;
    float a = 0.5;
    for (int i = 0; i < 4; i++) {
      v += a * snoise(p);
      p *= 2.02;
      a *= 0.5;
    }
    return v;
  }

  void main() {
    vec2 uv = vUv;
    float aspect = uResolution.x / uResolution.y;
    vec2 p = vec2(uv.x * aspect, uv.y) * 1.6;
    float t = uTime * 0.06;

    // Domain warp, pushed a little by the pointer and by scroll.
    vec2 m = (uMouse - 0.5) * 0.35;
    vec2 q = vec2(fbm(p + t), fbm(p + vec2(5.2, 1.3) - t));
    vec2 r = vec2(
      fbm(p + 2.0 * q + vec2(1.7, 9.2) + m + uScroll * 1.5),
      fbm(p + 2.0 * q + vec2(8.3, 2.8) - m)
    );
    float f = fbm(p + 2.5 * r);

    vec3 col = mix(uColorA, uColorB, smoothstep(-0.4, 0.6, f));
    col = mix(col, uColorC, smoothstep(0.2, 0.9, length(r)) * 0.6);

    // Soft vignette.
    col *= 1.0 - 0.35 * pow(length(uv - 0.5) * 1.3, 2.0);
    gl_FragColor = vec4(col, 1.0);
  }
`;
