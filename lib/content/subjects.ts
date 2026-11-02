/**
 * The notebook: subjects from futurestarlabs.com that carry real study
 * material. Wording is ours; the science is the original pages', with
 * standard physics where those pages slipped.
 */

export type Equation = { expr: string; label: string };

export type Chapter = {
  id: string;
  title: string;
  body: string[];
  equations?: Equation[];
  points?: string[];
};

export type Subject = {
  slug: string;
  title: string;
  /** the field of exploration it belongs to */
  field: FieldKey;
  lede: string;
  chapters: Chapter[];
  /** the page on the original site */
  source: string;
};

export type FieldKey = "thermal" | "em" | "electric" | "materials" | "signal";

const legacy = (path: string) => `https://futurestarlabs.com/${path}`;

export const subjects: Subject[] = [
  {
    slug: "thermoelectrics",
    title: "Thermoelectrics",
    field: "thermal",
    lede: "Thermal engineering is the study of how heat moves, and how it transfers into other forms of energy. Thermoelectrics does it with no moving parts.",
    source: legacy("thermoelectrics"),
    chapters: [
      {
        id: "two-methods",
        title: "Two methods",
        body: [
          "A thermoelectric device works in one of two directions. Hold its faces at different temperatures and it generates power. Drive a current through it and it pumps heat — it cools.",
        ],
        points: ["Thermoelectric power generation", "Thermoelectric cooling"],
      },
      {
        id: "peltier",
        title: "The Peltier effect",
        body: [
          "Current flowing through a circuit of semiconductor–metal contacts carries heat with it, pumping heat from one electrode to the other.",
          "Semiconductors have a thermoelectric power large enough for practical electronic cooling — most useful where small size and the absence of moving parts matter. A cooling unit pairs a p-type and an n-type element, joined by ohmic contacts.",
        ],
      },
      {
        id: "thermocouples",
        title: "Thermocouples",
        body: [
          "Join two dissimilar conductors and hold the junctions at different temperatures, and a voltage appears in proportion to the difference — the Seebeck effect, and the working principle of every thermocouple.",
        ],
        equations: [{ expr: "V = α (T_h − T_c)", label: "α is the Seebeck coefficient of the junction pair" }],
      },
      {
        id: "piezoelectric",
        title: "The piezoelectric effect",
        body: ["Some materials generate an electric charge when mechanically stressed — a neighbouring route from one form of energy to electricity."],
      },
    ],
  },
  {
    slug: "physics",
    title: "Physics",
    field: "em",
    lede: "Recitation notes from University Physics with Calculus: magnetic fields and induction, capacitance, and electric potential — worked through as conceptual questions.",
    source: legacy("physics"),
    chapters: [
      {
        id: "induction",
        title: "Electromagnetic induction",
        body: [
          "A changing magnetic flux through a circuit induces an emf. Lenz’s law fixes its direction: the induced current opposes the change that produced it.",
          "The emf depends on how fast the flux changes — not on the absolute strength of the field.",
        ],
        equations: [
          { expr: "ε = −N dΦ/dt", label: "Faraday’s law for N turns" },
          { expr: "Φ = B A cos θ", label: "flux through a flat loop" },
        ],
      },
      {
        id: "capacitance",
        title: "Capacitors and capacitance",
        body: [
          "Capacitance is set by geometry and dielectric: plate area, separation, and the material between. It does not depend on how much charge is stored — an uncharged capacitor has the same capacitance as a charged one.",
          "The notes work through dielectrics, spherical capacitors, combinations of three 1.0 μF capacitors, and conducting slabs.",
        ],
        equations: [
          { expr: "C = Q / V", label: "definition" },
          { expr: "C = κ ε₀ A / d", label: "parallel plates with a dielectric" },
        ],
      },
      {
        id: "potential",
        title: "Electric potential",
        body: [
          "Potential difference and potential energy, uniformly charged spheres, equipotential points, and why a conductor’s surface is always an equipotential — through to grounding, photocopiers and electrostatic precipitators.",
        ],
        equations: [{ expr: "U = q V", label: "potential energy of a charge q" }],
      },
    ],
  },
  {
    slug: "thermodynamics",
    title: "Thermodynamics",
    field: "thermal",
    lede: "Phase diagrams and the conditions for equilibrium, following Gaskell’s Introduction to the Thermodynamics of Materials.",
    source: legacy("thermodynamics"),
    chapters: [
      {
        id: "phase-equilibrium",
        title: "Phase equilibrium",
        body: [
          "A phase is in equilibrium when its free energy is at a minimum for the given composition, pressure and temperature. That minimum is what makes a structure stable; changing any of the three raises the free energy above it.",
        ],
        equations: [{ expr: "dG = 0", label: "at the minimum, for fixed P, T and composition" }],
      },
      {
        id: "ideal-gas",
        title: "The state of an ideal gas",
        body: ["At constant temperature, pressure varies inversely with volume; at constant pressure, volume grows with temperature. Together they make the ideal gas law."],
        equations: [{ expr: "PV = nRT", label: "equation of state" }],
      },
    ],
  },
  {
    slug: "material-structures",
    title: "Material Structures",
    field: "materials",
    lede: "From crystallography and defects to diffusion, phase transformations, fracture, conduction, magnetism and thermal behaviour — the structure that decides a material’s properties.",
    source: legacy("material-structures"),
    chapters: [
      {
        id: "dislocations",
        title: "Dislocations and strengthening",
        body: [
          "Resolved shear stress is the shear component of an applied tensile stress acting on a slip plane. Yielding begins when it reaches the critical resolved shear stress — a property of the material.",
        ],
      },
      {
        id: "miller-indices",
        title: "Miller indices",
        body: ["Crystal planes are named by integers (hkl): take the reciprocals of the plane’s axis intercepts and clear fractions. A zero index means the plane is parallel to that axis."],
      },
      {
        id: "xrd",
        title: "X-ray diffraction",
        body: [
          "Diffraction peaks reveal the crystal structure, interplanar spacing, lattice constant and atomic radius. A worked example indexes four peaks as a BCC lattice — (110), (200), (211), (220) — with a lattice constant near 0.289 nm.",
        ],
        equations: [
          { expr: "nλ = 2d sin θ", label: "Bragg’s law" },
          { expr: "1/d² = (h² + k² + l²) / a²", label: "cubic interplanar spacing" },
          { expr: "a = 4r / √3", label: "body-centred cubic" },
        ],
      },
    ],
  },
  {
    slug: "thin-films",
    title: "Thin Films",
    field: "materials",
    lede: "Depositing films a few atoms to a few microns thick — where substrate temperature, gas, pressure, geometry and power all shape the result.",
    source: legacy("thin-films"),
    chapters: [
      {
        id: "plasma",
        title: "Plasma sources",
        body: [
          "RF plasma deposition runs at the standard 13.56 MHz. Electron cyclotron resonance sources operate around 10⁻⁵–10⁻³ Torr with ionisation ratios of about 10⁻³–10⁻¹, against roughly 10⁻⁶–10⁻⁴ for RF plasma.",
        ],
      },
      {
        id: "cvd",
        title: "Chemical vapour deposition",
        body: [
          "Reactor temperature is read by thermocouples or optical pyrometers; gas flow by rotameters or, increasingly, electronic flow meters that allow automation. Pressure is held either by adjusting inflow at a fixed pumping rate or by throttling the pump.",
          "Hot-wall tubular reactors run fully developed laminar flow to deposit polysilicon, silicon dioxide and silicon nitride. Low-temperature reactors, at 350–450 °C, lay passivation layers such as silicon nitride over aluminium.",
        ],
        points: ["Reaction chamber", "Power source and matching network", "Gas flow regulation", "Pressure measurement"],
      },
    ],
  },
  {
    slug: "vacuum-system",
    title: "Vacuum Systems",
    field: "signal",
    lede: "How a chamber is pumped down: first the gas in the volume, then the gas held on its surfaces, then the pumping of those gases themselves.",
    source: legacy("vacuum-system"),
    chapters: [
      {
        id: "pump-down",
        title: "Pump-down time",
        body: [
          "The time to fall from P₁ to P₂ follows from the chamber volume and the average pumping speed — valid while the speed stays near its average and the final pressure sits at least a decade above base pressure.",
          "Pumping speeds are usually quoted for nitrogen; other gases need correcting for molecular weight.",
        ],
        equations: [{ expr: "t = 2.3 (V / S) log(P₁ / P₂)", label: "V in litres, S in litres per second" }],
      },
      {
        id: "pumps",
        title: "Pumps",
        body: [],
        points: [
          "Oil diffusion — heated oil vapour transfers momentum to gas molecules, driving them to the exhaust",
          "Molecular drag — a rotor sweeps molecules through grooves, compressing them from inlet to exhaust",
          "Gas ballast — handles condensable vapours such as water",
        ],
      },
    ],
  },
  {
    slug: "colloids-and-interfaces",
    title: "Colloids & Interfaces",
    field: "materials",
    lede: "Surface and interfacial tension, self-assembled monolayers, forces between colloidal particles, emulsions and self-assembled polymers.",
    source: legacy("colloids-%26-interfaces"),
    chapters: [
      {
        id: "polyelectrolytes",
        title: "Polyelectrolytes",
        body: [
          "Anionic and cationic polyelectrolytes can be built up layer by layer on a substrate. How strong and weak polyelectrolytes differ, how their coatings change colloid stability, and how pH and ionic strength swell multilayer capsules.",
        ],
      },
      {
        id: "self-assembly",
        title: "Self-assembled molecules",
        body: ["The forces behind molecular self-assembly, and what drives thiol and silane monolayers to form on a surface."],
      },
    ],
  },
  {
    slug: "electrophysiology",
    title: "Electrophysiology",
    field: "signal",
    lede: "Electrical signals in living systems — biosensors, membrane transport, bioenergetics and how cell populations behave.",
    source: legacy("electrophysiology"),
    chapters: [
      {
        id: "glossary",
        title: "Working glossary",
        body: [],
        points: [
          "Quorum sensing — bacteria detecting and responding to population density through gene regulation",
          "Biosensor — a biomolecule as the reactive surface, paired with a transducer that turns binding into a measurable signal",
          "Spatio-temporal cluster — spatially separated sites that fire together within a time interval",
        ],
      },
    ],
  },
];

/** subjects the original site lists without study material yet */
export const otherSubjects = [
  { title: "Meta Optics", href: legacy("meta-optics-1") },
  { title: "Chemistry", href: legacy("chemistry") },
  { title: "Robotics", href: legacy("robotics") },
  { title: "Data Analysis", href: legacy("data-analysis") },
  { title: "BlockChain", href: legacy("blockchain") },
  { title: "Keeping a Healthy Body", href: legacy("keeping-a-healthy-body") },
];

export function getSubject(slug: string) {
  return subjects.find(s => s.slug === slug);
}
