import data from "./placeholder-images.json";

export type ImagePlaceholder = {
  id: string;
  description: string;
  imageUrl: string;
  imageHint: string;
};

// Filtra y corrige posibles objetos incompletos
export const PlaceHolderImages: ImagePlaceholder[] =
  data.placeholderImages.filter((p: any) =>
    p.imageUrl && p.imageHint
  ) as ImagePlaceholder[];
