import { NuevaOrdenRequest, AvanzarEstatusRequest } from '@/app/types/orders';

const ORDERS_API = process.env.NEXT_PUBLIC_ORDERS_API_URL;

const IMAGE_API = process.env.NEXT_PUBLIC_IMAGE_API_URL;

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

    async cancelarOrden(idOrden: number, idRazon: number, idUsuario: number) {
        const res = await fetch(`${ORDERS_API}/ordenes/${idOrden}/cancelar`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
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
        if (!res.ok) {
            throw new Error('Error al subir el archivo');
        }
        return await res.json();
    },

    async getArchivoUrlVerificado(filename: string | null): Promise<string | null> {
        if (!filename || filename === 'Pendiente' || filename.trim() === '') {
            return null;
        }
        return `${IMAGE_API}/uploads/${filename}?t=${Date.now()}`;
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

    async crearSolicitudCompra(data: { idUsuario: number; descripcion: string; cantidad: number; idOrden: number; idInsumo: number }) {
        const res = await fetch(`${ORDERS_API}/compras/solicitar`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
        if (!res.ok) throw new Error('Error al crear la solicitud de compra');
        return await res.json();
    },

    async getHistorial(idOrden: number) {
        const res = await fetch(`${ORDERS_API}/ordenes/${idOrden}/historial`);
        if (!res.ok) throw new Error('Error al obtener historial');
        return await res.json();
    },

    async getRazonesCancelacion() {
        const res = await fetch(`${ORDERS_API}/operaciones/razones-cancelacion`);
        if (!res.ok) throw new Error('Error al obtener razones de cancelación');
        return await res.json();
    },

    async getOrdenes(page = 0, size = 10) {
        const params = new URLSearchParams({
            page: page.toString(),
            size: size.toString(),
        });
        const response = await fetch(`${ORDERS_API}/ordenes?${params.toString()}&sort=idOrden,desc`);
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

    async getOrdenesActivas(page = 0, size = 10) {
        const params = new URLSearchParams({
            page: page.toString(),
            size: size.toString(),
        });
        const response = await fetch(`${ORDERS_API}/ordenes/activas?${params.toString()}`);
        if (!response.ok) throw new Error("Error al obtener órdenes activas");
        return await response.json();
    },

    async getCotizacionesYCanceladas(page = 0, size = 10) {
        const params = new URLSearchParams({
            page: page.toString(),
            size: size.toString(),
        });
        const response = await fetch(`${ORDERS_API}/ordenes/cotizacion-cancelacion?${params.toString()}`);
        if (!response.ok) throw new Error("Error al obtener cotizaciones");
        return await response.json();
    },

    async getOrdenesPorDisenador(idDisenador: number, page = 0, size = 10) {
        const params = new URLSearchParams({
            page: page.toString(),
            size: size.toString(),
        });
        const response = await fetch(`${ORDERS_API}/ordenes/por-disenador/${idDisenador}?${params.toString()}`);

        if (!response.ok) {
            throw new Error("Error al obtener órdenes del diseñador");
        }
        return await response.json();
    }
};