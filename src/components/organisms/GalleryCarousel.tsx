"use client"
import * as React from "react"
import Image from "next/image"
import Autoplay from "embla-carousel-autoplay"

import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel"

type ImageProp = {
  src: string;
  alt: string;
  hint: string;
}

type GalleryCarouselProps = {
  images: ImageProp[];
};

export function GalleryCarousel({ images }: GalleryCarouselProps) {
  const plugin = React.useRef(
    Autoplay({ delay: 3000, stopOnInteraction: false, stopOnMouseEnter: true })
  )

  return (
    <div className="px-4 md:px-12">
        <Carousel
        plugins={[plugin.current]}
        opts={{
            loop: true,
        }}
        className="w-full"
        >
        <CarouselContent>
            {images.map((image, index) => (
            <CarouselItem key={index} className="sm:basis-1 md:basis-1/2 lg:basis-1/3">
                <div className="p-1">
                    <div className="relative h-64">
                        <Image
                        src={image.src}
                        alt={image.alt}
                        fill
                        data-ai-hint={image.hint}
                        className="rounded-lg object-cover shadow-lg"
                        sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
                        />
                    </div>
                </div>
            </CarouselItem>
            ))}
        </CarouselContent>
        <CarouselPrevious className="bg-[#e10022]/80 text-white border-none hover:bg-[#e10022] rounded-full w-10 h-10 -left-2 sm:left-0" />
        <CarouselNext className="bg-[#e10022]/80 text-white border-none hover:bg-[#e10022] rounded-full w-10 h-10 -right-2 sm:right-0" />
        </Carousel>
    </div>
  )
}
