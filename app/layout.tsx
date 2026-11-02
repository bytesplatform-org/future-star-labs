import type { Metadata, Viewport } from "next";
import { Aldrich, IBM_Plex_Mono } from "next/font/google";
import "lenis/dist/lenis.css";
import "./globals.css";
import SmoothScroll from "@/components/SmoothScroll";
import SiteNav from "@/components/site/SiteNav";
import RevealObserver from "@/components/site/RevealObserver";
import { site } from "@/lib/content/site";

// Aldrich carries the whole site; Plex Mono is the instrument voice.
const aldrich = Aldrich({
  variable: "--font-aldrich",
  subsets: ["latin"],
  weight: "400",
  display: "swap",
});

const plexMono = IBM_Plex_Mono({
  variable: "--font-plex-mono",
  subsets: ["latin"],
  weight: ["400", "500"],
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(site.url),
  title: {
    default: "Future Star Labs — Physics, materials and energy from first principles",
    template: "%s — Future Star Labs",
  },
  description: site.description,
  keywords: [
    "Future Star Labs",
    "thermoelectrics",
    "Peltier effect",
    "thermocouples",
    "electromagnetic induction",
    "capacitance",
    "electric potential",
    "thermodynamics",
    "material structures",
    "thin films",
    "vacuum systems",
  ],
  openGraph: {
    type: "website",
    siteName: site.name,
    title: "Future Star Labs",
    description: site.description,
    url: site.url,
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
    title: "Future Star Labs",
    description: site.description,
  },
};

export const viewport: Viewport = {
  themeColor: "#0c0d10",
  colorScheme: "dark",
};

/**
 * Runs before first paint: html.motion arms the reveals and scroll scenes
 * unless the reader prefers reduced motion. If the app never comes alive
 * to run them, let go after 4s so nothing stays hidden.
 */
const MOTION_SCRIPT = `try{if(!matchMedia('(prefers-reduced-motion: reduce)').matches){var d=document.documentElement;d.classList.add('motion');setTimeout(function(){if(!d.classList.contains('motion-ready'))d.classList.remove('motion')},4000)}}catch(e){}`;

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${aldrich.variable} ${plexMono.variable}`} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: MOTION_SCRIPT }} />
      </head>
      <body>
        <a
          href="#main"
          className="label sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[100] focus:bg-paper focus:px-4 focus:py-2 focus:text-void"
        >
          Skip to content
        </a>
        <SmoothScroll />
        <SiteNav />
        <main id="main">{children}</main>
        <RevealObserver />
      </body>
    </html>
  );
}
