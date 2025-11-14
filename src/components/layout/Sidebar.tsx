
"use client";

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, LogOut, FileText, ShieldAlert, CheckCircle, History, User } from 'lucide-react';
import { signOut } from 'next-auth/react';
import IconoGastrobot from '../atoms/IconoGastrobot';

// --- Tipo para los elementos del menú ---
interface NavItemProps {
  href: string;
  icon: React.ReactNode;
  label: string;
}

// --- Componente para un elemento individual del menú ---
const NavItem: React.FC<NavItemProps> = ({ href, icon, label }) => {
  const pathname = usePathname();
  const isActive = pathname === href;

  return (
    <Link href={href} className={`flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-colors duration-200 ${isActive ? 'bg-red-700 text-white' : 'text-gray-200 hover:bg-red-800 hover:text-white'}`}>
      {icon}
      <span className="ml-3">{label}</span>
    </Link>
  );
};

// --- Componente Principal de la Barra Lateral ---
const Sidebar = () => {
    // ✅ CORRECCIÓN: Se añadieron las rutas correctas del dashboard a los elementos del menú.
    const navItems: NavItemProps[] = [
        { href: '/dashboard', icon: <Home size={20}/>, label: 'Inicio' },
        { href: '/dashboard/profile', icon: <User size={20}/>, label: 'Mi Perfil' },
        { href: '/dashboard/prestamos', icon: <FileText size={20}/>, label: 'Préstamos' },
        { href: '/dashboard/adeudos', icon: <ShieldAlert size={20}/>, label: 'Adeudos' },
        { href: '/dashboard/completados', icon: <CheckCircle size={20}/>, label: 'Completados' },
        { href: '/dashboard/pagados', icon: <History size={20}/>, label: 'Pagados' },
    ];

    return (
        <div className="h-full w-64 bg-red-900 text-white flex flex-col fixed">
            <div className="flex items-center justify-center py-6 px-4 border-b border-red-800">
                <IconoGastrobot className="h-8 w-8" />
                <span className="ml-3 font-bold text-xl">GastroLab</span>
            </div>

            <nav className="flex-1 px-4 py-6 space-y-2">
                {navItems.map((item) => <NavItem key={item.label} {...item} />)}
            </nav>

            <div className="px-4 py-4 border-t border-red-800">
                <button 
                    onClick={() => signOut({ callbackUrl: '/' })} 
                    className="flex items-center w-full px-4 py-3 text-sm font-medium text-gray-200 rounded-lg hover:bg-red-800 hover:text-white transition-colors duration-200">
                    <LogOut size={20} />
                    <span className="ml-3">Cerrar Sesión</span>
                </button>
            </div>
        </div>
    );
};

export default Sidebar;
