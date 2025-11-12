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

const MenuItem: React.FC<MenuItemProps> = ({
  icon,
  label,
  active = false,
  href,
  onClick,
}) => {
  const baseClasses = `
    flex items-center gap-3 px-4 py-2 rounded-md
    transition-colors duration-200
    cursor-pointer
  `;
  const activeClasses = active
    ? 'bg-[#e10022]/10 border-l-4 border-[#e10022]'
    : '';
  const hoverClasses = 'hover:bg-gray-100/10';

  const content = (
    <div className={`${baseClasses} ${activeClasses} ${hoverClasses}`}>
      {icon}
      <span className="hidden md:block">{label}</span>
    </div>
  );

  const effectiveOnClick = onClick ?? (() => toast.info('Esta sección estará disponible próximamente'));

  if (href) {
    return (
      <li>
        <Link href={href} aria-current={active ? 'page' : undefined}>
          {content}
        </Link>
      </li>
    );
  }

  return (
    <li onClick={effectiveOnClick} role="button">
      {content}
    </li>
  );
};

export default MenuItem;
