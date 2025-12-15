import { NuevaOrdenRequest, AvanzarEstatusRequest } from '@/app/types/orders';

// Definimos la URL específica para este microservicio
const ORDERS_API = process.env.NEXT_PUBLIC_ORDERS_API_URL;

export const OrderService = {

    async crearOrden(data: NuevaOrdenRequest) {
        const res = await fetch(`${ORDERS_API}/ordenes`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
        if (!res.ok) throw new Error('Error al crear la orden');
        return await res.json();
    },

    async updateCondicionPago(idOrden: number, idCondicion: number) {
        const response = await fetch(`${ORDERS_API}/ordenes/${idOrden}/condicion-pago`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
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

    async subirArchivo(idOrden: number, archivo: File) {
        const formData = new FormData();
        formData.append('file', archivo);
        const res = await fetch(`${ORDERS_API}/ordenes/${idOrden}/archivo`, {
            method: 'POST',
            body: formData
        });

        if (!res.ok) throw new Error('Error al subir el archivo');
        return await res.json();
    },

    async registrarPago(idOrden: number, pago: { monto: number; referencia: string; idUsuario: number }) {
        const res = await fetch(`${ORDERS_API}/ordenes/${idOrden}/pagos`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(pago)
        });
        if (!res.ok) throw new Error('Error al registrar pago');
        return await res.json();
    },

    async avanzarEstatus(idOrden: number, body: AvanzarEstatusRequest) {
        const res = await fetch(`${ORDERS_API}/ordenes/${idOrden}/avanzar`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body)
        });
        if (!res.ok) throw new Error('Error al actualizar estatus');
        return await res.json();
    },

    async getHistorial(idOrden: number) {
        const res = await fetch(`${ORDERS_API}/ordenes/${idOrden}/historial`);
        if (!res.ok) throw new Error('Error al obtener historial');
        return await res.json();
    },

    async getOrdenes(page = 0, size = 20) {
        const params = new URLSearchParams({
            page: page.toString(),
            size: size.toString(),
        });
        const response = await fetch(`${ORDERS_API}/ordenes?${params.toString()}`);
        if (!response.ok) {
            throw new Error("Error al obtener lista de órdenes");
        }
        return await response.json();
    },

    async getOrdenById(id: number) {
        const res = await fetch(`${ORDERS_API}/ordenes/${id}`);
        if (!res.ok) throw new Error("Error obteniendo orden");
        return await res.json();
    },

    async getEstatusOperaciones() {
        const res = await fetch(`${ORDERS_API}/operaciones/estatus`);
        if (!res.ok) throw new Error("Error cargando catálogo de estatus");
        return await res.json();
    },
};