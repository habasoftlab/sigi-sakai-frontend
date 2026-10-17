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

export interface ClientRequest extends ClientBase {}

export type TipoClienteFiltro = 'todos' | 'mostrador' | 'factura';

export interface UltimaCompraDTO {
    idCliente: number;
    nombre: string;
    rfc: string | null;
    telefono: string | null;
    idUltimaOrden: number | null;
    fechaUltimaCompra: string | null;
}
