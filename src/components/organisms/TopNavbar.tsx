"use client";

import React, { useState } from "react";
import IconoMenuDesplegable from "../atoms/IconoMenuDesplegable";
import LogoSALLE from "../atoms/LogoSALLE";
import UserMenu from "../molecules/UserMenu";
import { useSession } from "next-auth/react";

interface TopNavbarProps {
  onMenuToggle: () => void;
}

const TopNavbar: React.FC<TopNavbarProps> = ({ onMenuToggle }) => {
  const { data: session } = useSession();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const handleMenuToggle = () => {
    setIsMenuOpen(!isMenuOpen);
    onMenuToggle(); // Esto controla el sidebar
  };

  return (
    <nav className="sticky top-0 z-40 bg-white border-b border-gray-200 h-16 px-4 md:px-6 lg:px-8">
      <div className="flex items-center justify-between h-full">
        {/* Logo + menú */}
        <div className="flex items-center space-x-3">
          <button
            className="p-2 rounded hover:bg-gray-100 transition md:flex"
            onClick={handleMenuToggle}
            aria-label="Toggle menu"
          >
            <IconoMenuDesplegable />
          </button>

          {/* Logo */}
          <div className="hidden md:block">
            <LogoSALLE />
          </div>
        </div>

        {/* Usuario */}
        <div className="ml-auto flex items-center space-x-4">
          {session?.user ? (
            <UserMenu
              user={{
                nombre: session.user.name || "",
                correo: session.user.email || "",
                fotoPerfil: session.user.image || "",
              }}
            />
          ) : null}
        </div>
      </div>

      {/* Menú desplegable para PC */}
      {isMenuOpen && (
        <div className="absolute top-full left-0 w-full bg-white border-b border-gray-200 shadow-md md:hidden lg:block">
          {/* Aquí puedes meter links o items del sidebar si quieres que sea desplegable */}
          <ul className="flex flex-col md:flex-row md:space-x-6 p-4 md:p-2">
            <li className="hover:bg-gray-100 rounded p-2 cursor-pointer">Dashboard</li>
            <li className="hover:bg-gray-100 rounded p-2 cursor-pointer">Estudiantes</li>
            <li className="hover:bg-gray-100 rounded p-2 cursor-pointer">Prestamos</li>
            <li className="hover:bg-gray-100 rounded p-2 cursor-pointer">Configuración</li>
          </ul>
        </div>
      )}
    </nav>
  );
};

export default TopNavbar;
