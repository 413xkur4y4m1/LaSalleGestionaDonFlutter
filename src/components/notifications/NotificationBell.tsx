
"use client";

import { useState, useEffect, useCallback } from 'react';
import { Bell } from 'lucide-react';
import { useSession } from 'next-auth/react';
import { getNotifications, NotificacionData, markNotificationAsRead } from '@/lib/firestore-operations';
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
import { doc, onSnapshot, collection, query, orderBy, limit } from 'firebase/firestore';
import { db } from '@/lib/firebase-config';

export function NotificationBell() {
  const { data: session } = useSession();
  const [notifications, setNotifications] = useState<NotificacionData[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (!session?.user?.id) return;

    const notificationsRef = collection(db, "Estudiantes", session.user.id, "Notificaciones");
    const q = query(notificationsRef, orderBy("createdAt", "desc"), limit(10));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const userNotifications = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as NotificacionData));
      setNotifications(userNotifications);
      setUnreadCount(userNotifications.filter(n => !n.leido).length);
    });

    // Cleanup subscription on component unmount
    return () => unsubscribe();
  }, [session]);

  const handleOpenChange = async (open: boolean) => {
    // When the dropdown closes, mark visible unread notifications as read
    if (!open && unreadCount > 0 && session?.user?.id) {
      const unreadIds = notifications
        .filter(n => !n.leido)
        .map(n => n.id!);
      
      if (unreadIds.length > 0) {
        // We create a "bulk" update by calling markAsRead for each one
        await Promise.all(
            unreadIds.map(id => markNotificationAsRead(session.user!.id, id))
        );
        // The real-time listener will automatically update the state, so no need to refetch.
      }
    }
  };

  return (
    <DropdownMenu onOpenChange={handleOpenChange}>
      <DropdownMenuTrigger className="relative outline-none ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 rounded-full p-2">
        <Bell className="h-6 w-6 text-white" aria-label="Notificaciones" />
        {unreadCount > 0 && (
          <Badge
            variant="destructive"
            className="absolute top-0 right-0 h-5 w-5 justify-center p-0 transform-gpu animate-in fade-in-0 zoom-in-50"
            aria-label={`${unreadCount} notificaciones no leídas`}
          >
            {unreadCount}
          </Badge>
        )}
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-80 md:w-96" align="end">
        <DropdownMenuLabel>Notificaciones</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {notifications.length > 0 ? (
          notifications.slice(0, 5).map(notification => (
            <DropdownMenuItem key={notification.id} className="flex flex-col items-start gap-1 whitespace-normal">
              <p className={`text-sm font-medium ${!notification.leido ? 'text-foreground font-bold' : 'text-muted-foreground'}`}>
                {notification.mensaje}
              </p>
              <p className="text-xs text-muted-foreground">
                {notification.createdAt ? formatDistanceToNow(notification.createdAt.toDate(), { addSuffix: true, locale: es }) : ''}
              </p>
            </DropdownMenuItem>
          ))
        ) : (
          <p className="p-4 text-sm text-center text-muted-foreground">No tienes notificaciones</p>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
