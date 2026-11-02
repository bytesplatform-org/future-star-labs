import type { FieldKey } from "./subjects";

/** Scene 03 — the fields of exploration, each grounded in real subjects. */
export const fields: {
  key: FieldKey;
  title: string;
  phenomenon: string;
  text: string;
  subjects: { title: string; href: string }[];
}[] = [
  {
    key: "thermal",
    title: "Thermal Energy",
    phenomenon: "∇T → J",
    text: "How heat moves, settles into equilibrium, and converts into other forms of energy.",
    subjects: [
      { title: "Thermoelectrics", href: "/subjects/thermoelectrics" },
      { title: "Thermodynamics", href: "/subjects/thermodynamics" },
    ],
  },
  {
    key: "em",
    title: "Electromagnetism",
    phenomenon: "ε = −N dΦ/dt",
    text: "Magnetic fields, changing flux, and the currents it induces — Lenz’s law at work.",
    subjects: [{ title: "Induction", href: "/subjects/physics#induction" }],
  },
  {
    key: "electric",
    title: "Electricity",
    phenomenon: "U = qV",
    text: "Charge, potential and capacitance: how energy is stored in a field and released.",
    subjects: [
      { title: "Capacitance", href: "/subjects/physics#capacitance" },
      { title: "Electric potential", href: "/subjects/physics#potential" },
    ],
  },
  {
    key: "materials",
    title: "Materials",
    phenomenon: "nλ = 2d sin θ",
    text: "Crystal structure, thin films and interfaces — the architecture that decides what matter can do.",
    subjects: [
      { title: "Material structures", href: "/subjects/material-structures" },
      { title: "Thin films", href: "/subjects/thin-films" },
      { title: "Colloids & interfaces", href: "/subjects/colloids-and-interfaces" },
    ],
  },
  {
    key: "signal",
    title: "Experimentation",
    phenomenon: "P₁ → P₂",
    text: "The apparatus and the measurement: vacuum systems, deposition chambers and living signals.",
    subjects: [
      { title: "Vacuum systems", href: "/subjects/vacuum-system" },
      { title: "Electrophysiology", href: "/subjects/electrophysiology" },
    ],
  },
];

/** Scene 05 — the notebook index; every entry is a chapter on a subject page. */
export const chapters = [
  { title: "Thermoelectrics", expr: "heat ⇄ current", href: "/subjects/thermoelectrics", subject: "Thermoelectrics" },
  { title: "Peltier Effect", expr: "I → Q̇", href: "/subjects/thermoelectrics#peltier", subject: "Thermoelectrics" },
  { title: "Thermocouples", expr: "V = α ΔT", href: "/subjects/thermoelectrics#thermocouples", subject: "Thermoelectrics" },
  { title: "Induction", expr: "ε = −N dΦ/dt", href: "/subjects/physics#induction", subject: "Physics" },
  { title: "Capacitance", expr: "C = Q / V", href: "/subjects/physics#capacitance", subject: "Physics" },
  { title: "Electric Potential", expr: "U = qV", href: "/subjects/physics#potential", subject: "Physics" },
  { title: "Phase Equilibrium", expr: "dG = 0", href: "/subjects/thermodynamics#phase-equilibrium", subject: "Thermodynamics" },
  { title: "X-Ray Diffraction", expr: "nλ = 2d sin θ", href: "/subjects/material-structures#xrd", subject: "Material Structures" },
  { title: "Thin-Film Deposition", expr: "13.56 MHz", href: "/subjects/thin-films", subject: "Thin Films" },
  { title: "Vacuum Pump-Down", expr: "t = 2.3 (V/S) log(P₁/P₂)", href: "/subjects/vacuum-system#pump-down", subject: "Vacuum Systems" },
  { title: "Polyelectrolytes", expr: "layer by layer", href: "/subjects/colloids-and-interfaces#polyelectrolytes", subject: "Colloids & Interfaces" },
  { title: "Biosensors", expr: "binding → signal", href: "/subjects/electrophysiology", subject: "Electrophysiology" },
];
