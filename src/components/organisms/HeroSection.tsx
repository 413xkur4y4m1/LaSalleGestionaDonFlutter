import Image from "next/image";
import HeroTitle from "@/components/molecules/HeroTitle";
import { PlaceHolderImages } from '@/lib/placeholder-images';

const HeroSection = () => {
  const heroImage = PlaceHolderImages.find(p => p.id === 'cocina1');

  return (
    <section className="relative h-[50vh] sm:h-[55vh] md:h-[60vh] lg:h-[65vh] xl:h-[70vh] w-full">
      {heroImage && (
        <Image
          src={heroImage.imageUrl}
          fill
          className="object-cover"
          alt="Laboratorio de Gastronomía"
          priority
          data-ai-hint={heroImage.imageHint}
        />
      )}
      <div className="absolute inset-0 bg-[#0a1c65]/60" />
      <div className="relative z-10 flex flex-col items-center justify-center h-full text-center px-4">
        <HeroTitle />
      </div>
    </section>
  );
};

export default HeroSection;
