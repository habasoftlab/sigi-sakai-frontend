interface ClientBase {
    nombre: string;
    email: string | null;
    telefono: string | null;
    rfc: string | null;
    razonSocial: string | null;
    direccionFiscal: string | null;
    idUsoCfdi: number | null;
    idRegimenFiscal: number | null;
}

export interface Client extends ClientBase {
    id: number | null;
}

export interface ClientRequest extends ClientBase {
}