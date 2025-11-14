
"use client";

import React from 'react';
import { usePathname } from 'next/navigation';
import AdminTopNavbar from '@/components/organisms/AdminTopNavbar';
import AdminSidebar from '@/components/organisms/AdminSidebar';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isAuthPage = pathname === '/admin/login';

  // Si es una página de autenticación, renderiza solo a los hijos en un contenedor simple.
  // La página de login es responsable de su propio layout centrado.
  if (isAuthPage) {
    return (
      <div className="min-h-screen bg-gray-100 font-sans">
        {children}
      </div>
    );
  }

  // Para todas las demás páginas del admin, muestra el dashboard completo.
  return (
    <div className="min-h-screen bg-gray-100 font-sans">
      <AdminSidebar />
      <div className="ml-64"> {/* Este margen debe coincidir con el ancho del Sidebar */}
        <AdminTopNavbar />
        <main className="p-8">
          {children}
        </main>
      </div>
    </div>
  );
}
