import { useState, useEffect, useCallback } from 'react';
import { notificationService, Notificacion } from '@/app/service/notificationService';
import { notificationSocket } from '@/app/service/notificationSocket';

export const useNotifications = (userId: string | null) => {
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
        try {
            await notificationService.marcarComoLeida(id);
            setNotifications((prev) => prev.filter((n) => n.id !== id));
        } catch (error) {
            console.error(`Error al marcar como leída la notificación ${id}:`, error);
        }
    }, []);

    // Escuchar el WebSocket y sincronizar REST al montar
    useEffect(() => {
        if (!userId) return;

        // 1. Cargar historial inicial
        fetchPendientes();

        // 2. Conectar WebSocket para recibir notificaciones entrantes
        notificationSocket.connect(userId, (newNotif: Notificacion) => {
            setNotifications((prev) => [newNotif, ...prev]);
        });

        return () => {
            notificationSocket.disconnect();
        };
    }, [userId, fetchPendientes]);

    const unreadCount = notifications.length;

    return {
        notifications,
        unreadCount,
        loading,
        markAsRead,
        refreshNotifications: fetchPendientes
    };
};