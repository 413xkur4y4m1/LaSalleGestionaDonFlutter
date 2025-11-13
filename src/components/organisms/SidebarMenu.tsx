
'use client';

import React from 'react';
import MenuItem from '../molecules/MenuItem';
import IconoPrestamo from '../atoms/IconoPrestamo';
import IconoAdeudo from '../atoms/IconoAdeudo';
import IconoPagados from '../atoms/IconoPagados';
import IconoCompletado from '../atoms/IconoCompletado';
import IconoSalir from '../atoms/IconoSalir';
import { toast } from 'sonner';
import { signOut } from "next-auth/react";
import IconoIA from '../atoms/IconoIA'; // Importamos el ícono de IA
import { useRouter } from 'next/navigation';

interface SidebarMenuProps {
  isOpen: boolean;
  onClose: () => void;
}

const SidebarMenu: React.FC<SidebarMenuProps> = ({ isOpen, onClose }) => {
  const router = useRouter(); 

  const handleSignOut = async () => {
    const promise = () => new Promise((resolve) => signOut({ callbackUrl: '/' }).then(resolve));
    
    toast.promise(promise, {
      loading: 'Cerrando sesión...',
      success: '¡Hasta pronto!',
      error: 'No se pudo cerrar la sesión',
    });
  };

  const menuItems = [
    {
      icon: <IconoIA className="h-5 w-5" />, // Usamos el nuevo ícono
      label: 'Chatbot IA',
      onClick: () => {
        router.push('/chatbot');
        if (window.innerWidth < 768) onClose();
      },
    },
    {
      icon: <IconoPrestamo />,
      label: 'Préstamos',
      onClick: () => {
        toast.info('Esta sección estará disponible próximamente');
        if (window.innerWidth < 768) onClose();
      },
    },
    {
      icon: <IconoAdeudo />,
      label: 'Adeudos',
      onClick: () => {
        toast.info('Esta sección estará disponible próximamente');
        if (window.innerWidth < 768) onClose();
      },
    },
    {
      icon: <IconoPagados />,
      label: 'Pagados',
      onClick: () => {
        toast.info('Esta sección estará disponible próximamente');
        if (window.innerWidth < 768) onClose();
      },
    },
    {
      icon: <IconoCompletado />,
      label: 'Completados',
      onClick: () => {
        toast.info('Esta sección estará disponible próximamente');
        if (window.innerWidth < 768) onClose();
      },
    },
    {
      icon: <IconoSalir />,
      label: 'Cerrar Sesión',
      onClick: handleSignOut
    },
  ];

  return (
    <aside
      className={`fixed md:sticky top-0 left-0 h-screen bg-[#0a1c65] text-white transition-transform duration-300 ease-in-out z-50 md:z-30 ${isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'} w-[60px] sm:w-[80px] md:w-[200px] lg:w-[220px] xl:w-[240px]`}
    >
      {/* Close button (mobile only) */}
      <div className="md:hidden p-4 flex justify-end">
        <button onClick={onClose}>✕</button>
      </div>

      <div className="flex flex-col py-4 space-y-2">
        {menuItems.map((item, index) => (
          <MenuItem key={index} {...item} />
        ))}
      </div>
    </aside>
  );
};

export default SidebarMenu;
