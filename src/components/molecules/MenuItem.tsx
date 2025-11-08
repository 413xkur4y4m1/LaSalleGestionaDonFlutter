// Combines: Icon + Text (conditional)
// Props:
//   - icon: ReactNode
//   - label: string
//   - active: boolean
//   - href: string
//   - onClick?: function (para placeholder sin navegación)
//
// Styles:
//   - Active: bg-[#e10022]/10 border-l-4 border-[#e10022]
//   - Hover: bg-gray-100/10
//   - xs/sm: Icon only, centered, no text
//   - md+: Icon + text horizontal
//
// NOTE: Para secciones sin funcionalidad, onClick muestra toast
//       "Esta sección estará disponible próximamente"

import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';

interface MenuItemProps {
  icon: React.ReactNode;
  label: string;
  active?: boolean;
  href?: string;
  onClick?: () => void;
}

const MenuItem: React.FC<MenuItemProps> = ({ icon, label, active, href, onClick }) => {
    const router = useRouter()

  const handleClick = () => {
    if (onClick) {
      onClick();
    } else if (href) {
      router.push(href)
    } else {
      toast.info('Esta sección estará disponible próximamente');
    }
  };

  return (
    <li
      className={`
        flex items-center
        md:flex-row md:justify-start
        gap-3 px-4 py-2 rounded-md
        hover:bg-gray-100/10
        ${active ? 'bg-[#e10022]/10 border-l-4 border-[#e10022]' : ''}
        cursor-pointer
      `}
      onClick={handleClick}
    >
      {icon}
      <span className="hidden md:block">{label}</span>
    </li>
  );
};

export default MenuItem;