/**
 * Facts about Future Star Labs, as established by futurestarlabs.com.
 * Nothing here should go beyond what that site says.
 */

export const site = {
  name: "Future Star Labs",
  url: "https://futurestarlabs.com",
  legacyUrl: "https://futurestarlabs.com",
  description:
    "Future Star Labs works from first principles across physics, materials and energy — thermoelectrics, electromagnetism, thin films, vacuum systems and more — with open study notes across fourteen subjects.",
  /** About page: what the practice is and how it works */
  about: {
    practice:
      "Future Star Labs is a consulting practice built on first-principles analysis, working where nanotechnology, nanoelectronics, biomedical engineering, aerospace and blockchain meet.",
    method:
      "Market research and project scoping turn that analysis into roadmaps for adopting new technology.",
    notebook:
      "Alongside the work sits an open notebook: study notes and worked problems across fourteen subjects, from thermoelectrics to vacuum systems.",
  },
  social: [
    { label: "Instagram", href: "https://www.instagram.com/futurestar33/" },
    { label: "X", href: "https://www.x.com/FutureStar33" },
    { label: "LinkedIn", href: "https://www.linkedin.com/in/andre-childs-69659478/" },
  ],
  projects: [
    {
      title: "BacteSign",
      summary: "A tool for doctors and scientists analysing infectious disease — search an antibiotic and its mass to test bacterial susceptibility.",
      href: "https://futurestarlabs.com/projects",
    },
    {
      title: "Urban Farming",
      summary: "Sensors that collect soil and environmental data as cities fold farming into limited space.",
      href: "https://futurestarlabs.com/projects",
    },
  ],
  livestreams: "https://futurestarlabs.com/events",
} as const;

/**
 * The primary navigation, as futurestarlabs.com has it. Pages this rebuild
 * doesn't have yet still point at the original site.
 */
export const nav = [
  { label: "Home", href: "/" },
  { label: "About", href: "/#about" },
  { label: "Projects", href: "https://futurestarlabs.com/projects" },
  { label: "Events", href: "https://futurestarlabs.com/events" },
  { label: "Subjects", href: null },
  { label: "Investments", href: "https://futurestarlabs.com/investments" },
  { label: "Products", href: "https://futurestarlabs.com/products" },
  { label: "Percent Difference", href: "https://futurestarlabs.com/percent-difference" },
] as const;
