import { NuevaOrdenRequest, AvanzarEstatusRequest } from '@/app/types/orders';

const API_URL = process.env.NEXT_PUBLIC_API_URL;

export const orderService = {

    async crearOrden(data: NuevaOrdenRequest) {
        const res = await fetch(`${API_URL}/ordenes`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
        if (!res.ok) throw new Error('Error al crear la orden');
        return await res.json();
    },

    async subirArchivo(idOrden: number, archivo: File) {
        const formData = new FormData();
        formData.append('file', archivo);
        const res = await fetch(`${API_URL}/ordenes/${idOrden}/archivo`, {
            method: 'POST',
            body: formData
        });

        if (!res.ok) throw new Error('Error al subir el archivo');
        return await res.json();
    },

    async registrarPago(idOrden: number, pago: { monto: number; referencia: string; idUsuario: number }) {
        const res = await fetch(`${API_URL}/ordenes/${idOrden}/pagos`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(pago)
        });
        if (!res.ok) throw new Error('Error al registrar pago');
        return await res.json();
    },

    async avanzarEstatus(idOrden: number, body: AvanzarEstatusRequest) {
        const res = await fetch(`${API_URL}/ordenes/${idOrden}/avanzar`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body)
        });
        if (!res.ok) throw new Error('Error al actualizar estatus');
        return await res.json();
    },

    async getHistorial(idOrden: number) {
        const res = await fetch(`${API_URL}/ordenes/${idOrden}/historial`);
        if (!res.ok) throw new Error('Error al obtener historial');
        return await res.json();
    }
};