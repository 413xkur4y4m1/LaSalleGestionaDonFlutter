"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Users, CreditCard, Box, CheckCircle, BarChart, 
  QrCode, ShieldAlert, UserPlus, Puzzle, LogOut, 
  ScanLine, Menu, X
} from 'lucide-react';

const menuItems = [
  { href: '/admin/scan', icon: ScanLine, label: 'Escanear QR' },
  { href: '/admin/analisis-estadistico', icon: BarChart, label: 'Análisis Estadístico' },
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
  const [isOpen, setIsOpen] = useState(false);

  const toggleSidebar = () => setIsOpen(!isOpen);
  const closeSidebar = () => setIsOpen(false);

  return (
    <>
      {/* Botón hamburguesa (solo móvil y tablets) */}
      <button
        onClick={toggleSidebar}
        className="lg:hidden fixed top-4 left-4 z-50 p-2 bg-white rounded-lg shadow-md hover:bg-gray-100 transition-colors"
      >
        {isOpen ? <X className="h-6 w-6 text-gray-700" /> : <Menu className="h-6 w-6 text-gray-700" />}
      </button>

      {/* Capa oscura al abrir menú en móvil */}
      {isOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/50 z-30"
          onClick={closeSidebar}
        />
      )}

      {/* SIDEBAR RESPONSIVE */}
      <aside
        className={`
          bg-white shadow-xl fixed top-0 left-0 h-full flex flex-col
          transition-transform duration-300 ease-in-out z-40
          w-64 sm:w-72
          ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        `}
      >
        {/* Header */}
        <div className="p-4 border-b">
          <h2 className="text-lg font-bold text-[#0a1c65]">Menú Principal</h2>
        </div>

        {/* Navegación */}
        <nav className="flex-grow p-3 space-y-2 overflow-y-auto">
          {menuItems.map((item) => {
            const isActive = pathname === item.href;

            return (
              <Link
                key={item.label}
                href={item.href}
                onClick={closeSidebar}
                className={`flex items-center gap-3 p-3 rounded-lg font-medium transition-all duration-200
                  ${isActive
                    ? "bg-gradient-to-r from-[#e10022] to-[#c0001c] text-white shadow-md"
                    : "text-gray-700 hover:bg-gray-100 hover:text-[#e10022]"
                  }
                `}
              >
                <item.icon className="h-5 w-5 flex-shrink-0" />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="p-4 border-t">
          <a
            href="/api/auth/signout"
            className="flex items-center gap-3 p-3 rounded-lg font-medium text-gray-700 hover:bg-gray-100 transition-colors"
          >
            <LogOut className="h-5 w-5 flex-shrink-0" />
            <span>Cerrar sesión</span>
          </a>
        </div>
      </aside>
    </>
  );
};

export default AdminSidebar;
