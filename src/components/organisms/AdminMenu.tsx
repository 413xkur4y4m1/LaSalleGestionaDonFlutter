"use client";

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, ScanLine, UserPlus, LogOut, Menu, X } from 'lucide-react';
import { signOut } from 'next-auth/react';

const menuItems = [
    { href: '/admin', label: 'Panel Principal', icon: Home },
    { href: '/admin/scan', label: 'Escanear Préstamo', icon: ScanLine },
    { href: '/admin/agregar-admin', label: 'Agregar Admin', icon: UserPlus },
];

const AdminMenu = () => {
    const pathname = usePathname();
    const [isOpen, setIsOpen] = useState(false);

    const toggleMenu = () => setIsOpen(!isOpen);
    const closeMenu = () => setIsOpen(false);

    const handleSignOut = async () => {
        // Primero, invalidamos la cookie de sesión de Firebase en nuestro backend
        await fetch('/api/auth/session/logout', { method: 'POST' });
        // Luego, cerramos la sesión de NextAuth
        signOut({ callbackUrl: '/' }); 
    };

    return (
        <>
            {/* Botón hamburguesa - Solo visible en móvil */}
            <button
                onClick={toggleMenu}
                className="lg:hidden fixed top-4 left-4 z-50 p-2 bg-white rounded-lg shadow-lg hover:bg-gray-100 transition-colors"
                aria-label="Toggle menu"
            >
                {isOpen ? <X className="h-6 w-6 text-gray-700" /> : <Menu className="h-6 w-6 text-gray-700" />}
            </button>

            {/* Overlay para móvil */}
            {isOpen && (
                <div
                    className="lg:hidden fixed inset-0 bg-black bg-opacity-50 z-30"
                    onClick={closeMenu}
                />
            )}

            {/* Menu Sidebar */}
            <div
                className={`
                    bg-white border-r border-gray-200 w-64 p-4 flex flex-col justify-between z-40 transition-transform duration-300 ease-in-out
                    fixed top-0 left-0 h-screen
                    ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
                `}
            >
                <div>
                    <div className="p-4 mb-4">
                        <h2 className="text-2xl font-bold text-red-600">Panel de Admin</h2>
                    </div>
                    <nav className="overflow-y-auto max-h-[calc(100vh-200px)]">
                        <ul>
                            {menuItems.map((item) => {
                                const isActive = pathname === item.href;
                                return (
                                    <li key={item.href}>
                                        <Link 
                                            href={item.href}
                                            onClick={closeMenu}
                                            className={`flex items-center p-3 my-1 rounded-lg transition-colors ${
                                                isActive 
                                                    ? 'bg-red-50 text-red-600 font-semibold' 
                                                    : 'text-gray-600 hover:bg-gray-100'
                                            }`}
                                        >
                                            <item.icon className="h-5 w-5 mr-3 flex-shrink-0" />
                                            <span>{item.label}</span>
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
                        <LogOut className="h-5 w-5 mr-3 flex-shrink-0" />
                        <span>Cerrar Sesión</span>
                    </button>
                </div>
            </div>
        </>
    );
};

export default AdminMenu;