
"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, ScanLine, UserPlus, LogOut } from 'lucide-react';
import { signOut } from 'next-auth/react';

// --- FIX: Añadida la nueva opción de menú ---
const menuItems = [
    { href: '/admin', label: 'Panel Principal', icon: Home },
    { href: '/admin/scan', label: 'Escanear Préstamo', icon: ScanLine },
    { href: '/admin/agregar-admin', label: 'Agregar Admin', icon: UserPlus },
];

const AdminMenu = () => {
    const pathname = usePathname();

    const handleSignOut = async () => {
        // Primero, invalidamos la cookie de sesión de Firebase en nuestro backend
        await fetch('/api/auth/session/logout', { method: 'POST' });
        // Luego, cerramos la sesión de NextAuth
        signOut({ callbackUrl: '/' }); 
    };

    return (
        <div className="bg-white border-r border-gray-200 w-64 p-4 flex flex-col justify-between">
            <div>
                <div className="p-4 mb-4">
                    <h2 className="text-2xl font-bold text-red-600">Panel de Admin</h2>
                </div>
                <nav>
                    <ul>
                        {menuItems.map((item) => {
                            const isActive = pathname === item.href;
                            return (
                                <li key={item.href}>
                                    <Link href={item.href} legacyBehavior>
                                        <a className={`flex items-center p-3 my-1 rounded-lg transition-colors ${isActive ? 'bg-red-50 text-red-600 font-semibold' : 'text-gray-600 hover:bg-gray-100'}`}>
                                            <item.icon className="h-5 w-5 mr-3" />
                                            {item.label}
                                        </a>
                                    </Link>
                                </li>
                            );
                        })}
                    </ul>
                </nav>
            </div>
            <div>
                <button 
                    onClick={handleSignOut}
                    className="flex items-center w-full p-3 my-1 rounded-lg text-gray-600 hover:bg-gray-100 transition-colors"
                >
                    <LogOut className="h-5 w-5 mr-3" />
                    Cerrar Sesión
                </button>
            </div>
        </div>
    );
};

export default AdminMenu;
