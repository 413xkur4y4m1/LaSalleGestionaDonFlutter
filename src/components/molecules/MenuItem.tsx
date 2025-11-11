'use client';

import React from 'react';
import Link from 'next/link';
import { toast } from 'sonner';

interface MenuItemProps {
  icon: React.ReactNode;
  label: string;
  active?: boolean;
  href?: string;
  onClick?: () => void;
}

const MenuItem: React.FC<MenuItemProps> = ({ icon, label, active, href, onClick }) => {

  const content = (
    <div
      className={`
        flex items-center
        md:flex-row md:justify-start
        gap-3 px-4 py-2 rounded-md
        hover:bg-gray-100/10
        ${active ? 'bg-[#e10022]/10 border-l-4 border-[#e10022]' : ''}
        cursor-pointer
      `}
    >
      {icon}
      <span className="hidden md:block">{label}</span>
    </div>
  );

  const effectiveOnClick = onClick ? onClick : () => toast.info('Esta sección estará disponible próximamente');

  if (href) {
    return (
      <li>
        <Link href={href} passHref>
          {content}
        </Link>
      </li>
    );
  }

  return (
    <li onClick={effectiveOnClick}>
      {content}
    </li>
  );
};

export default MenuItem;
