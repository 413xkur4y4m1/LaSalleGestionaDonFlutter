'use client';

import { useState, useEffect } from 'react';
import Image from "next/image";
import HeroTitle from "@/components/molecules/HeroTitle";
import { PlaceHolderImages } from '@/lib/placeholder-images';

const HeroSection = () => {
  const [currentIndex, setCurrentIndex] = useState(0);
  
  // Obtener las imágenes nezzi1, nezzi2, nezzi3
  const heroImages = PlaceHolderImages.filter(p => 
    p.id === 'nezzi1' || p.id === 'nezzi2' || p.id === 'nezzi3'
  );

  useEffect(() => {
    // Cambiar imagen cada 3 segundos (ajusta este valor para hacerlo más rápido o lento)
    const interval = setInterval(() => {
      setCurrentIndex((prevIndex) => 
        prevIndex === heroImages.length - 1 ? 0 : prevIndex + 1
      );
    }, 3000); // 3 segundos

    return () => clearInterval(interval);
  }, [heroImages.length]);

  if (!heroImages.length) {
    return (
      <section className="relative h-[50vh] sm:h-[55vh] md:h-[60vh] lg:h-[65vh] xl:h-[70vh] w-full bg-gray-200">
        <div className="absolute inset-0 bg-[#0a1c65]/60" />
        <div className="relative z-10 flex flex-col items-center justify-center h-full text-center px-4">
          <HeroTitle />
        </div>
      </section>
    );
  }

  return (
    <section className="relative h-[50vh] sm:h-[55vh] md:h-[60vh] lg:h-[65vh] xl:h-[70vh] w-full overflow-hidden">
      {/* Carousel de imágenes */}
      {heroImages.map((image, index) => (
        <div
          key={image.id}
          className={`absolute inset-0 transition-opacity duration-1000 ${
            index === currentIndex ? 'opacity-100' : 'opacity-0'
          }`}
        >
          <Image
            src={image.imageUrl}
            fill
            className="object-cover"
            alt={`Laboratorio de Gastronomía ${index + 1}`}
            priority={index === 0}
            data-ai-hint={image.imageHint}
          />
        </div>
      ))}
      
      {/* Overlay oscuro */}
      <div className="absolute inset-0 bg-[#0a1c65]/60 z-[5]" />
      
      {/* Contenido del hero */}
      <div className="relative z-10 flex flex-col items-center justify-center h-full text-center px-4">
        <HeroTitle />
      </div>

      {/* Indicadores de carousel (opcional - puntos abajo) */}
      <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 z-10 flex gap-2">
        {heroImages.map((_, index) => (
          <button
            key={index}
            onClick={() => setCurrentIndex(index)}
            className={`w-2 h-2 rounded-full transition-all ${
              index === currentIndex 
                ? 'bg-white w-8' 
                : 'bg-white/50 hover:bg-white/75'
            }`}
            aria-label={`Ir a imagen ${index + 1}`}
          />
        ))}
      </div>
    </section>
  );
};

export default HeroSection;