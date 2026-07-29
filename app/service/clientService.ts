import { Client, ClientRequest } from "@/app/types/clients";
import { apiClient } from "./apiClient";

// Apuntamos a la URL centralizada del API Gateway
const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

export const ClientService = {

    async getAll(): Promise<Client[]> {
        const res = await apiClient(`${API_BASE_URL}/clientes`);
        if (!res.ok) throw new Error("Error al obtener clientes");
        
        const data = await res.json();
        const listaCruda = Array.isArray(data) ? data : (data.content || []);
        
        return listaCruda.map((item: any) => ({
            ...item,
            id: item.idCliente,
            nombre: item.nombre || '',
            email: item.email || '',
            rfc: item.rfc || '',
        }));
    },

    async getById(id: number): Promise<Client> {
        const res = await apiClient(`${API_BASE_URL}/clientes/${id}`);
        if (!res.ok) {
            throw new Error("No se pudo obtener el cliente");
        }
        return await res.json();
    },

    async create(client: ClientRequest) {
        const response = await apiClient(`${API_BASE_URL}/clientes`, {
            method: 'POST',
            body: JSON.stringify(client)
        });
        if (!response.ok) {
            const errorBody = await response.json();
            throw errorBody;
        }
        return await response.json();
    },

    async update(id: number, client: ClientRequest) {
        const response = await apiClient(`${API_BASE_URL}/clientes/${id}`, {
            method: 'PUT',
            body: JSON.stringify(client)
        });
        if (!response.ok) {
            const errorBody = await response.json();
            throw errorBody;
        }
        return await response.json();
    },

    async delete(id: number) {
        const res = await apiClient(`${API_BASE_URL}/clientes/${id}`, {
            method: "DELETE"
        });
        if (!res.ok) throw new Error("Error al eliminar cliente");
        return true;
    }
};