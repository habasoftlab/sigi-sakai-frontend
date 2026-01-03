/* eslint-disable @next/next/no-img-element */
'use client';
import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Card } from 'primereact/card';
import { Button } from 'primereact/button';
import { Toast } from 'primereact/toast';
import { Image } from 'primereact/image';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import Link from 'next/link';
import { Tag } from 'primereact/tag';

// Servicios
import { OrderService } from '@/app/service/orderService';
import { CatalogService } from '@/app/service/catalogService';
import { ClientService } from '@/app/service/clientService';

const PrintOrderPage = () => {
    const searchParams = useSearchParams();
    const router = useRouter();
    const orderId = searchParams.get('id');
    const toast = useRef<Toast>(null);

    // --- ESTADOS ---
    const [orderData, setOrderData] = useState<any>(null);
    const [clientData, setClientData] = useState<any>(null);
    const [orderItems, setOrderItems] = useState<any[]>([]);

    const [imageUrl, setImageUrl] = useState<string | null>(null);
    const [imageError, setImageError] = useState(false);
    const [loading, setLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        if (orderId) {
            loadInitialData(Number(orderId));
        }
    }, [orderId]);

    useEffect(() => { setImageError(false); }, [orderId]);

    useEffect(() => {
        const fetchImage = async () => {
            if (orderData && orderData.rutaArchivo) {
                const url = await OrderService.getArchivoUrlVerificado(orderData.rutaArchivo);
                setImageUrl(url);
            } else {
                setImageUrl(null);
            }
        };
        fetchImage();
    }, [orderData]);

    const loadInitialData = async (id: number) => {
        setLoading(true);
        try {
            const [order, allProducts] = await Promise.all([
                OrderService.getOrdenById(id),
                CatalogService.getAllProductos()
            ]);

            let ordenActualizada = { ...order };

            if (order.idEstatusActual === 9) {
                try {
                    const userStr = localStorage.getItem('user');
                    const currentUserId = userStr ? JSON.parse(userStr).idUsuario : 1;

                    await OrderService.avanzarEstatus(id, {
                        idUsuario: currentUserId,
                        idEstatusDestino: 5,
                        clienteAprobo: true
                    });

                    ordenActualizada.idEstatusActual = 5;
                    toast.current?.show({
                        severity: 'info',
                        summary: 'Producción Iniciada',
                        detail: 'La orden ha sido marcada "En Impresión" automáticamente.',
                        life: 3000
                    });
                } catch (err) {
                    console.error("Error auto-avance a impresión", err);
                }
            }

            setOrderData(ordenActualizada);

            // Mapeo de productos
            if (order.detalles && order.detalles.length > 0) {
                const productMap = new Map();
                allProducts.forEach((p: any) => productMap.set(String(p.idProducto), p));
                const enrichedItems = order.detalles.map((detalle: any) => {
                    const p = productMap.get(String(detalle.idProducto));
                    return {
                        ...detalle,
                        nombreProducto: p?.descripcion || `Producto #${detalle.idProducto}`,
                        medidas: p?.formatoTamano || 'Estándar',
                        unidadVenta: p?.unidadVenta || 'Unidad'
                    };
                });
                setOrderItems(enrichedItems);
            }

            if (order.idCliente) {
                const client = await ClientService.getById(order.idCliente);
                setClientData(client);
            }

        } catch (error) {
            console.error("Error cargando datos", error);
            toast.current?.show({ severity: 'error', summary: 'Error', detail: 'No se pudo cargar la orden.' });
        } finally {
            setLoading(false);
        }
    };

    const handleMarkReady = async () => {
        setIsSubmitting(true);
        try {
            const userStr = localStorage.getItem('user');
            const currentUserId = userStr ? JSON.parse(userStr).idUsuario : 1;

            await OrderService.avanzarEstatus(Number(orderId), {
                idUsuario: currentUserId,
                idEstatusDestino: 6,
                clienteAprobo: true
            });

            toast.current?.show({
                severity: 'success',
                summary: 'Orden Terminada',
                detail: `La orden #${orderId} está lista para entrega.`,
                life: 2000
            });

            setTimeout(() => {
                router.push('/workshoplist');
            }, 1500);

        } catch (error) {
            console.error(error);
            toast.current?.show({ severity: 'error', summary: 'Error', detail: 'No se pudo finalizar la orden.' });
            setIsSubmitting(false);
        }
    };

    const handleDownloadDesign = () => {
        if (imageUrl) {
            window.open(imageUrl, '_blank');
        } else {
            toast.current?.show({ severity: 'error', summary: 'Error', detail: 'No hay archivo disponible para descargar.' });
        }
    };

    const getStatusInfo = (status: number) => {
        if (status === 5) return { severity: 'warning', label: 'En Impresión / Taller' };
        if (status === 6) return { severity: 'success', label: 'Lista para Entrega' };
        if (status === 9) return { severity: 'info', label: 'Recibiendo de Diseño...' };
        return { severity: 'secondary', label: `Estatus ${status}` };
    };

    if (loading || !orderData) {
        return <div className="flex justify-content-center align-items-center h-screen"><i className="pi pi-spin pi-spinner text-4xl"></i></div>;
    }

    const statusInfo = getStatusInfo(orderData.idEstatusActual);

    return (
        <div className="grid justify-content-center">
            <Toast ref={toast} />

            <div className="col-12 md:col-10 lg:col-8">
                {/* --- HEADER --- */}
                <div className="flex align-items-center justify-content-between mb-4">
                    <div className="flex align-items-center gap-3">
                        <Link href="/workshoplist" passHref legacyBehavior>
                            <a className="p-button p-component p-button-text p-button-rounded p-button-icon-only">
                                <i className="pi pi-arrow-left text-xl"></i>
                            </a>
                        </Link>
                        <div>
                            <h1 className="m-0 text-3xl font-bold">Orden N° {orderId}</h1>
                            <span className="text-500">Fecha de entrega: {orderData.fechaEntregaFormal ? new Date(orderData.fechaEntregaFormal).toLocaleDateString() : 'Pendiente'}</span>
                            <div className="mt-2">
                                <Tag severity={statusInfo.severity as any} value={statusInfo.label} className="text-sm px-3 py-1" />
                            </div>
                        </div>
                    </div>
                </div>

                {/* --- DETALLES DEL TRABAJO (Estilo Diseñador) --- */}
                <Card title="Detalles de Impresión" className="mb-4 shadow-2">
                    <div className="grid">
                        {/* COLUMNA IZQUIERDA: ESPECIFICACIONES */}
                        <div className="col-12 md:col-7 flex flex-column gap-3">
                            <div className="p-2 border-1 surface-border border-round bg-50">
                                <h3 className="text-lg font-bold m-0 mb-2 p-2 text-700">Productos a producir</h3>
                                <DataTable value={orderItems} size="small" responsiveLayout="scroll" className="p-datatable-sm" emptyMessage="Sin productos">
                                    <Column
                                        field="cantidad"
                                        header="Cant."
                                        style={{ width: '20%' }}
                                        body={(d) => <div className="flex flex-column align-items-center"><span className="font-bold text-lg text-900">{d.cantidad}</span></div>}
                                        className="text-center"
                                    />
                                    <Column field="nombreProducto" header="Producto" style={{ width: '40%' }} />
                                    <Column
                                        field="medidas"
                                        header="Medidas"
                                        style={{ width: '40%' }}
                                        body={(d) => <span className="text-blue-600 font-bold"><i className="pi pi-arrows-h mr-1 text-sm"></i>{d.medidas}</span>}
                                    />
                                </DataTable>
                            </div>

                            {/* Info Cliente y Notas */}
                            <div className="grid mt-2">
                                <div className="col-12 md:col-6">
                                    <label className="text-sm font-bold text-600 block mb-1">Cliente</label>
                                    <div className="p-2 surface-100 border-round font-medium text-overflow-ellipsis overflow-hidden white-space-nowrap">
                                        {clientData?.nombre || orderData.clienteNombre || 'Mostrador'}
                                    </div>
                                </div>
                                <div className="col-12 md:col-6">
                                    <label className="text-sm font-bold text-600 block mb-1">Contacto</label>
                                    <div className="p-2 surface-100 border-round font-medium">
                                        <i className="pi pi-phone text-green-600 mr-2"></i>
                                        {clientData?.telefono || 'N/A'}
                                    </div>
                                </div>
                                <div className="col-12">
                                    <label className="text-sm font-bold text-600 block mb-1">Notas de Producción / Diseño</label>
                                    <div className="p-3 bg-yellow-50 border-1 border-yellow-200 border-round text-700 font-italic">
                                        {orderData.notasDiseno || orderData.comentarios || 'Sin notas especiales'}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* COLUMNA DERECHA: VISUALIZADOR DE ARCHIVO */}
                        <div className="col-12 md:col-5 flex flex-column pl-0 md:pl-4 mt-4 md:mt-0 border-top-1 md:border-top-none md:border-left-1 surface-border">
                            <label className="font-bold block mb-2 w-full text-center text-600">Archivo de Impresión</label>

                            <div className="flex align-items-center justify-content-center w-full p-2 surface-50 border-round-xl border-1 border-dashed surface-border relative" style={{ minHeight: '300px' }}>
                                {imageUrl && !imageError ? (
                                    <Image
                                        src={imageUrl}
                                        alt="Diseño Final"
                                        width="100%"
                                        preview
                                        className="shadow-2 border-round w-full block"
                                        imageStyle={{ width: '100%', height: 'auto', maxHeight: '350px', objectFit: 'contain' }}
                                        onError={() => setImageError(true)}
                                    />
                                ) : (
                                    <div className="flex flex-column align-items-center justify-content-center text-gray-400">
                                        <i className="pi pi-image text-5xl mb-2"></i>
                                        <span className="text-sm text-center px-4">
                                            {imageError ? "Archivo no encontrado (404)" : "Sin archivo adjunto"}
                                        </span>
                                    </div>
                                )}
                            </div>

                            {/* Botón de Descarga Grande */}
                            <div className="mt-4">
                                <Button
                                    label="Descargar Archivo Original"
                                    icon="pi pi-download"
                                    className="w-full p-button-outlined"
                                    onClick={handleDownloadDesign}
                                    disabled={!imageUrl}
                                />
                            </div>
                        </div>
                    </div>
                </Card>

                {/* --- BOTÓN DE FINALIZACIÓN --- */}
                <Card className="shadow-4 border-top-3 border-green-500 bg-green-50">
                    <div className="flex flex-column md:flex-row align-items-center justify-content-between gap-4">
                        <div className="flex align-items-center gap-3">
                            <div className="border-circle bg-green-100 p-3 flex align-items-center justify-content-center">
                                <i className="pi pi-print text-2xl text-green-600"></i>
                            </div>
                            <div>
                                <h2 className="text-xl font-bold text-green-900 m-0 mb-1">Control de Calidad</h2>
                                <p className="text-green-800 m-0 text-sm">
                                    Al terminar la impresión, marca la orden como lista.
                                </p>
                            </div>
                        </div>

                        <Button
                            label="Trabajo Terminado (Lista para Entrega)"
                            icon="pi pi-check-circle"
                            severity="success"
                            size="large"
                            className="w-full md:w-auto shadow-2"
                            onClick={handleMarkReady}
                            loading={isSubmitting}
                        />
                    </div>
                </Card>

            </div>
        </div>
    );
};

export default PrintOrderPage;