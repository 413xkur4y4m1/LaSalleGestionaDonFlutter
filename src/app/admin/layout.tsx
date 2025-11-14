
import React from 'react';
import AdminTopNavbar from '@/components/organisms/AdminTopNavbar';
import AdminSidebar from '@/components/organisms/AdminSidebar';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
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
