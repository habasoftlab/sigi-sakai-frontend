import { apiClient } from './apiClient';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

export interface DetalleSolicitud {
    idDetalle: number;
    idProducto: number;
    cantidad: number;
}

export interface SolicitudCompra {
    idSolicitud: number;
    idOrden: number;
    idUsuarioSolicitante: number;
    idEstatus: number;
    fechaCreacion: string;
    descripcionSolicitud: string;
    detalles: DetalleSolicitud[];
}

export const comprasService = {
    async getPendientes(): Promise<SolicitudCompra[]> {
        const response = await apiClient(`${API_BASE_URL}/compras/pendientes`, {
            method: 'GET'
        });

        if (!response.ok) {
            throw new Error('Error al obtener compras pendientes');
        }

        return await response.json();
    }
};