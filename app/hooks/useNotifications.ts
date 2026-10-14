import { useState, useEffect, useCallback } from 'react';
import { notificationService, Notificacion } from '@/app/service/notificationService';
import { notificationSocket } from '@/app/service/notificationSocket';

export const useNotifications = (
    userId: string | null,
    onNewNotification?: (notif: Notificacion) => void
) => {
    const [notifications, setNotifications] = useState<Notificacion[]>([]);
    const [loading, setLoading] = useState<boolean>(false);

    // Cargar pendientes del historial vía REST
    const fetchPendientes = useCallback(async () => {
        if (!userId) return;
        setLoading(true);
        try {
            const data = await notificationService.getPendientes();
            setNotifications(data);
        } catch (error) {
            console.error('Error al cargar notificaciones pendientes:', error);
        } finally {
            setLoading(false);
        }
    }, [userId]);

    // Marcar como leída y actualizar el estado local
    const markAsRead = useCallback(async (id: number | string) => {
        setNotifications((prev) => prev.filter((n) => n.id !== id));
        if (typeof id === 'number' && id > 1000000000000) {
            return;
        }
        try {
            await notificationService.marcarComoLeida(id);
        } catch (error) {
            console.warn(`No se pudo marcar como leída la notificación ${id} en el servidor:`, error);
        }
    }, []);

    const formatNotification = (rawNotif: any): Notificacion => {
        const parsed = typeof rawNotif === 'string' ? JSON.parse(rawNotif) : rawNotif;

        return {
            ...parsed,
            id: parsed.id || Date.now(),
            categoria: parsed.categoria || parsed.contenido?.categoria || 'SOLICITUD_INSUMOS',
            idOrden: parsed.idOrden || parsed.ordenId || parsed.contenido?.idOrden,
            titulo: parsed.titulo || parsed.contenido?.titulo || 'Nueva Notificación',
            mensaje: parsed.mensaje || parsed.contenido?.mensaje || '',
            leida: false,
            creadaEn: parsed.creadaEn || new Date().toISOString(),
            leidaEn: null
        };
    };

    useEffect(() => {
        if (!userId) return;

        fetchPendientes();

        notificationSocket.connect(userId, (rawNotif: any) => {
            try {
                const formattedNotif = formatNotification(rawNotif);

                setNotifications((prev) => [formattedNotif, ...prev]);
                onNewNotification?.(formattedNotif);
            } catch (error) {
                console.error("Error al procesar la notificación del socket:", error, rawNotif);
            }
        });

        return () => {
            notificationSocket?.disconnect?.();
        };
    }, [userId, fetchPendientes, onNewNotification]);

    const unreadCount = notifications.length;

    return {
        notifications,
        unreadCount,
        loading,
        markAsRead,
        refreshNotifications: fetchPendientes
    };
};