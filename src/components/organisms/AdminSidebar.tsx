
"use client";

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard, Users, CreditCard, Box, CheckCircle, BarChart, QrCode, ShieldAlert, UserPlus, Puzzle, LogOut, ScanLine
} from 'lucide-react';

// Se agrega el nuevo ítem de menú para escanear
const menuItems = [
  { href: '/admin/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { href: '/admin/scan', icon: ScanLine, label: 'Escanear Préstamo' }, // <-- ¡NUEVO!
  { href: '/admin/grupos', icon: Users, label: 'Grupos' },
  { href: '/admin/adeudos', icon: CreditCard, label: 'Adeudos' },
  { href: '/admin/prestamos', icon: Box, label: 'Préstamos' },
  { href: '/admin/completados', icon: CheckCircle, label: 'Completados' },
  { href: '/admin/analisis-ia', icon: BarChart, label: 'Análisis IA' },
  { href: '/admin/qrs', icon: QrCode, label: 'QRs' },
  { href: '/admin/notificaciones', icon: ShieldAlert, label: 'Notificaciones' },
  { href: '/admin/agregar-admin', icon: UserPlus, label: 'Agregar Admin' },
  { href: '/admin/subsistema', icon: Puzzle, label: 'Subsistema' },
];

const AdminSidebar = () => {
  const pathname = usePathname();

  return (
    <aside className="w-64 bg-white h-screen fixed top-0 left-0 shadow-lg flex flex-col">
        <div className="p-4 border-b">
            <h2 className="text-lg font-bold text-[#0a1c65]">Menú Principal</h2>
        </div>
        <nav className="flex-grow p-4 space-y-2">
            {menuItems.map((item) => {
                const isActive = pathname && (
                    // Condición especial para que /admin/scan se marque como activo solo en esa página
                    item.href === pathname
                );

                return (
                    <Link
                        key={item.label}
                        href={item.href}
                        className={`flex items-center gap-3 p-3 rounded-lg transition-colors ${
                            isActive
                                ? 'bg-gradient-to-r from-[#e10022] to-[#c0001c] text-white shadow-md'
                                : 'text-gray-700 hover:bg-gray-100 hover:text-[#e10022]'
                        }`}>
                        <item.icon className="h-5 w-5" />
                        <span className="font-medium">{item.label}</span>
                    </Link>
                )
            })}
        </nav>
        <div className="p-4 border-t">
            <a href="/api/auth/signout" className="flex items-center gap-3 p-3 rounded-lg text-gray-700 hover:bg-gray-100 transition-colors">
                <LogOut className="h-5 w-5" />
                <span className="font-medium">Cerrar sesión</span>
            </a>
        </div>
    </aside>
  );
};

export default AdminSidebar;
