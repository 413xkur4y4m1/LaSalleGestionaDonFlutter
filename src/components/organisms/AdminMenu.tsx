"use client";

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { BarChart, ScanLine, UserPlus, LogOut, Menu, X } from 'lucide-react';
import { signOut } from 'next-auth/react';

const menuItems = [
    { href: '/admin/analisis-estadistico', label: 'Análisis Estadístico', icon: BarChart },
    { href: '/admin/scan', label: 'Escanear QR', icon: ScanLine },
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
            {/* Botón hamburguesa - Visible en tablets y móviles */}
            <button
                onClick={toggleMenu}
                className="lg:hidden fixed top-4 left-4 z-50 p-2 sm:p-3 bg-white rounded-lg shadow-lg hover:bg-gray-100 transition-colors"
                aria-label="Toggle menu"
            >
                {isOpen ? (
                    <X className="h-5 w-5 sm:h-6 sm:w-6 text-gray-700" />
                ) : (
                    <Menu className="h-5 w-5 sm:h-6 sm:w-6 text-gray-700" />
                )}
            </button>

            {/* Overlay para móvil y tablet */}
            {isOpen && (
                <div
                    className="lg:hidden fixed inset-0 bg-black bg-opacity-50 z-30"
                    onClick={closeMenu}
                    aria-hidden="true"
                />
            )}

            {/* Menu Sidebar - Totalmente Responsivo */}
            <aside
                className={`
                    bg-white border-r border-gray-200 flex flex-col justify-between z-40 
                    transition-transform duration-300 ease-in-out
                    fixed top-0 left-0 h-screen
                    w-64 sm:w-72 md:w-80 lg:w-64
                    p-3 sm:p-4 md:p-5 lg:p-4
                    ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
                `}
            >
                {/* Header del Sidebar */}
                <div>
                    <div className="p-3 sm:p-4 mb-3 sm:mb-4 border-b border-gray-100">
                        <h2 className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-[#e10022] to-[#0a1c65] bg-clip-text text-transparent">
                            LaSalle Admin
                        </h2>
                        <p className="text-xs sm:text-sm text-gray-500 mt-1">Sistema de Gestión</p>
                    </div>

                    {/* Navegación Principal */}
                    <nav className="overflow-y-auto max-h-[calc(100vh-240px)] sm:max-h-[calc(100vh-220px)] pr-1">
                        <ul className="space-y-1 sm:space-y-2">
                            {menuItems.map((item) => {
                                const isActive = pathname === item.href;
                                return (
                                    <li key={item.href}>
                                        <Link 
                                            href={item.href}
                                            onClick={closeMenu}
                                            className={`
                                                flex items-center gap-3 p-2.5 sm:p-3 rounded-lg 
                                                transition-all duration-200 group
                                                ${isActive 
                                                    ? 'bg-gradient-to-r from-[#e10022] to-[#0a1c65] text-white shadow-md' 
                                                    : 'text-gray-600 hover:bg-gray-100 hover:text-[#e10022]'
                                                }
                                            `}
                                        >
                                            <item.icon className={`
                                                h-4 w-4 sm:h-5 sm:w-5 flex-shrink-0
                                                ${isActive ? 'text-white' : 'text-gray-500 group-hover:text-[#e10022]'}
                                            `} />
                                            <span className="text-sm sm:text-base font-medium truncate">
                                                {item.label}
                                            </span>
                                        </Link>
                                    </li>
                                );
                            })}
                        </ul>
                    </nav>
                </div>

                {/* Footer - Botón de Cerrar Sesión */}
                <div className="border-t border-gray-200 pt-3 sm:pt-4">
                    <button 
                        onClick={handleSignOut}
                        className="
                            flex items-center gap-3 w-full p-2.5 sm:p-3 rounded-lg 
                            text-gray-600 hover:bg-red-50 hover:text-red-600 
                            transition-all duration-200 group
                        "
                    >
                        <LogOut className="h-4 w-4 sm:h-5 sm:w-5 flex-shrink-0 group-hover:text-red-600" />
                        <span className="text-sm sm:text-base font-medium">Cerrar Sesión</span>
                    </button>
                </div>
            </aside>

            {/* Espaciador para el contenido principal en desktop */}
            <div className="hidden lg:block w-64" aria-hidden="true" />
        </>
    );
};

export default AdminMenu;