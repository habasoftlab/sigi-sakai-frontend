export interface RazonCancelacion {
    idRazon: number;
    descripcion: string;
}

export interface RegimenFiscal {
    idRegimen: number;
    clave: string;
    descripcion: string;
}

export interface UsoCfdi {
    idUsoCfdi: number;
    clave: string;
    descripcion: string;
}

export interface EstatusSolicitud {
    idSolicitudEstatus: number;
    clave: string;
    descripcion: string;
}

export interface TipoMovimiento {
    idTipo: number;
    descripcion: string;
}