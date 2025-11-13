// Combines: IconoMenuDesplegable + LogoSALLE + NotificationBell + UserMenu

import React from 'react';
import IconoMenuDesplegable from '../atoms/IconoMenuDesplegable';
import LogoSALLE from '../atoms/LogoSALLE';
import UserMenu from '../molecules/UserMenu';
import { NotificationBell } from '../notifications/NotificationBell'; // Importamos la campana
import { useSession } from 'next-auth/react';

interface TopNavbarProps {
  onMenuToggle: () => void;
}

const TopNavbar: React.FC<TopNavbarProps> = ({ onMenuToggle }) => {
  const { data: session } = useSession();

  return (
    <nav className="sticky top-0 z-40 bg-white border-b border-gray-200 h-16 px-4 md:px-6">
      <div className="flex items-center justify-between h-full">
        {/* Mobile menu trigger */}
        <button className="md:hidden" onClick={onMenuToggle}>
          <IconoMenuDesplegable />
        </button>

        {/* Logo - hidden on mobile */}
        <div className="hidden md:block">
          <LogoSALLE />
        </div>

        {/* Right section */}
        <div className="ml-auto flex items-center space-x-4">
          {/* Si hay sesión, mostramos la campana y el menú de usuario */}
          {session?.user ? (
            <>
              <NotificationBell />
              <UserMenu user={{ nombre: session.user.name || '', correo: session.user.email || '', fotoPerfil: session.user.image || '' }} />
            </> 
          ) : null}
        </div>
      </div>
    </nav>
  );
};

export default TopNavbar;
