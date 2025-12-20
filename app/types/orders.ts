export interface DetalleOrden {
    idProducto: number;
    cantidad: number;
    precioUnitario: number;
    importe: number;
}

export interface OrdenCabecera {
    idUsuario: number;
    idCliente: number;
    idUsuarioDisenador: number | null;
    montoTotal: number;
    plazoEstimadoDias: number;
    requiereFactura: boolean;
    idCondicionPago: number;
    rutaArchivo: string;
    insumosVerificados: boolean;
}

export interface NuevaOrdenRequest {
    orden: OrdenCabecera;
    detalles: DetalleOrden[];
    idUsuarioAccion: number;
}

export interface AvanzarEstatusRequest {
    idUsuario: number;
    hayInsumos?: boolean;
    clienteAprobo?: boolean;
    idEstatusDestino?: number;
    comentarios?: string;
}

export interface Producto {
    idProducto: number;
    descripcion: string;
    precioUnitario: number;
    precioPaquete: number;
    tiempoProduccionDias: number;
    formatoTamano: string;
    unidadVenta: string;
    tirajeMinimo: number;
    volumenDescuentoCantidad?: number | null;
}

export interface CondicionPago {
    idCondicion: number;
    descripcion: string;
}

export interface HistorialItem {
    estatus: string;
    usuario: string;
    fecha: string;
    claveEstatus: string;
}