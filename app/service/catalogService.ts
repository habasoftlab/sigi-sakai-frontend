import {
    RegimenFiscal,
    UsoCfdi,
    RazonCancelacion,
    EstatusSolicitud,
    TipoMovimiento
} from "@/app/types/catalog";
import { CondicionPago, Producto } from "@/app/types/orders";
import { apiClient } from "./apiClient";

const API_BASE_URL = process.env.NEXT_PUBLIC_ORDERS_API_URL;

export const CatalogService = {

    async getRegimenesFiscales(): Promise<RegimenFiscal[]> {
        const res = await apiClient(`${API_BASE_URL}/operaciones/regimenes-fiscales`);
        if (!res.ok) throw new Error("Error al cargar regímenes fiscales");
        return await res.json();
    },

    async getCondicionesPago(): Promise<CondicionPago[]> {
        const res = await apiClient(`${API_BASE_URL}/operaciones/condiciones-pago`);
        if (!res.ok) throw new Error("Error al cargar condiciones de pago");
        return await res.json();
    },

    async getUsosCfdi(): Promise<UsoCfdi[]> {
        const res = await apiClient(`${API_BASE_URL}/operaciones/usos-cfdi`);
        if (!res.ok) throw new Error("Error al cargar usos CFDI");
        return await res.json();
    },

    async getRazonesCancelacion(): Promise<RazonCancelacion[]> {
        const res = await apiClient(`${API_BASE_URL}/operaciones/razones-cancelacion`);
        if (!res.ok) throw new Error("Error al cargar razones de cancelación");
        return await res.json();
    },

    async getEstatusSolicitud(): Promise<EstatusSolicitud[]> {
        const res = await apiClient(`${API_BASE_URL}/operaciones/estatus-solicitud`);
        if (!res.ok) throw new Error("Error al cargar estatus");
        return await res.json();
    },

    async getTiposMovimiento(): Promise<TipoMovimiento[]> {
        const res = await apiClient(`${API_BASE_URL}/operaciones/tipos-movimiento`);
        if (!res.ok) throw new Error("Error al cargar tipos de movimiento");
        return await res.json();
    },

    async getProductos(): Promise<Producto[]> {
        const res = await apiClient(`${API_BASE_URL}/productos`);
        if (!res.ok) throw new Error("Error al obtener productos");
        return await res.json();
    },

    async getProducto(query: string): Promise<Producto[]> {
        const res = await apiClient(`${API_BASE_URL}/productos?q=${query}`);
        if (!res.ok) throw new Error("Error al buscar productos");
        return await res.json();
    },

    async createProducto(producto: any): Promise<Producto> {
        const res = await apiClient(`${API_BASE_URL}/productos`, {
            method: 'POST',
            // apiClient configura el Content-Type automáticamente
            body: JSON.stringify(producto)
        });
        if (!res.ok) throw new Error("Error al crear producto");
        return await res.json();
    },

    async updateProducto(id: number, producto: any): Promise<Producto> {
        const res = await apiClient(`${API_BASE_URL}/productos/${id}`, {
            method: 'PUT',
            body: JSON.stringify(producto)
        });
        if (!res.ok) throw new Error("Error al actualizar producto");
        return await res.json();
    },

    async deleteProducto(id: number): Promise<boolean> {
        const res = await apiClient(`${API_BASE_URL}/productos/${id}`, { 
            method: 'DELETE' 
        });
        if (!res.ok) throw new Error("Error al eliminar producto");
        return true;
    },

    async getAllProductos(): Promise<Producto[]> {
        const res = await apiClient(`${API_BASE_URL}/productos`);
        if (!res.ok) throw new Error("Error al cargar los productos");
        return await res.json();
    }
};