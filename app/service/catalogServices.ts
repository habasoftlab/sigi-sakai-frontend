import {
    RegimenFiscal,
    UsoCfdi,
    RazonCancelacion,
    EstatusSolicitud,
    TipoMovimiento
} from "@/app/types/catalog";

const API_URL = process.env.NEXT_PUBLIC_API_URL;

export const CatalogService = {

    // --- Catálogos de Clientes / Facturación ---
    async getRegimenesFiscales(): Promise<RegimenFiscal[]> {
        const res = await fetch(`${API_URL}/operaciones/regimenes-fiscales`);
        if (!res.ok) throw new Error("Error al cargar regímenes fiscales");
        return await res.json();
    },

    async getUsosCfdi(): Promise<UsoCfdi[]> {
        const res = await fetch(`${API_URL}/operaciones/usos-cfdi`);
        if (!res.ok) throw new Error("Error al cargar usos CFDI");
        return await res.json();
    },

    // --- Catálogos Operativos ---
    async getRazonesCancelacion(): Promise<RazonCancelacion[]> {
        const res = await fetch(`${API_URL}/operaciones/razones-cancelacion`);
        if (!res.ok) throw new Error("Error al cargar razones de cancelación");
        return await res.json();
    },

    async getEstatusSolicitud(): Promise<EstatusSolicitud[]> {
        const res = await fetch(`${API_URL}/operaciones/estatus-solicitud`);
        if (!res.ok) throw new Error("Error al cargar estatus");
        return await res.json();
    },

    async getTiposMovimiento(): Promise<TipoMovimiento[]> {
        const res = await fetch(`${API_URL}/operaciones/tipos-movimiento`);
        if (!res.ok) throw new Error("Error al cargar tipos de movimiento");
        return await res.json();
    }
};