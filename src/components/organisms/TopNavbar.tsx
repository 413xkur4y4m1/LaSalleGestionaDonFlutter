// Combines: IconoMenuDesplegable + LogoSALLE + UserMenu
//
// Structure:
// <nav className="sticky top-0 z-40 bg-white border-b border-gray-200
//   h-12 sm:h-14 md:h-16 lg:h-18 xl:h-20
//   px-2 sm:px-3 md:px-4 lg:px-6 xl:px-8">
//
//   <div className="flex items-center justify-between h-full">
//     {/* Mobile menu trigger */}
//     <button className="md:hidden" onClick={toggleSidebar}>
//       <IconoMenuDesplegable />
//     </button>
//
//     {/* Logo - hidden on xs if menu open */}
//     <div className="hidden md:block">
//       <LogoSALLE />
//     </div>
//
//     {/* Right section */}
//     <div className="ml-auto">
//       <UserMenu user={session.user} />
//     </div>
//   </div>
// </nav>
//
// Props: onMenuToggle: () => void

import React from 'react';
import IconoMenuDesplegable from '../atoms/IconoMenuDesplegable';
import LogoSALLE from '../atoms/LogoSALLE';
import UserMenu from '../molecules/UserMenu';
import { useSession } from 'next-auth/react';

interface TopNavbarProps {
  onMenuToggle: () => void;
}

const TopNavbar: React.FC<TopNavbarProps> = ({ onMenuToggle }) => {
  const { data: session } = useSession();

  return (
    <nav className="sticky top-0 z-40 bg-white border-b border-gray-200 h-12 sm:h-14 md:h-16 lg:h-18 xl:h-20 px-2 sm:px-3 md:px-4 lg:px-6 xl:px-8">
      <div className="flex items-center justify-between h-full">
        {/* Mobile menu trigger */}
        <button className="md:hidden" onClick={onMenuToggle}>
          <IconoMenuDesplegable />
        </button>

        {/* Logo - hidden on xs if menu open */}
        <div className="hidden md:block">
          <LogoSALLE />
        </div>

        {/* Right section */}
        <div className="ml-auto">
          {session?.user ? <UserMenu user={{ nombre: session.user.name || '', correo: session.user.email || '', fotoPerfil: session.user.image || '' }} /> : null}
        </div>
      </div>
    </nav>
  );
};

export default TopNavbar;