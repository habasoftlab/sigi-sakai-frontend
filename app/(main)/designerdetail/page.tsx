/* eslint-disable @next/next/no-img-element */
'use client';
import React, { useState, useRef, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Card } from 'primereact/card';
import { Button } from 'primereact/button';
import { FileUpload } from 'primereact/fileupload';
import { Toast } from 'primereact/toast';
import { Image } from 'primereact/image';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import Link from 'next/link';
import { Tag } from 'primereact/tag';
import { Steps } from 'primereact/steps';

import { OrderService } from '@/app/service/orderService';
import { ClientService } from '@/app/service/clientService';
import { CatalogService } from '@/app/service/catalogService';

const DesignerOrderDetailPage = () => {
    const searchParams = useSearchParams();
    const orderId = searchParams.get('id');
    const router = useRouter();
    const toast = useRef<Toast>(null);

    // --- ESTADOS ---
    const [orderData, setOrderData] = useState<any>(null);
    const [clientData, setClientData] = useState<any>(null);
    const [orderItems, setOrderItems] = useState<any[]>([]);
    const [imageUrl, setImageUrl] = useState<string | null>(null);
    const [imageError, setImageError] = useState(false);
    const [loading, setLoading] = useState(true);

    // Control de UI
    const [uploadedFile, setUploadedFile] = useState<File | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [activeIndex, setActiveIndex] = useState(0);

    // Pasos visuales
    const stepsItems = [
        { label: 'En Desarrollo' },
        { label: 'En Revisión' },
        { label: 'Aprobado' }
    ];

    useEffect(() => {
        if (orderId) loadInitialData(Number(orderId));
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

    // Calcular paso activo
    useEffect(() => {
        if (!orderData) return;
        const s = Number(orderData.idEstatusActual);
        if (s === 7 || s === 10 || s === 3 || s === 4) setActiveIndex(0);
        else if (s === 8) setActiveIndex(1);
        else if (s === 9) setActiveIndex(2);
        else setActiveIndex(0);
    }, [orderData]);

    const loadInitialData = async (id: number) => {
        setLoading(true);
        try {
            const [order, allProducts] = await Promise.all([
                OrderService.getOrdenById(id),
                CatalogService.getAllProductos()
            ]);

            let ordenActualizada = { ...order };

            // AUTO-AVANCE: Si está en 3 o 4 -> Pasar a 7
            if ([3, 4].includes(order.idEstatusActual)) {
                try {
                    const userStr = localStorage.getItem('user');
                    const currentUserId = userStr ? JSON.parse(userStr).idUsuario : null;
                    if (currentUserId) {
                        await OrderService.avanzarEstatus(id, {
                            idUsuario: currentUserId,
                            idEstatusDestino: 7
                        });
                        ordenActualizada.idEstatusActual = 7;
                        toast.current?.show({ severity: 'info', summary: 'Diseño Iniciado', detail: 'Orden marcada "En Desarrollo".', life: 3000 });
                    }
                } catch (err) { console.error("Error auto-avance", err); }
            } else if (order.idEstatusActual === 2) {
                setTimeout(() => toast.current?.show({ severity: 'warn', summary: 'Espera', detail: 'Faltan insumos del taller.', life: 5000 }), 500);
            }

            setOrderData(ordenActualizada);

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
            toast.current?.show({ severity: 'error', summary: 'Error', detail: 'Error cargando información.' });
        } finally {
            setLoading(false);
        }
    };

    // --- ACCIÓN 1: SUBIR ARCHIVO (Sin cambiar estatus) ---
    const handleUploadOnly = async () => {
        if (!uploadedFile) return;
        setIsSubmitting(true);
        try {
            await OrderService.subirArchivo(Number(orderId), uploadedFile);
            toast.current?.show({ severity: 'success', summary: 'Carga Exitosa', detail: 'Archivo guardado.' });
            await loadInitialData(Number(orderId));
            setUploadedFile(null);
        } catch (error) {
            toast.current?.show({ severity: 'error', summary: 'Error', detail: 'No se pudo subir el archivo.' });
        } finally {
            setIsSubmitting(false);
        }
    };

    // --- ACCIÓN 2: ENVIAR A REVISIÓN (De 7/10 -> 8) ---
    const sendToReview = async () => {
        const tieneArchivo = uploadedFile || (orderData.rutaArchivo && orderData.rutaArchivo !== 'Pendiente');

        if (!tieneArchivo) {
            toast.current?.show({ severity: 'warn', summary: 'Falta Archivo', detail: 'Sube un diseño antes de enviar a revisión.' });
            return;
        }

        setIsSubmitting(true);
        try {
            const currentUserId = JSON.parse(localStorage.getItem('user') || '{}').idUsuario;

            if (uploadedFile) await OrderService.subirArchivo(Number(orderId), uploadedFile);

            await OrderService.avanzarEstatus(Number(orderId), {
                idUsuario: currentUserId,
                idEstatusDestino: 8
            });
            toast.current?.show({ severity: 'info', summary: 'Enviado', detail: 'Orden en espera de respuesta del cliente.' });
            setUploadedFile(null);
            loadInitialData(Number(orderId));
        } catch (error) {
            toast.current?.show({ severity: 'error', summary: 'Error', detail: 'Falló el envío a revisión.' });
        } finally {
            setIsSubmitting(false);
        }
    };

    // --- ACCIÓN 3: REGISTRAR DECISIÓN (De 8 -> 9 ó 10) ---
    const registerDecision = async (approved: boolean) => {
        setIsSubmitting(true);
        try {
            const currentUserId = JSON.parse(localStorage.getItem('user') || '{}').idUsuario;
            const nuevoEstatus = approved ? 9 : 10;

            await OrderService.avanzarEstatus(Number(orderId), {
                idUsuario: currentUserId,
                idEstatusDestino: nuevoEstatus,
                clienteAprobo: approved
            });
            const msg = approved ? 'Diseño Aprobado.' : 'Diseño Rechazado. Regresando a desarrollo.';
            toast.current?.show({ severity: approved ? 'success' : 'warn', summary: 'Decisión Registrada', detail: msg });
            if (approved) {
                setTimeout(() => router.push('/designerlist'), 1500);
            } else {
                loadInitialData(Number(orderId));
            }

        } catch (error) {
            toast.current?.show({ severity: 'error', summary: 'Error', detail: 'No se pudo registrar la decisión.' });
        } finally {
            setIsSubmitting(false);
        }
    };

    // --- RENDERIZADO DEL ÁREA DE ACCIÓN ---
    const renderActionArea = () => {
        const estatus = Number(orderData.idEstatusActual);

        // CASO BLOQUEADO: ESTATUS 2
        if (estatus === 2) {
            return (
                <Card className="mb-4 shadow-2 border-left-3 border-yellow-500 bg-yellow-50">
                    <div className="flex align-items-center gap-4">
                        <i className="pi pi-lock text-4xl text-yellow-600"></i>
                        <div>
                            <h2 className="text-yellow-800 m-0 mb-2">Orden Bloqueada</h2>
                            <p className="text-yellow-700 m-0 font-medium">Esperando verificación de insumos del Taller.</p>
                        </div>
                    </div>
                </Card>
            );
        }

        // FASE 1: DESARROLLO (Subir y Enviar)
        // Aceptamos 7 (Proceso), 3 y 4 (Insumos).
        if (estatus === 7 || estatus === 3 || estatus === 4) {
            return (
                <Card title="Entrega de Diseño" className="mb-4 shadow-2">
                    <p className="text-600 mb-4 text-sm">Sube el archivo de diseño para enviarlo a revisión del cliente.</p>
                    <div className="grid">
                        <div className="col-12 md:col-6 flex flex-column gap-3">
                            <div className="border-1 border-round surface-border p-3 bg-50 text-center">
                                <FileUpload
                                    mode="basic"
                                    name="demo[]"
                                    accept="image/*,application/pdf"
                                    maxFileSize={50000000}
                                    chooseLabel={uploadedFile ? "Cambiar" : "Seleccionar"}
                                    className={`w-full ${uploadedFile ? 'p-button-info' : 'p-button-outlined p-button-secondary'}`}
                                    customUpload auto={false} uploadHandler={() => { }}
                                    onSelect={(e) => e.files[0] && setUploadedFile(e.files[0])}
                                />
                                {uploadedFile && (
                                    <Button
                                        label="Subir Ahora"
                                        icon="pi pi-save"
                                        className="w-full mt-2 p-button-outlined p-button-sm"
                                        onClick={handleUploadOnly}
                                        loading={isSubmitting}
                                    />
                                )}
                            </div>
                        </div>
                        <div className="col-12 md:col-6 flex align-items-center">
                            <Button
                                label="Enviar a Revisión"
                                icon="pi pi-send"
                                className="w-full p-button-lg h-full"
                                onClick={sendToReview}
                                loading={isSubmitting}
                                disabled={!orderData.rutaArchivo && !uploadedFile}
                            />
                        </div>
                    </div>
                </Card>
            );
        }

        // FASE 1.5:(Estatus 10 - Rechazado)
        if (estatus === 10) {
            return (
                <Card className="mb-4 shadow-2 border-top-3 border-red-500">
                    <div className="flex align-items-center mb-4 text-red-700">
                        <i className="pi pi-exclamation-circle text-2xl mr-2"></i>
                        <h2 className="m-0 text-xl font-bold">Diseño Rechazado - Requiere Correcciones</h2>
                    </div>

                    <div className="grid">
                        <div className="col-12 md:col-6 flex flex-column gap-3">
                            <div className="border-1 border-round surface-border p-3 bg-red-50 text-center">
                                <span className="text-red-600 text-sm font-bold block mb-2">Subir Nueva Versión</span>
                                <FileUpload
                                    mode="basic"
                                    name="demo[]"
                                    accept="image/*,application/pdf"
                                    maxFileSize={50000000}
                                    chooseLabel={uploadedFile ? "Archivo Seleccionado" : "Subir Corrección"}
                                    className={`w-full ${uploadedFile ? 'p-button-danger' : 'p-button-outlined p-button-danger'}`}
                                    customUpload auto={false} uploadHandler={() => { }}
                                    onSelect={(e) => e.files[0] && setUploadedFile(e.files[0])}
                                />
                                {uploadedFile && (
                                    <Button
                                        label="Guardar Corrección"
                                        icon="pi pi-save"
                                        severity="danger"
                                        className="w-full mt-2 p-button-outlined p-button-sm"
                                        onClick={handleUploadOnly}
                                        loading={isSubmitting}
                                    />
                                )}
                            </div>
                        </div>
                        <div className="col-12 md:col-6 flex align-items-center">
                            <Button
                                label="Enviar Correcciones a Revisión"
                                icon="pi pi-refresh"
                                severity="danger"
                                className="w-full p-button-lg h-full shadow-2"
                                onClick={sendToReview}
                                loading={isSubmitting}
                                disabled={!orderData.rutaArchivo && !uploadedFile}
                            />
                        </div>
                    </div>
                </Card>
            );
        }

        // FASE 2: REVISIÓN
        if (estatus === 8) {
            return (
                <Card title="Respuesta del Cliente" className="mb-4 shadow-2 border-left-3 border-orange-500">
                    <div className="text-center mb-4">
                        <span className="text-xl font-bold text-700">El cliente está revisando. ¿Cuál fue su respuesta?</span>
                    </div>
                    <div className="grid">
                        <div className="col-12 md:col-6">
                            <Button
                                label="Rechazado (Corregir)"
                                icon="pi pi-times"
                                severity="danger"
                                className="w-full py-4 text-xl shadow-2"
                                onClick={() => registerDecision(false)}
                                loading={isSubmitting}
                            />
                        </div>
                        <div className="col-12 md:col-6">
                            <Button
                                label="Aprobado (Finalizar)"
                                icon="pi pi-check"
                                severity="success"
                                className="w-full py-4 text-xl shadow-2"
                                onClick={() => registerDecision(true)}
                                loading={isSubmitting}
                            />
                        </div>
                        {/* Opción de corrección menor */}
                        <div className="col-12 mt-3 text-center">
                            <small className="text-500 block mb-2">¿Cambio menor antes de aprobar?</small>
                            <FileUpload
                                mode="basic"
                                chooseLabel="Actualizar Archivo"
                                className="p-button-outlined p-button-secondary p-button-sm"
                                customUpload auto={false} onSelect={(e) => e.files[0] && setUploadedFile(e.files[0])}
                            />
                            {uploadedFile && <Button icon="pi pi-upload" className="ml-2" onClick={handleUploadOnly} loading={isSubmitting} />}
                        </div>
                    </div>
                </Card>
            );
        }

        // FASE 3: APROBADO
        if (estatus === 9) {
            return (
                <Card className="mb-4 shadow-2 bg-green-50 border-left-3 border-green-500">
                    <div className="flex flex-column align-items-center justify-content-center text-center">
                        <i className="pi pi-check-circle text-5xl text-green-600 mb-3"></i>
                        <h2 className="text-green-800 m-0 mb-2">Diseño Aprobado</h2>
                        <p className="text-green-700 mb-4">La orden está lista para pasar a producción.</p>
                        <Link href="/designerlist">
                            <Button label="Volver a la Lista" icon="pi pi-arrow-left" severity="success" text />
                        </Link>
                    </div>
                </Card>
            );
        }

        return null;
    };

    const getSeverity = (status: number): "success" | "info" | "warning" | "danger" | null => {
        if (status === 7) return 'info';
        if (status === 8) return 'warning';
        if (status === 9) return 'success';
        if (status === 10) return 'danger';
        if (status === 2) return 'warning';
        if (status === 3 || status === 4) return 'info';
        return null;
    };

    if (loading || !orderData) return <div className="flex justify-content-center h-screen align-items-center"><i className="pi pi-spin pi-spinner text-4xl"></i></div>;

    return (
        <div className="grid justify-content-center">
            <Toast ref={toast} />

            <div className="col-12 md:col-10 lg:col-8">
                {/* HEADER */}
                <div className="flex align-items-center justify-content-between mb-4">
                    <div className="flex align-items-center gap-3">
                        <Link href="/designerlist" passHref legacyBehavior>
                            <a className="p-button p-component p-button-text p-button-rounded p-button-icon-only">
                                <i className="pi pi-arrow-left text-xl"></i>
                            </a>
                        </Link>
                        <div>
                            <h1 className="m-0 text-3xl font-bold">Orden N° {orderId}</h1>
                            <span className="text-500">Fecha de entrega: {orderData.fechaEntregaFormal || 'Pendiente'}</span>
                            <div className="mt-2">
                                <Tag severity={getSeverity(orderData.idEstatusActual)} value={`Estatus ${orderData.idEstatusActual}`} />
                            </div>
                        </div>
                    </div>
                </div>

                {/* BARRA DE PROGRESO */}
                <div className="card mb-4 shadow-1 py-4">
                    <Steps model={stepsItems} activeIndex={activeIndex} readOnly={true} className="w-full" />
                </div>

                {/* DETALLES */}
                <Card title="Detalles del Trabajo" className="mb-4 shadow-2">
                    <div className="grid">
                        <div className="col-12 md:col-7 flex flex-column gap-3">
                            <div className="p-2 border-1 surface-border border-round bg-50">
                                <h3 className="text-lg font-bold m-0 mb-2 p-2 text-700">Especificaciones</h3>
                                <DataTable value={orderItems} size="small" responsiveLayout="scroll" className="p-datatable-sm" emptyMessage="Sin productos">
                                    <Column field="cantidad" header="Cant." style={{ width: '20%' }} body={(d) => <div className="flex flex-column align-items-center"><span className="font-bold text-lg text-900">{d.cantidad}</span></div>} className="text-center"></Column>
                                    <Column field="nombreProducto" header="Producto" style={{ width: '40%' }}></Column>
                                    <Column field="medidas" header="Medidas" style={{ width: '40%' }} body={(d) => <span className="text-blue-600 font-bold"><i className="pi pi-arrows-h mr-1 text-sm"></i>{d.medidas}</span>}></Column>
                                </DataTable>
                            </div>
                            <div className="grid mt-2">
                                <div className="col-12 md:col-6">
                                    <label className="text-sm font-bold text-600 block mb-1">Cliente</label>
                                    <div className="p-2 surface-100 border-round font-medium text-overflow-ellipsis overflow-hidden white-space-nowrap">{clientData?.nombre || orderData.clienteNombre || 'Mostrador'}</div>
                                </div>
                                <div className="col-12 md:col-6">
                                    <label className="text-sm font-bold text-600 block mb-1">Teléfono</label>
                                    <div className="p-2 surface-100 border-round font-medium"><i className="pi pi-phone text-green-600 mr-2"></i>{clientData?.telefono || 'N/A'}</div>
                                </div>
                                <div className="col-12">
                                    <label className="text-sm font-bold text-600 block mb-1">Comentarios</label>
                                    <div className="p-3 bg-50 border-1 border-yellow-100 border-round text-700 font-italic">{orderData.comentarios || 'Sin comentarios'}</div>
                                </div>
                            </div>
                        </div>

                        <div className="col-12 md:col-5 flex flex-column pl-0 md:pl-4 mt-4 md:mt-0 border-top-1 md:border-top-none md:border-left-1 surface-border">
                            <label className="font-bold block mb-2 w-full text-center text-600">Referencia Inicial</label>
                            <div className="flex align-items-center justify-content-center w-full p-2 surface-50 border-round-xl border-1 border-dashed surface-border relative" style={{ minHeight: '300px' }}>
                                {imageUrl && !imageError ? (
                                    <Image src={imageUrl} alt="Referencia" width="100%" preview className="shadow-2 border-round w-full block" imageStyle={{ width: '100%', height: 'auto', maxHeight: '350px', objectFit: 'contain' }} onError={() => setImageError(true)} />
                                ) : (
                                    <div className="flex flex-column align-items-center justify-content-center text-gray-400"><i className="pi pi-image text-5xl mb-2"></i><span className="text-sm text-center px-4">{imageError ? "Archivo no encontrado" : "Sin archivo"}</span></div>
                                )}
                            </div>
                            {orderData.rutaArchivo && orderData.rutaArchivo !== 'Pendiente' && (
                                <div className="mt-3 text-center"><a href={imageUrl!} target="_blank" rel="noopener noreferrer" className="p-button p-button-sm p-button-outlined p-button-secondary text-xs no-underline"><i className="pi pi-external-link mr-2"></i>Abrir en pestaña nueva</a></div>
                            )}
                        </div>
                    </div>
                </Card>
                {renderActionArea()}
            </div >
        </div >
    );
};

export default DesignerOrderDetailPage;