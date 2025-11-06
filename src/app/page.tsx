import AccessButtonGroup from "@/components/molecules/AccessButtonGroup";
import SecurityBadge from "@/components/molecules/SecurityBadge";
import { GalleryCarousel } from "@/components/organisms/GalleryCarousel";
import HeroSection from "@/components/organisms/HeroSection";
import PortalLayout from "@/components/templates/PortalLayout";
import { PlaceHolderImages } from "@/lib/placeholder-images";

export default function Home() {
  const campusImages = PlaceHolderImages.filter(p => p.id.startsWith('salleM')).map(p => ({
    src: p.imageUrl,
    alt: p.description,
    hint: p.imageHint
  }));

  const labImages = PlaceHolderImages.filter(p => p.id.startsWith('cocina') && p.id !== 'cocina1').map(p => ({
    src: p.imageUrl,
    alt: p.description,
    hint: p.imageHint
  }));

  return (
    <PortalLayout>
      <HeroSection />

      <section className="py-12 px-4 sm:px-6 md:px-8">
        <AccessButtonGroup />
      </section>

      <section className="py-12 px-4 sm:px-6 md:px-8 bg-card">
        <h2 className="text-2xl md:text-3xl font-bold text-[#0a1c65] text-center mb-8 font-headline">
          Instalaciones La Salle
        </h2>
        <GalleryCarousel
          images={campusImages}
        />
      </section>

      <section className="py-12 px-4 sm:px-6 md:px-8">
        <h2 className="text-2xl md:text-3xl font-bold text-[#0a1c65] text-center mb-8 font-headline">
          Laboratorio de Gastronomía
        </h2>
        <GalleryCarousel
          images={labImages}
        />
      </section>

      <section className="py-8 px-4 sm:px-6 bg-card">
        <SecurityBadge />
      </section>
    </PortalLayout>
  );
}
