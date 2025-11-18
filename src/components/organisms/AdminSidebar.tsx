"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard, Users, CreditCard, Box, CheckCircle, BarChart, QrCode, ShieldAlert, UserPlus, Puzzle, LogOut, ScanLine, Menu, X
} from 'lucide-react';

const menuItems = [
  { href: '/admin/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { href: '/admin/scan', icon: ScanLine, label: 'Escanear Préstamo' },
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
      {/* Botón hamburguesa - Solo visible en móvil */}
      <button
        onClick={toggleSidebar}
        className="lg:hidden fixed top-4 left-4 z-50 p-2 bg-white rounded-lg shadow-lg hover:bg-gray-100 transition-colors"
        aria-label="Toggle menu"
      >
        {isOpen ? <X className="h-6 w-6 text-gray-700" /> : <Menu className="h-6 w-6 text-gray-700" />}
      </button>

      {/* Overlay para móvil */}
      {isOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black bg-opacity-50 z-30"
          onClick={closeSidebar}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
          bg-white h-screen shadow-lg flex flex-col z-40 transition-transform duration-300 ease-in-out
          fixed top-0 left-0
          w-64 lg:w-64
          ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        `}
      >
        {/* Header */}
        <div className="p-4 border-b">
          <h2 className="text-lg font-bold text-[#0a1c65]">Menú Principal</h2>
        </div>

        {/* Navigation */}
        <nav className="flex-grow p-4 space-y-2 overflow-y-auto">
          {menuItems.map((item) => {
            const isActive = pathname === item.href;

            return (
              <Link
                key={item.label}
                href={item.href}
                onClick={closeSidebar}
                className={`flex items-center gap-3 p-3 rounded-lg transition-colors ${
                  isActive
                    ? 'bg-gradient-to-r from-[#e10022] to-[#c0001c] text-white shadow-md'
                    : 'text-gray-700 hover:bg-gray-100 hover:text-[#e10022]'
                }`}
              >
                <item.icon className="h-5 w-5 flex-shrink-0" />
                <span className="font-medium">{item.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* Footer - Cerrar sesión */}
        <div className="p-4 border-t">
          <a
            href="/api/auth/signout"
            className="flex items-center gap-3 p-3 rounded-lg text-gray-700 hover:bg-gray-100 transition-colors"
          >
            <LogOut className="h-5 w-5 flex-shrink-0" />
            <span className="font-medium">Cerrar sesión</span>
          </a>
        </div>
      </aside>
    </>
  );
};

export default AdminSidebar;