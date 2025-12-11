import {
    RegimenFiscal,
    UsoCfdi,
    RazonCancelacion,
    EstatusSolicitud,
    TipoMovimiento
} from "@/app/types/catalog";
import { Producto } from "@/app/types/orders";

// Apuntamos al microservicio de operaciones/órdenes
const ORDERS_API = process.env.NEXT_PUBLIC_ORDERS_API_URL;

export const CatalogService = {

    async getRegimenesFiscales(): Promise<RegimenFiscal[]> {
        const res = await fetch(`${ORDERS_API}/operaciones/regimenes-fiscales`);
        if (!res.ok) throw new Error("Error al cargar regímenes fiscales");
        return await res.json();
    },

    async getUsosCfdi(): Promise<UsoCfdi[]> {
        const res = await fetch(`${ORDERS_API}/operaciones/usos-cfdi`);
        if (!res.ok) throw new Error("Error al cargar usos CFDI");
        return await res.json();
    },

    async getRazonesCancelacion(): Promise<RazonCancelacion[]> {
        const res = await fetch(`${ORDERS_API}/operaciones/razones-cancelacion`);
        if (!res.ok) throw new Error("Error al cargar razones de cancelación");
        return await res.json();
    },

    async getEstatusSolicitud(): Promise<EstatusSolicitud[]> {
        const res = await fetch(`${ORDERS_API}/operaciones/estatus-solicitud`);
        if (!res.ok) throw new Error("Error al cargar estatus");
        return await res.json();
    },

    async getTiposMovimiento(): Promise<TipoMovimiento[]> {
        const res = await fetch(`${ORDERS_API}/operaciones/tipos-movimiento`);
        if (!res.ok) throw new Error("Error al cargar tipos de movimiento");
        return await res.json();
    },

    async buscarProductos(query: string): Promise<Producto[]> {
        const res = await fetch(`${ORDERS_API}/operaciones/productos?q=${query}`);
        if (!res.ok) throw new Error("Error al buscar productos");
        return await res.json();
    }
};