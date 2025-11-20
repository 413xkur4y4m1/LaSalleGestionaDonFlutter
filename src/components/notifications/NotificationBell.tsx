"use client";

import { useState, useEffect } from 'react';
import { Bell, ExternalLink } from 'lucide-react';
import { useSession } from 'next-auth/react';
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { collection, query, orderBy, limit, onSnapshot, updateDoc, doc } from 'firebase/firestore';
import { db } from '@/lib/firebase-config';

interface NotificationData {
  id: string;
  tipo: 'vencimiento' | 'recordatorio' | 'formulario' | 'general';
  prestamoId?: string;
  mensaje: string;
  formUrl?: string;
  enviado: boolean;
  fechaEnvio: any; // Timestamp de Firebase
  canal: string;
  leida: boolean; // ⚠️ Nota: los cron usan "leida" (femenino)
}

// Función para formatear tiempo relativo
function getRelativeTime(timestamp: any): string {
  if (!timestamp?.toDate) return 'Ahora';
  
  const date = timestamp.toDate();
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
  
  if (diffInSeconds < 60) return 'Hace unos segundos';
  if (diffInSeconds < 3600) return `Hace ${Math.floor(diffInSeconds / 60)} min`;
  if (diffInSeconds < 86400) return `Hace ${Math.floor(diffInSeconds / 3600)} h`;
  if (diffInSeconds < 604800) return `Hace ${Math.floor(diffInSeconds / 86400)} días`;
  return date.toLocaleDateString('es-MX', { month: 'short', day: 'numeric' });
}

export function NotificationBell() {
  const { data: session } = useSession();
  const [notifications, setNotifications] = useState<NotificationData[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);

  // ============================================
  // LISTENER EN TIEMPO REAL
  // ============================================
  useEffect(() => {
    if (!session?.user?.id) return;

    const notificationsRef = collection(
      db, 
      "Estudiantes", 
      session.user.id, 
      "Notificaciones"
    );
    
    const q = query(
      notificationsRef, 
      orderBy("fechaEnvio", "desc"), 
      limit(20)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const userNotifications = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as NotificationData));

      setNotifications(userNotifications);
      setUnreadCount(userNotifications.filter(n => !n.leida).length);
    });

    return () => unsubscribe();
  }, [session?.user?.id]);

  // ============================================
  // MARCAR TODAS COMO LEÍDAS AL ABRIR
  // ============================================
  const handleOpenChange = async (open: boolean) => {
    setIsOpen(open);

    // Al cerrar el dropdown, marcar todas como leídas
    if (!open && unreadCount > 0 && session?.user?.id) {
      const unreadNotifications = notifications.filter(n => !n.leida);
      
      const updatePromises = unreadNotifications.map(notification => {
        const notifRef = doc(
          db,
          "Estudiantes",
          session.user!.id,
          "Notificaciones",
          notification.id
        );
        return updateDoc(notifRef, { leida: true });
      });

      try {
        await Promise.all(updatePromises);
      } catch (error) {
        console.error('Error al marcar notificaciones como leídas:', error);
      }
    }
  };

  // ============================================
  // RENDERIZAR ICONO SEGÚN TIPO
  // ============================================
  const getNotificationIcon = (tipo: string) => {
    switch (tipo) {
      case 'vencimiento':
        return '⚠️';
      case 'recordatorio':
        return '⏰';
      case 'formulario':
        return '📋';
      default:
        return '🔔';
    }
  };

  // ============================================
  // MANEJAR CLICK EN NOTIFICACIÓN
  // ============================================
  const handleNotificationClick = (notification: NotificationData) => {
    // Si tiene formUrl, abrir en nueva pestaña
    if (notification.formUrl) {
      window.open(notification.formUrl, '_blank');
    }
  };

  return (
    <DropdownMenu open={isOpen} onOpenChange={handleOpenChange}>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="relative"
          aria-label="Notificaciones"
        >
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <Badge
              variant="destructive"
              className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs"
            >
              {unreadCount > 9 ? '9+' : unreadCount}
            </Badge>
          )}
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent 
        className="w-80 md:w-96 max-h-[500px] overflow-y-auto" 
        align="end"
      >
        <DropdownMenuLabel className="flex items-center justify-between">
          <span>Notificaciones</span>
          {unreadCount > 0 && (
            <span className="text-xs text-muted-foreground">
              {unreadCount} sin leer
            </span>
          )}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />

        {notifications.length > 0 ? (
          <>
            {notifications.map(notification => (
              <DropdownMenuItem
                key={notification.id}
                className={`flex flex-col items-start gap-2 p-3 cursor-pointer ${
                  !notification.leida ? 'bg-accent/50' : ''
                }`}
                onClick={() => handleNotificationClick(notification)}
              >
                <div className="flex items-start gap-2 w-full">
                  <span className="text-lg shrink-0 mt-0.5">
                    {getNotificationIcon(notification.tipo)}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm ${
                      !notification.leida ? 'font-semibold' : 'font-normal'
                    }`}>
                      {notification.mensaje}
                    </p>
                    {notification.formUrl && (
                      <div className="flex items-center gap-1 text-xs text-blue-600 mt-1">
                        <ExternalLink className="h-3 w-3" />
                        <span>Abrir formulario</span>
                      </div>
                    )}
                  </div>
                  {!notification.leida && (
                    <div className="w-2 h-2 bg-blue-600 rounded-full shrink-0 mt-2" />
                  )}
                </div>
                <p className="text-xs text-muted-foreground pl-7">
                  {getRelativeTime(notification.fechaEnvio)}
                </p>
              </DropdownMenuItem>
            ))}
          </>
        ) : (
          <div className="p-8 text-center">
            <Bell className="h-12 w-12 mx-auto text-muted-foreground/30 mb-2" />
            <p className="text-sm text-muted-foreground">
              No tienes notificaciones
            </p>
          </div>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}