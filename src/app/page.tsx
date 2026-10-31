import { AlbumViewer } from "@/components/AlbumViewer";
import { ClosingSection } from "@/components/ClosingSection";
import { CoupleIntro } from "@/components/CoupleIntro";
import { EditorialHero } from "@/components/EditorialHero";
import { FamilyGallery } from "@/components/FamilyGallery";
import { MemoryGallery } from "@/components/MemoryGallery";
import { OpeningExperience } from "@/components/OpeningExperience";
import { SiteFooter } from "@/components/SiteFooter";
import { SiteHeader } from "@/components/SiteHeader";
import { StoryTimeline } from "@/components/StoryTimeline";

export default function Home() {
  return (
    <>
      <OpeningExperience />
      <SiteHeader />
      <main>
        <EditorialHero />
        <CoupleIntro />
        <AlbumViewer />
        <MemoryGallery />
        <StoryTimeline />
        <FamilyGallery />
        <ClosingSection />
      </main>
      <SiteFooter />
    </>
  );
}
