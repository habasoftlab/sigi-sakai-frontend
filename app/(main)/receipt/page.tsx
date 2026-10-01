'use client';
import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Card } from 'primereact/card';
import { Button } from 'primereact/button';
import { FileUpload } from 'primereact/fileupload';
import { Toast } from 'primereact/toast';
import { Dialog } from 'primereact/dialog';
import { InputNumber, InputNumberValueChangeEvent } from 'primereact/inputnumber';
import Link from 'next/link';

import { comprasService, SolicitudCompra, DetalleSolicitud } from '@/app/service/shopService';
import { OrderService } from '@/app/service/orderService';
import { Producto } from '@/app/types/orders';
import { CatalogService } from '@/app/service/catalogService';

/**
 * Formatea la cantidad solicitada de manera dinámica según la unidad de venta del producto.
 */
const formatCantidadInsumo = (cantidad: number, producto?: Producto): string => {
    if (!producto) {
        return `${cantidad} unidad(es)`;
    }

    const unidadVenta = producto.unidadVenta || '';
    const cantidadPaquete = producto.cantidadPaquete;

    // Si se vende por paquete/millar/lote y tiene una cantidad por paquete mayor a 1
    if (cantidadPaquete && cantidadPaquete > 1) {
        const totalPiezas = cantidad * cantidadPaquete;
        return `${cantidad} ${unidadVenta} (${totalPiezas.toLocaleString()} pzs en total)`;
    }

    if (unidadVenta.toLowerCase().includes('m²')) {
        return `${cantidad} m²`;
    }

    return `${cantidad} ${unidadVenta || 'unidad(es)'}`;
};

