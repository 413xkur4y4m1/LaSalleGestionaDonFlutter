// Shadcn Avatar wrapper
// Size: 40px (xs) → 48px (xl)
// Fallback: Initials from name
// Props: src (fotoPerfil), alt, size
import React from 'react';
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar"

interface AvatarProps {
  src?: string;
  alt: string;
  size?: string; // xs, sm, md, lg, xl
}

const CustomAvatar: React.FC<AvatarProps> = ({ src, alt }) => {
  return (
    <Avatar className="w-10 h-10">
      {src ? (
        <AvatarImage src={src} alt={alt} />
      ) : (
        <AvatarFallback>{alt.substring(0, 2).toUpperCase()}</AvatarFallback>
      )}
    </Avatar>
  );
};

export default CustomAvatar;