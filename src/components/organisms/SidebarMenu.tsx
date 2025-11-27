// /home/user/studio/src/components/organisms/SidebarMenu.tsx
"use client";

import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import IconoIA from "@/components/atoms/IconoIA";
import IconoPrestamo from "@/components/atoms/IconoPrestamo";
import IconoAdeudo from "@/components/atoms/IconoAdeudo";
import IconoPagados from "@/components/atoms/IconoPagados";
import IconoCompletado from "@/components/atoms/IconoCompletado";
import QRicono from "@/components/atoms/QRicono";
import { LogOut } from 'lucide-react';
import { signOut } from 'next-auth/react';

interface SidebarMenuProps {
  isOpen: boolean;
  onClose: () => void;
}

const MenuItem: React.FC<{ 
  icon: React.ReactNode; 
  label: string; 
  onClick: () => void;
  badge?: number; // Para mostrar contador de QR pendientes
}> = ({ icon, label, onClick, badge }) => (
  <button 
    onClick={onClick} 
    className="flex items-center justify-between w-full text-left p-3 rounded-lg hover:bg-gray-100 transition-colors duration-200"
  >
    <div className="flex items-center">
      <span className="text-red-600">{icon}</span>
      <span className="ml-4 text-sm font-medium text-gray-700">{label}</span>
    </div>
    {badge && badge > 0 && (
      <span className="bg-red-500 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center">
        {badge > 9 ? '9+' : badge}
      </span>
    )}
  </button>
);

const SidebarMenu: React.FC<SidebarMenuProps> = ({ isOpen, onClose }) => {
  const router = useRouter();

  const menuItems = [
    {
      icon: <IconoIA className="h-5 w-5" />,
      label: 'Chatbot IA',
      onClick: () => {
        router.push('/chatbot');
        if (window.innerWidth < 768) onClose();
      },
    },
    {
      icon: <QRicono className="h-5 w-5" />,
      label: 'Mis Códigos QR',
      onClick: () => {
        router.push('/dashboard/qr-center');
        if (window.innerWidth < 768) onClose();
      },
      // badge: qrCount // Agregar contador después
    },
    {
      icon: <IconoPrestamo />,
      label: 'Préstamos',
      onClick: () => {
        router.push('/dashboard/prestamos');
        if (window.innerWidth < 768) onClose();
      },
    },
    {
      icon: <IconoAdeudo />,
      label: 'Adeudos',
      onClick: () => {
        router.push('/dashboard/adeudos');
        if (window.innerWidth < 768) onClose();
      },
    },
    {
      icon: <IconoCompletado />,
      label: 'Completados',
      onClick: () => {
        router.push('/dashboard/completados');
        if (window.innerWidth < 768) onClose();
      },
    },
    {
      icon: <IconoPagados />,
      label: 'Pagados',
      onClick: () => {
        router.push('/dashboard/pagados');
        if (window.innerWidth < 768) onClose();
      },
    },
  ];

  return (
    <div 
      className={`
        fixed inset-y-0 left-0 z-50 
        w-64 bg-white shadow-lg 
        flex flex-col p-4 
        transform transition-transform duration-300 ease-in-out 
        ${isOpen ? 'translate-x-0' : '-translate-x-full'} 
        md:relative md:translate-x-0 md:h-auto
      `}
    >
      <h2 className="text-lg font-bold text-gray-800 mb-6 px-2">Menú Principal</h2>
      <nav className="flex-1 space-y-2 overflow-y-auto">
        {menuItems.map((item, index) => (
          <MenuItem key={index} {...item} />
        ))}
      </nav>
      <div className="mt-auto pt-4 border-t border-gray-200">
        <MenuItem 
          icon={<LogOut size={20}/>}
          label="Cerrar Sesión"
          onClick={() => signOut({ callbackUrl: '/' })}
        />
      </div>
    </div>
  );
};

export default SidebarMenu;