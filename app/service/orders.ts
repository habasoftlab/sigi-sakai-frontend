// src/types/ordenes.ts (o donde prefieras guardar tus tipos)

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

// Estructura para crear una nueva orden (Endpoint 1)
export interface NuevaOrdenRequest {
    orden: OrdenCabecera;
    detalles: DetalleOrden[];
    idUsuarioAccion: number;
}

// Estructura para avanzar estatus (Endpoint 4)
// Usamos "Partial" o una unión de tipos porque el body cambia según el área
export type AvanzarEstatusRequest =
    | { idUsuario: number }                        // Caso A: General
    | { idUsuario: number; hayInsumos: boolean }   // Caso B: Taller
    | { idUsuario: number; clienteAprobo: boolean }; // Caso C: Cliente

export interface Producto {
    idProducto: number;
    descripcion: string;
    precioUnitario: number;
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