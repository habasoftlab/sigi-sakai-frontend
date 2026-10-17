'use client';
import React, { useEffect, useState } from 'react';
import { Dialog } from 'primereact/dialog';
import { ClientService } from '@/app/service/clientService';
import { OrderService, OrdenDTO, DetalleOrdenDTO } from '@/app/service/orderService';
import { CatalogService } from '@/app/service/catalogService';
import { UltimaCompraDTO } from '@/app/types/clients';
import { Producto } from '@/app/types/orders';

interface LastPurchaseDialogProps {
    visible: boolean;
    idCliente: number | null;
    onHide: () => void;
}

const getNameProduct = (prod?: Producto, fallbackId?: number): string => {
    if (prod?.nombre) {
        return prod.nombre;
    }
    if (prod?.descripcion) {
        return prod.descripcion;
    }
    return `Producto ID #${fallbackId}`;
};

export const UltimaCompraDialog: React.FC<LastPurchaseDialogProps> = ({
    visible,
    idCliente,
    onHide
}) => {
    const [data, setData] = useState<UltimaCompraDTO | null>(null);
    const [ordenDetalle, setOrdenDetalle] = useState<OrdenDTO | null>(null);
    const [productosMap, setProductosMap] = useState<Map<string, Producto>>(new Map());
    const [loading, setLoading] = useState<boolean>(false);
    const [error, setError] = useState<boolean>(false);

    useEffect(() => {
        if (visible && idCliente) {
            fetchData(idCliente);
        } else {
            setData(null);
            setOrdenDetalle(null);
            setError(false);
        }
    }, [visible, idCliente]);

    const fetchData = async (id: number) => {
        setLoading(true);
        setError(false);
        try {
            // 1. Obtener la información de la última compra y el catálogo desde CatalogService en paralelo
            const [ultimaCompra, listaProductos] = await Promise.all([
                ClientService.getUltimaCompra(id),
                CatalogService.getProductos().catch(() => [] as Producto[])
            ]);

            // 2. Mapear productos por ID (convertidos a String)
            const map = new Map<string, Producto>();
            listaProductos.forEach((p: any) => {
                const key = String(p.idProducto ?? p.id ?? '');
                if (key) map.set(key, p);
            });
            setProductosMap(map);
            setData(ultimaCompra);

            // 3. Si existe una última orden, consultar su detalle de productos
            if (ultimaCompra?.idUltimaOrden) {
                const ordenInfo = await OrderService.getOrdenById(ultimaCompra.idUltimaOrden);
                setOrdenDetalle(ordenInfo);
            }
        } catch (err) {
            console.error('Error al consultar última compra:', err);
            setError(true);
        } finally {
            setLoading(false);
        }
    };

    const renderContent = () => {
        if (loading) {
            return (
                <div className="flex justify-content-center align-items-center py-6">
                    <i className="pi pi-spin pi-spinner text-4xl text-primary"></i>
                </div>
            );
        }

        if (error) {
            return (
                <div className="p-4 text-center text-red-500 surface-50 border-round">
                    <i className="pi pi-exclamation-circle text-3xl mb-2"></i>
                    <p className="m-0 font-medium">No se pudo cargar la información de la compra.</p>
                </div>
            );
        }

        if (!data) {
            return null;
        }

        return (
            <div className="flex flex-column gap-3 py-2">
                {/* Cabecera: Información General del Cliente */}
                <div className="surface-100 p-3 border-round">
                    <span className="text-500 block text-xs mb-1">Cliente</span>
                    <span className="font-bold text-lg text-900">{data.nombre}</span>
                    {data.rfc && <span className="block text-sm text-600 mt-1">RFC: {data.rfc}</span>}
                    {data.telefono && <span className="block text-sm text-600">Tel: {data.telefono}</span>}
                </div>

                {/* Detalle de la Orden o Mensaje de Vacío */}
                {data.idUltimaOrden ? (
                    <div className="surface-card border-1 surface-border border-round p-3 shadow-1">
                        <div className="flex justify-content-between align-items-center mb-3 pb-2 border-bottom-1 surface-border">
                            <div className="flex align-items-center gap-2">
                                <i className="pi pi-shopping-bag text-primary text-xl"></i>
                                <span className="font-bold text-900 text-base">
                                    Orden N° #{data.idUltimaOrden}
                                </span>
                            </div>
                            <span className="text-xs text-500">
                                {data.fechaUltimaCompra ? new Date(data.fechaUltimaCompra).toLocaleString() : '-'}
                            </span>
                        </div>

                        {/* Lista de Productos de la Orden */}
                        <div className="font-bold mb-2 text-xs text-700">Productos adquiridos:</div>
                        {ordenDetalle?.detalles && ordenDetalle.detalles.length > 0 ? (
                            <ul className="list-none p-0 m-0 flex flex-column gap-2 max-h-15rem overflow-y-auto">
                                {ordenDetalle.detalles.map((det: DetalleOrdenDTO) => {
                                    const prodKey = String(det.idProducto);
                                    const prod = productosMap.get(prodKey);
                                    
                                    // Extracción limpia para prevenir ternarios anidados (SonarQube)
                                    const tituloProducto = getNameProduct(prod, det.idProducto);

                                    return (
                                        <li
                                            key={det.idDetalle}
                                            className="surface-50 p-2 border-round flex justify-content-between align-items-center"
                                        >
                                            <div className="flex flex-column pr-2">
                                                <span className="font-bold text-xs text-900">
                                                    {tituloProducto}
                                                </span>
                                            </div>

                                            <div className="text-right flex flex-column flex-shrink-0">
                                                <span className="font-bold text-xs text-primary">
                                                    {det.cantidad} {prod?.unidadVenta || 'pzs'}
                                                </span>
                                                <span className="text-xs text-600">
                                                    ${det.importe?.toFixed(2)}
                                                </span>
                                            </div>
                                        </li>
                                    );
                                })}
                            </ul>
                        ) : (
                            <div className="text-center text-500 text-xs py-3">
                                Cargando lista de productos...
                            </div>
                        )}

                        {/* Total de la Orden */}
                        {ordenDetalle?.montoTotal !== undefined && (
                            <div className="mt-3 pt-2 border-top-1 surface-border flex justify-content-between align-items-center font-bold">
                                <span className="text-sm text-700">Monto Total:</span>
                                <span className="text-base text-green-600">
                                    ${ordenDetalle.montoTotal.toFixed(2)}
                                </span>
                            </div>
                        )}
                    </div>
                ) : (
                    <div className="p-4 text-center text-500 flex flex-column align-items-center gap-2 surface-50 border-round">
                        <i className="pi pi-info-circle text-3xl text-400"></i>
                        <span className="font-medium text-700">Sin historial de compras</span>
                        <span className="text-xs text-500">Este cliente aún no registra órdenes en el sistema.</span>
                    </div>
                )}
            </div>
        );
    };

    return (
        <Dialog
            header="Detalles de la ultima compra"
            visible={visible}
            style={{ width: '90vw', maxWidth: '500px' }}
            modal
            onHide={onHide}
        >
            {renderContent()}
        </Dialog>
    );
};