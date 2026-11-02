import ShaderCanvas from "@/components/gl/ShaderCanvas";
import Reveal from "@/components/Reveal";
import { flowFieldFragment } from "@/lib/shaders/flowField";

// vec3 uniforms take plain [r, g, b] arrays, so they cross the server/client line as-is.
const palette = {
  uColorA: { value: [0.04, 0.05, 0.09] },
  uColorB: { value: [0.18, 0.22, 0.55] },
  uColorC: { value: [0.95, 0.55, 0.35] },
};

const sections = ["GLSL", "Lenis", "GSAP"];

export default function Home() {
  return (
    <>
      <ShaderCanvas
        fragmentShader={flowFieldFragment}
        uniforms={palette}
        className="fixed inset-0 -z-10 h-full w-full bg-[#0a0d17]"
      />
      <section className="flex min-h-svh items-center px-8 text-white">
        <h1 className="text-6xl font-semibold tracking-tight md:text-8xl">Future Star Labs</h1>
      </section>
      <Reveal className="flex flex-col gap-[40vh] px-8 pb-[40vh] text-white">
        {sections.map(name => (
          <h2 key={name} data-reveal className="text-5xl font-medium md:text-7xl">
            {name}
          </h2>
        ))}
      </Reveal>
    </>
  );
}
