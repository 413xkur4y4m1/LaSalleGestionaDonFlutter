
"use client";

import React, { useState, useEffect } from 'react';
import { Bell, User, LogOut, School, Clock, AlertCircle, CheckCircle } from 'lucide-react';
import { signOut, useSession } from 'next-auth/react';
import { db } from '@/lib/firebase';
import { collection, query, where, onSnapshot, orderBy, limit } from 'firebase/firestore';

interface Notification {
  id: string;
  tipo: 'nuevo_prestamo' | 'adeudo' | 'pago';
  estudiante: string;
  mensaje: string;
  timestamp: any;
  leida: boolean;
}

const AdminTopNavbar = () => {
  const { data: session } = useSession();
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    // Listener para nuevos préstamos (estado: pendiente)
    const prestamosQuery = query(
      collection(db, 'Estudiantes'),
    );

    const unsubscribePrestamos = onSnapshot(prestamosQuery, (snapshot) => {
      const newNotifications: Notification[] = [];
      
      snapshot.forEach((studentDoc) => {
        const studentData = studentDoc.data();
        const prestamosSubcol = collection(db, `Estudiantes/${studentDoc.id}/Prestamos`);
        
        // Escuchar préstamos pendientes
        const qPrestamos = query(
          prestamosSubcol,
          where('estado', '==', 'pendiente'),
          orderBy('fechaSolicitud', 'desc'),
          limit(5)
        );

        onSnapshot(qPrestamos, (prestamosSnap) => {
          prestamosSnap.forEach((prestamoDoc) => {
            const prestamo = prestamoDoc.data();
            newNotifications.push({
              id: prestamoDoc.id,
              tipo: 'nuevo_prestamo',
              estudiante: studentData.nombre || 'Estudiante',
              mensaje: `${studentData.nombre} solicitó ${prestamo.cantidad} ${prestamo.nombreMaterial}`,
              timestamp: prestamo.fechaSolicitud,
              leida: false
            });
          });
          updateNotifications(newNotifications);
        });

        // Escuchar adeudos pendientes
        const adeudosSubcol = collection(db, `Estudiantes/${studentDoc.id}/Adeudos`);
        const qAdeudos = query(
          adeudosSubcol,
          where('estado', '==', 'pendiente'),
          limit(5)
        );

        onSnapshot(qAdeudos, (adeudosSnap) => {
          adeudosSnap.forEach((adeudoDoc) => {
            const adeudo = adeudoDoc.data();
            newNotifications.push({
              id: adeudoDoc.id,
              tipo: 'adeudo',
              estudiante: studentData.nombre || 'Estudiante',
              mensaje: `${studentData.nombre} tiene un adeudo de $${adeudo.precio_ajustado} por ${adeudo.nombreMaterial}`,
              timestamp: adeudo.fechaVencimiento,
              leida: false
            });
          });
          updateNotifications(newNotifications);
        });

        // Escuchar pagos recientes
        const pagadosSubcol = collection(db, `Estudiantes/${studentDoc.id}/Pagados`);
        const qPagados = query(
          pagadosSubcol,
          orderBy('fechaPago', 'desc'),
          limit(3)
        );

        onSnapshot(qPagados, (pagadosSnap) => {
          pagadosSnap.forEach((pagoDoc) => {
            const pago = pagoDoc.data();
            const now = new Date();
            const pagoDate = pago.fechaPago?.toDate();
            
            // Solo mostrar pagos de las últimas 24 horas
            if (pagoDate && (now.getTime() - pagoDate.getTime()) < 86400000) {
              newNotifications.push({
                id: pagoDoc.id,
                tipo: 'pago',
                estudiante: studentData.nombre || 'Estudiante',
                mensaje: `${studentData.nombre} pagó $${pago.precio} por ${pago.nombreMaterial}`,
                timestamp: pago.fechaPago,
                leida: false
              });
            }
          });
          updateNotifications(newNotifications);
        });
      });
    });

    return () => {
      unsubscribePrestamos();
    };
  }, []);

  const updateNotifications = (newNotifs: Notification[]) => {
    // Ordenar por timestamp descendente
    const sorted = newNotifs.sort((a, b) => {
      const timeA = a.timestamp?.toDate?.()?.getTime() || 0;
      const timeB = b.timestamp?.toDate?.()?.getTime() || 0;
      return timeB - timeA;
    });

    setNotifications(sorted.slice(0, 10)); // Máximo 10 notificaciones
    setUnreadCount(sorted.filter(n => !n.leida).length);
  };

  const handleSignOut = async () => {
    try {
      // Invalidar cookie de Firebase
      await fetch('/api/auth/session/logout', { method: 'POST' });
      // Cerrar sesión de NextAuth
      signOut({ callbackUrl: '/' });
    } catch (error) {
      console.error('Error al cerrar sesión:', error);
      // Cerrar sesión de todos modos
      signOut({ callbackUrl: '/' });
    }
  };

  const getNotificationIcon = (tipo: string) => {
    switch (tipo) {
      case 'nuevo_prestamo':
        return <Clock className="h-4 w-4 text-blue-500" />;
      case 'adeudo':
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      case 'pago':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      default:
        return <Bell className="h-4 w-4" />;
    }
  };

  const formatTimestamp = (timestamp: any) => {
    if (!timestamp) return '';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins < 1) return 'Ahora';
    if (diffMins < 60) return `Hace ${diffMins}m`;
    if (diffMins < 1440) return `Hace ${Math.floor(diffMins / 60)}h`;
    return `Hace ${Math.floor(diffMins / 1440)}d`;
  };

  return (
    <header className="bg-[#0a1c65] text-white p-3 md:p-4 flex justify-between items-center shadow-md relative">
      {/* Logo y título */}
      <div className="flex items-center gap-2 md:gap-4">
        <School className="h-6 w-6 md:h-8 md:w-8 flex-shrink-0" />
        <span className="text-base md:text-xl font-bold truncate">
          LaSalleGestiona
        </span>
      </div>

      {/* Acciones del usuario */}
      <div className="flex items-center gap-3 md:gap-6">
        {/* Notificaciones */}
        <div className="relative">
          <button 
            onClick={() => setShowNotifications(!showNotifications)}
            className="relative hover:opacity-80 transition-opacity"
            aria-label="Notificaciones"
          >
            <Bell className="h-5 w-5 md:h-6 md:w-6" />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 md:-top-2 md:-right-2 bg-red-600 text-white text-[10px] md:text-xs rounded-full h-4 w-4 md:h-5 md:w-5 flex items-center justify-center font-semibold">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>

          {/* Panel de notificaciones */}
          {showNotifications && (
            <>
              <div 
                className="fixed inset-0 z-10" 
                onClick={() => setShowNotifications(false)}
              />
              <div className="absolute right-0 top-12 w-80 md:w-96 bg-white rounded-lg shadow-2xl z-20 border border-gray-200 max-h-[80vh] overflow-hidden">
                <div className="p-4 border-b border-gray-200 bg-gray-50">
                  <h3 className="font-bold text-gray-800 text-sm md:text-base">
                    Notificaciones ({unreadCount} nuevas)
                  </h3>
                </div>
                <div className="overflow-y-auto max-h-96">
                  {notifications.length === 0 ? (
                    <div className="p-8 text-center text-gray-500">
                      <Bell className="h-12 w-12 mx-auto mb-2 text-gray-300" />
                      <p className="text-sm">No hay notificaciones</p>
                    </div>
                  ) : (
                    notifications.map((notif) => (
                      <div
                        key={notif.id}
                        className={`p-4 border-b border-gray-100 hover:bg-gray-50 transition-colors cursor-pointer ${
                          !notif.leida ? 'bg-blue-50' : ''
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          <div className="flex-shrink-0 mt-1">
                            {getNotificationIcon(notif.tipo)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm text-gray-800 font-medium mb-1">
                              {notif.estudiante}
                            </p>
                            <p className="text-xs text-gray-600">
                              {notif.mensaje}
                            </p>
                            <p className="text-xs text-gray-400 mt-1">
                              {formatTimestamp(notif.timestamp)}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
                {notifications.length > 0 && (
                  <div className="p-3 border-t border-gray-200 bg-gray-50">
                    <button className="text-xs text-blue-600 hover:text-blue-700 w-full text-center font-medium">
                      Ver todas las notificaciones
                    </button>
                  </div>
                )}
              </div>
            </>
          )}
        </div>

        {/* Avatar - Oculto en móviles pequeños */}
        <div className="hidden sm:flex items-center gap-2">
          <div className="h-8 w-8 md:h-9 md:w-9 bg-gray-300 rounded-full overflow-hidden flex-shrink-0">
            {session?.user?.image ? (
              <img 
                src={session.user.image} 
                alt="Avatar" 
                className="h-full w-full object-cover"
              />
            ) : (
              <User className="h-full w-full text-gray-500 p-1" />
            )}
          </div>
          <span className="hidden md:block text-sm font-medium truncate max-w-[120px]">
            {session?.user?.name || 'Admin'}
          </span>
        </div>

        {/* Cerrar sesión */}
        <button 
          onClick={handleSignOut}
          className="hover:opacity-80 transition-opacity"
          aria-label="Cerrar sesión"
          title="Cerrar sesión"
        >
          <LogOut className="h-5 w-5 md:h-6 md:w-6" />
        </button>
      </div>
    </header>
  );
};

export default AdminTopNavbar;
