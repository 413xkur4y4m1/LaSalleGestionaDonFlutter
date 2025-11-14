
"use client";

import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import IconoIA from "@/components/atoms/IconoIA";
import IconoPrestamo from "@/components/atoms/IconoPrestamo";
import IconoAdeudo from "@/components/atoms/IconoAdeudo";
import IconoPagados from "@/components/atoms/IconoPagados";
import IconoCompletado from "@/components/atoms/IconoCompletado";
import { LogOut } from 'lucide-react';
import { signOut } from 'next-auth/react';

// ✅ CORRECCIÓN: Se añade la propiedad `isOpen` para controlar la visibilidad.
interface SidebarMenuProps {
  isOpen: boolean;
  onClose: () => void;
}

// --- Componente de un solo elemento del menú ---
const MenuItem: React.FC<{ icon: React.ReactNode; label: string; onClick: () => void; }> = ({ icon, label, onClick }) => (
  <button onClick={onClick} className="flex items-center w-full text-left p-3 rounded-lg hover:bg-gray-100 transition-colors duration-200">
    <span className="text-red-600">{icon}</span>
    <span className="ml-4 text-sm font-medium text-gray-700">{label}</span>
  </button>
);

// --- Componente Principal del Menú Lateral (Organism) ---
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

  // ✅ CORRECCIÓN: Se envuelve el menú en un div que usa `isOpen` para transformarse
  // y mostrarse/ocultarse desde fuera de la pantalla.
  return (
    <div className={`fixed inset-y-0 left-0 z-50 h-full w-64 bg-white shadow-lg flex flex-col p-4 transform transition-transform duration-300 ease-in-out ${isOpen ? 'translate-x-0' : '-translate-x-full'} md:relative md:translate-x-0`}>
        <h2 className="text-lg font-bold text-gray-800 mb-6 px-2">Menú Principal</h2>
        <nav className="flex-1 space-y-2">
            {menuItems.map((item, index) => (
                <MenuItem key={index} {...item} />
            ))}
        </nav>
        <div className="mt-auto">
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
