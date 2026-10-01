import { NuevaOrdenRequest, AvanzarEstatusRequest } from '@/app/types/orders';
import { apiClient } from './apiClient';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;
const API_IMAGE_URL = process.env.NEXT_PUBLIC_IMAGE_API_URL;


export const OrderService = {

    async crearOrden(data: NuevaOrdenRequest) {
        const res = await apiClient(`${API_BASE_URL}/ordenes`, {
            method: 'POST',
            body: JSON.stringify(data)
        });
        if (!res.ok) throw new Error('Error al crear la orden');
        return await res.json();
    },

    async cancelarOrden(idOrden: number, idRazon: number, idUsuario: number) {
        const res = await apiClient(`${API_BASE_URL}/ordenes/${idOrden}/cancelar`, {
            method: 'POST',
            body: JSON.stringify({
                idRazon: idRazon,
                idUsuario: idUsuario
            })
        });

        if (!res.ok) {
            const errorBody = await res.json().catch(() => ({}));
            throw new Error(errorBody.message || 'Error al cancelar la orden');
        }
        return await res.json();
    },

    async updateCondicionPago(idOrden: number, idCondicion: number) {
        const response = await apiClient(`${API_BASE_URL}/ordenes/${idOrden}/condicion-pago`, {
            method: 'PUT',
            body: JSON.stringify({ idCondicionPago: idCondicion })
        });
        if (!response.ok) {
            try {
                const errorData = await response.json();
                throw errorData;
            } catch (e) {
                throw new Error("No se pudo actualizar la condición de pago");
            }
        }
        return true;
    },

    async updateNotasDiseno(idOrden: number, notas: string) {
        const res = await apiClient(`${API_BASE_URL}/ordenes/${idOrden}/notas-diseno`, {
            method: 'PUT',
            body: JSON.stringify({ notasDiseno: notas })
        });
        if (!res.ok) throw new Error('Error al actualizar notas de diseño');
        return await res.json();
    },

    async subirArchivo(idOrden: number, archivo: File) {
        const formData = new FormData();
        formData.append('file', archivo);

        const res = await apiClient(`${API_BASE_URL}/ordenes/${idOrden}/archivo`, {
            method: 'POST',
            body: formData // No enviamos Content-Type para que el navegador genere el multipart/form-data
        });
        if (!res.ok) {
            throw new Error('Error al subir el archivo');
        }
        return await res.json();
    },

    async getArchivoUrlVerificado(filename: string | null): Promise<string | null> {
        if (!filename || filename === 'Pendiente' || filename.trim() === '') {
            return null;
        }
        try {
            const res = await apiClient(`${API_IMAGE_URL}/uploads/${filename}`);
            if (!res.ok) {
                return null;
            }
            const imageBlob = await res.blob();
            return URL.createObjectURL(imageBlob);
        } catch (error) {
            console.error('Error al obtener la imagen:', error);
            return null;
        }
    },

    async registrarPago(idOrden: number, pago: { monto: number; referencia: string; idUsuario: number }) {
        const res = await apiClient(`${API_BASE_URL}/ordenes/${idOrden}/pagos`, {
            method: 'POST',
            body: JSON.stringify(pago)
        });
        if (!res.ok) throw new Error('Error al registrar pago');
        return await res.json();
    },

    async avanzarEstatus(idOrden: number, body: AvanzarEstatusRequest) {
        const res = await apiClient(`${API_BASE_URL}/ordenes/${idOrden}/avanzar`, {
            method: 'POST',
            body: JSON.stringify(body)
        });
        if (!res.ok) throw new Error('Error al actualizar estatus');
        return await res.json();
    },

    async crearSolicitudCompra(data: any) {
        const res = await apiClient(`${API_BASE_URL}/compras/solicitar`, {
            method: 'POST',
            body: JSON.stringify(data)
        });
        if (!res.ok) throw new Error('Error creando solicitud de compra');
        return await res.json();
    },

    async getHistorial(idOrden: number) {
        const res = await apiClient(`${API_BASE_URL}/ordenes/${idOrden}/historial`);
        if (!res.ok) throw new Error('Error al obtener historial');
        return await res.json();
    },

    async getRazonesCancelacion() {
        const res = await apiClient(`${API_BASE_URL}/operaciones/razones-cancelacion`);
        if (!res.ok) throw new Error('Error al obtener razones de cancelación');
        return await res.json();
    },

    async getOrdenes(page = 0, size = 10) {
        const params = new URLSearchParams({
            page: page.toString(),
            size: size.toString(),
        });
        const response = await apiClient(`${API_BASE_URL}/ordenes?${params.toString()}&sort=idOrden,desc`);
        if (!response.ok) {
            throw new Error("Error al obtener lista de órdenes");
        }
        return await response.json();
    },

    async getOrdenById(id: number) {
        const res = await apiClient(`${API_BASE_URL}/ordenes/${id}`);
        if (!res.ok) throw new Error("Error obteniendo orden");
        return await res.json();
    },

    async getEstatusOperaciones() {
        const res = await apiClient(`${API_BASE_URL}/operaciones/estatus`);
        if (!res.ok) throw new Error("Error cargando catálogo de estatus");
        return await res.json();
    },

    async getOrdenesActivas(page = 0, size = 10) {
        const params = new URLSearchParams({
            page: page.toString(),
            size: size.toString(),
        });
        const response = await apiClient(`${API_BASE_URL}/ordenes/activas?${params.toString()}`);
        if (!response.ok) throw new Error("Error al obtener órdenes activas");
        return await response.json();
    },

    async getCotizacionesYCanceladas(page = 0, size = 10) {
        const params = new URLSearchParams({
            page: page.toString(),
            size: size.toString(),
        });
        const response = await apiClient(`${API_BASE_URL}/ordenes/cotizacion-cancelacion?${params.toString()}`);
        if (!response.ok) throw new Error("Error al obtener cotizaciones");
        return await response.json();
    },

    async getOrdenesPorDisenador(idDisenador: number, page = 0, size = 10) {
        const params = new URLSearchParams({
            page: page.toString(),
            size: size.toString(),
        });
        const response = await apiClient(`${API_BASE_URL}/ordenes/por-disenador/${idDisenador}?${params.toString()}`);

        if (!response.ok) {
            throw new Error("Error al obtener órdenes del diseñador");
        }
        return await response.json();
    }
};