// src/types/client.ts

// Esta es la estructura que viene de la Base de Datos
export interface Client {
    id: number | null; // Cambié a number porque SpringBoot suele usar Long/Integer
    nombre: string;
    email: string | null;
    telefono: string | null;
    rfc: string | null;
    razonSocial: string | null;
    direccionFiscal: string | null;
    idUsoCfdi: number | null;
    idRegimenFiscal: number | null;
    cp: string | null;
}

// Esta es la estructura para enviar datos (POST/PUT)
export interface ClientRequest {
    nombre: string;
    email: string | null;
    telefono: string | null;
    rfc: string | null;
    razonSocial: string | null;
    direccionFiscal: string | null;
    idUsoCfdi: number | null;
    idRegimenFiscal: number | null;
    cp: string | null;
}