const UploadReceiptPage = () => {
    const searchParams = useSearchParams();
    const router = useRouter();
    const orderIdParam = searchParams.get('id');
    const toast = useRef<Toast>(null);

    const [solicitud, setSolicitud] = useState<SolicitudCompra | null>(null);
    const [productosMap, setProductosMap] = useState<Map<string, Producto>>(new Map());
    const [loading, setLoading] = useState<boolean>(true);
    const [showDelayDialog, setShowDelayDialog] = useState<boolean>(false);
    const [delayDays, setDelayDays] = useState<number | null>(null);

    useEffect(() => {
        const fetchData = async () => {
            if (!orderIdParam) {
                setLoading(false);
                return;
            }

            try {
                setLoading(true);

                // Cargar solicitudes pendientes y catálogo de productos en paralelo
                const [pendientes, listaProductos] = await Promise.all([
                    comprasService.getPendientes(),
                    CatalogService.getProductos().catch((err) => {
                        console.error('Error al cargar productos:', err);
                        return [] as Producto[];
                    })
                ]);

                // Mapear productos por ID para búsqueda rápida O(1)
                const map = new Map<string, Producto>();
                listaProductos.forEach((prod: any) => {
                    const key = String(prod.idProducto ?? prod.id ?? '');
                    if (key) {
                        map.set(key, prod);
                    }
                });
                setProductosMap(map);

                // Buscar la solicitud correspondiente a esta orden
                const encontrada = pendientes.find(
                    (s) => String(s.idOrden) === String(orderIdParam)
                );

                if (encontrada) {
                    setSolicitud(encontrada);
                } else {
                    toast.current?.show({
                        severity: 'warn',
                        summary: 'Solicitud no encontrada',
                        detail: `No se encontró una solicitud activa para la orden #${orderIdParam}`,
                        life: 4000
                    });
                }
            } catch (error) {
                console.error('Error al cargar la información:', error);
                toast.current?.show({
                    severity: 'error',
                    summary: 'Error de Servidor',
                    detail: 'No se pudo cargar la información de la solicitud de insumos.',
                    life: 4000
                });
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [orderIdParam]);

    const onCustomUpload = async (event: any) => {
        const file = event.files[0];
        if (!file || !orderIdParam) return;

        try {
            await OrderService.subirArchivo(Number(orderIdParam), file);

            toast.current?.show({
                severity: 'success',
                summary: 'Comprobante Subido',
                detail: 'El recibo se ha registrado exitosamente en la orden.',
                life: 3000
            });

            setTimeout(() => {
                router.push('/');
            }, 2000);
        } catch (error) {
            console.error('Error al subir comprobante:', error);
            toast.current?.show({
                severity: 'error',
                summary: 'Error',
                detail: 'Ocurrió un error al intentar guardar el archivo.',
                life: 4000
            });
        }
    };

    const handleNotifyDelay = () => {
        if (!delayDays) {
            toast.current?.show({
                severity: 'warn',
                summary: 'Días requeridos',
                detail: 'Ingresa la cantidad de días de retraso estimado.',
                life: 3000
            });
            return;
        }

        toast.current?.show({
            severity: 'info',
            summary: 'Notificación Enviada',
            detail: `Se ha reportado un retraso de ${delayDays} días al equipo.`,
            life: 3000
        });
        setShowDelayDialog(false);
    };

    if (loading) {
        return (
            <div className="flex justify-content-center align-items-center p-6 gap-3">
                <i className="pi pi-spin pi-spinner text-3xl text-primary"></i>
                <span className="text-lg text-600">Cargando solicitud de insumos...</span>
            </div>
        );
    }

    return (
        <div className="grid justify-content-center">
            <Toast ref={toast} />

            <div className="col-12 md:col-8 lg:col-6">
                <div className="flex align-items-center gap-3 mb-4">
                    <Link href="/" passHref legacyBehavior>
                        <a className="p-button p-component p-button-text p-button-rounded p-button-icon-only">
                            <i className="pi pi-arrow-left text-xl"></i>
                        </a>
                    </Link>
                    <h1 className="m-0 text-3xl font-bold">Orden N° {orderIdParam}</h1>
                </div>

                {/* Detalle de Insumos Reales */}
                <Card className="mb-4 shadow-2">
                    <h2 className="text-xl font-bold m-0 mb-3 flex align-items-center">
                        <i className="pi pi-list mr-2 text-blue-500"></i>
                        Detalle de la Solicitud
                    </h2>

                    <div className="mb-3">
                        <span className="block text-900 font-medium text-lg">
                            {solicitud?.descripcionSolicitud || 'Solicitud de Insumos para Producción'}
                        </span>
                        <span className="block text-500 text-sm mt-1">
                            Solicitud #{solicitud?.idSolicitud || 'N/A'} - Creada el:{' '}
                            {solicitud?.fechaCreacion ? new Date(solicitud.fechaCreacion).toLocaleString() : '-'}
                        </span>
                    </div>

                    <div className="surface-100 p-3 border-round">
                        <div className="font-bold mb-3 text-900">Materiales / Insumos requeridos:</div>
                        {solicitud?.detalles && solicitud.detalles.length > 0 ? (
                            <ul className="list-none p-0 m-0 flex flex-column gap-2">
                                {solicitud.detalles.map((det: DetalleSolicitud) => {
                                    const productIdKey = String(det.idProducto);
                                    const producto = productosMap.get(productIdKey);

                                    const tituloProducto = producto?.nombre || producto?.descripcion || `Producto ID #${det.idProducto}`;
                                    const textoCantidad = formatCantidadInsumo(det.cantidad, producto);

                                    return (
                                        <li
                                            key={det.idDetalle}
                                            className="surface-card p-3 border-round border-1 surface-border flex align-items-center justify-content-between shadow-1"
                                        >
                                            <div className="flex align-items-center gap-3">
                                                <i className="pi pi-box text-xl text-primary"></i>
                                                <div className="flex flex-column">
                                                    <span className="font-bold text-900 text-sm">
                                                        {tituloProducto}
                                                    </span>
                                                    {producto?.formatoTamano && (
                                                        <span className="text-xs text-500">
                                                            Formato: {producto.formatoTamano}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>

                                            <div className="text-right">
                                                <span className="p-tag p-tag-info font-bold text-sm">
                                                    {textoCantidad}
                                                </span>
                                            </div>
                                        </li>
                                    );
                                })}
                            </ul>
                        ) : (
                            <span className="text-500 text-sm">Sin detalles de insumos registrados.</span>
                        )}
                    </div>
                </Card>

                {/* Zona de Carga de Comprobante */}
                <Card className="shadow-4 border-top-3 border-red-500 bg-red-50 relative">
                    <Button
                        icon="pi pi-bell"
                        className="p-button-rounded p-button-danger p-button-text absolute top-0 right-0 mt-3 mr-3"
                        tooltip="Notificar retraso (Días)"
                        onClick={() => setShowDelayDialog(true)}
                    />

                    <div className="text-center mb-4">
                        <div className="inline-flex align-items-center justify-content-center bg-red-100 border-circle w-4rem h-4rem mb-3">
                            <i className="pi pi-exclamation-triangle text-2xl text-red-600"></i>
                        </div>
                        <h2 className="text-2xl font-bold m-0 text-red-700">Insumos Pendientes</h2>
                        <p className="text-red-600 mt-2">
                            Adjunta el comprobante/recibo o factura de compra correspondiente a esta orden.
                        </p>
                    </div>

                    <div className="surface-card border-2 border-dashed surface-border border-round p-5 flex flex-column align-items-center justify-content-center bg-white">
                        <i className="pi pi-cloud-upload text-6xl text-400 mb-4"></i>
                        <FileUpload
                            mode="basic"
                            name="file"
                            customUpload
                            uploadHandler={onCustomUpload}
                            accept="image/*,application/pdf"
                            maxFileSize={2000000}
                            chooseLabel="Sube tu recibo"
                            className="p-button-lg"
                            auto={true}
                        />
                        <span className="text-500 mt-3 text-sm">Formatos aceptados: PDF, JPG, PNG (Máx 2MB)</span>
                    </div>
                </Card>
            </div>

            {/* Modal para Notificar Retraso */}
            <Dialog
                header="Insumos Atrasados"
                visible={showDelayDialog}
                style={{ width: '90vw', maxWidth: '400px' }}
                modal
                onHide={() => setShowDelayDialog(false)}
            >
                <div className="flex flex-column gap-3 pt-2">
                    <p className="m-0 line-height-3 text-sm text-600">
                        Notificar al equipo sobre el tiempo estimado de llegada de los insumos requeridos.
                    </p>

                    <div className="field">
                        <label htmlFor="days" className="font-bold block mb-2">Cantidad de días de retraso:</label>
                        <InputNumber
                            id="days"
                            value={delayDays}
                            onValueChange={(e: InputNumberValueChangeEvent) => setDelayDays(e.value ?? null)}
                            showButtons
                            min={1}
                            suffix=" días"
                            className="w-full"
                            inputClassName="text-center"
                        />
                    </div>

                    <div className="flex justify-content-end gap-2">
                        <Button label="Cancelar" icon="pi pi-times" text onClick={() => setShowDelayDialog(false)} />
                        <Button label="Notificar" icon="pi pi-send" severity="danger" onClick={handleNotifyDelay} />
                    </div>
                </div>
            </Dialog>
        </div>
    );
};

export default UploadReceiptPage;