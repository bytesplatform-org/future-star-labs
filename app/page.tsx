import Hero from "@/components/home/Hero";
import Intro from "@/components/home/Intro";
import Fields from "@/components/home/Fields";
import Thermoelectrics from "@/components/home/Thermoelectrics";
import KnowledgeIndex from "@/components/home/KnowledgeIndex";
import Experiment from "@/components/home/Experiment";
import Philosophy from "@/components/home/Philosophy";
import Finale from "@/components/home/Finale";
import SiteFooter from "@/components/site/SiteFooter";

/**
 * Matter → Energy → Signal → Discovery, as eight scenes.
 */
export default function Home() {
  return (
    <>
      <Hero />
      <Intro />
      <Fields />
      <Thermoelectrics />
      <KnowledgeIndex />
      <Experiment />
      <Philosophy />
      <Finale />
      <SiteFooter home />
    </>
  );
}
