
import React from 'react';
import { Bell, User, LogOut } from 'lucide-react';
import { School } from 'lucide-react'; // Usando un ícono genérico por ahora

const AdminTopNavbar = () => {
  return (
    <header className="bg-[#0a1c65] text-white p-4 flex justify-between items-center shadow-md">
      <div className="flex items-center gap-4">
        <School className="h-8 w-8" />
        <span className="text-xl font-bold">LaSalleGestiona</span>
      </div>
      <div className="flex items-center gap-6">
        <button className="relative">
          <Bell className="h-6 w-6" />
          <span className="absolute -top-2 -right-2 bg-red-600 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">3</span>
        </button>
        <div className="h-9 w-9 bg-gray-300 rounded-full overflow-hidden">
            {/* Aquí iría la foto de perfil del admin */}
            <User className="h-full w-full text-gray-500 p-1" />
        </div>
        <button>
          <LogOut className="h-6 w-6" />
        </button>
      </div>
    </header>
  );
};

export default AdminTopNavbar;
