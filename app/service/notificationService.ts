import { apiClient } from './apiClient';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

export type CategoriaNotificacion =
    | 'COTIZACION_PAGADA'
    | 'SOLICITUD_INSUMOS'
    | 'ORDEN_IMPRESION'
    | 'ORDEN_LISTA_ENTREGA'
    | 'ORDEN_CANCELADA'
    | string;

export interface Notificacion {
    id: number;
    emisorId: string;
    receptorId: string;
    categoria: CategoriaNotificacion;
    titulo: string;
    mensaje: string;
    leida: boolean;
    creadaEn: string;
    leidaEn: string | null;
}

export const notificationService = {
    async getPendientes(): Promise<Notificacion[]> {
        const response = await apiClient(`${API_BASE_URL}/notificaciones/pendientes`, {
            method: 'GET'
        });

        if (!response.ok) {
            throw new Error('Error al obtener notificaciones pendientes');
        }

        return await response.json();
    },

    async marcarComoLeida(idNotificacion: number | string): Promise<void> {
        const response = await apiClient(`${API_BASE_URL}/notificaciones/${idNotificacion}/leer`, {
            method: 'PATCH'
        });

        if (!response.ok) {
            throw new Error('Error al marcar la notificación como leída');
        }
    }
};