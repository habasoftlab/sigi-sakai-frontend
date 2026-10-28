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
import { downloadDesignFile } from '@/app/utils/downloadUtils';

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
    const fileUploadRef = useRef<any>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [activeIndex, setActiveIndex] = useState(0);

    // Pasos visuales
    const stepsItems = [
        { label: 'En desarrollo' },
        { label: 'En revisión' },
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

    useEffect(() => {
        if (!orderData) return;

        const status = Number(orderData.idEstatusActual);

        if ([3, 4, 7, 10].includes(status)) {
            setActiveIndex(0);
        } else if (status === 8) {
            setActiveIndex(1);
        } else if ([9, 5].includes(status)) {
            setActiveIndex(2);
        } else {
            setActiveIndex(0);
        }
    }, [orderData]);

    // --- HELPER: Manejo del avance automático de estatus ---
    const handleStatusAutoAdvance = async (id: number, status: number, currentOrder: any) => {
        let updatedOrder = { ...currentOrder };

        if ([3, 4, 10].includes(status)) {
            try {
                const userStr = localStorage.getItem('user');
                const currentUserId = userStr ? JSON.parse(userStr).idUsuario : null;

                if (!currentUserId) return updatedOrder;

                await OrderService.avanzarEstatus(id, {
                    idUsuario: currentUserId,
                    idEstatusDestino: 7
                });

                updatedOrder.idEstatusActual = 7;

                const isCorrection = status === 10;
                toast.current?.show({
                    severity: 'info',
                    summary: isCorrection ? 'Correcciones pendientes' : 'Diseño iniciado',
                    detail: isCorrection
                        ? 'La orden regresó a diseño en desarrollo.'
                        : 'La orden pasó a diseño en desarrollo.',
                    life: 3000
                });
            } catch (err) {
                console.error('Error en auto-avance de estatus', err);
            }
        } else if (status === 2) {
            setTimeout(() => {
                toast.current?.show({
                    severity: 'warn',
                    summary: 'Espera',
                    detail: 'Faltan insumos del taller.',
                    life: 5000
                });
            }, 500);
        }

        return updatedOrder;
    };

    // --- HELPER: Enriquecimiento de detalles de productos ---
    const enrichOrderItems = (detalles: any[], allProducts: any[]) => {
        if (!detalles || detalles.length === 0) return [];

        const productMap = new Map();
        allProducts.forEach((p: any) => productMap.set(String(p.idProducto), p));

        return detalles.map((detalle: any) => {
            const p = productMap.get(String(detalle.idProducto));
            return {
                ...detalle,
                nombreProducto: p?.descripcion || `Producto #${detalle.idProducto}`,
                medidas: p?.formatoTamano || 'Estándar',
                unidadVenta: p?.unidadVenta || 'Unidad'
            };
        });
    };

    // --- FUNCIÓN PRINCIPAL REFACTORIZADA ---
    const loadInitialData = async (id: number) => {
        setLoading(true);
        try {
            const [order, allProducts] = await Promise.all([
                OrderService.getOrdenById(id),
                CatalogService.getAllProductos()
            ]);

            const status = Number(order.idEstatusActual);
            const ordenActualizada = await handleStatusAutoAdvance(id, status, order);

            setOrderData(ordenActualizada);
            setOrderItems(enrichOrderItems(order.detalles, allProducts));

            if (order.idCliente) {
                const client = await ClientService.getById(order.idCliente);
                setClientData(client);
            }
        } catch (error) {
            console.error('Error cargando datos', error);
            toast.current?.show({ severity: 'error', summary: 'Error', detail: 'Error cargando información.' });
        } finally {
            setLoading(false);
        }
    };

    // --- HELPER: OBTENER ETIQUETA DE ESTATUS ---
    const getStatusLabel = (status: number) => {
        switch (status) {
            case 2: return 'Esperando insumos';
            case 3: return 'En diseño (Con Insumos)';
            case 4: return 'En diseño (Sin Insumos)';
            case 7: return 'En desarrollo';
            case 8: return 'En revisión';
            case 9: return 'Diseño aprobado';
            default: return `Estatus ${status}`;
        }
    };

    // --- HELPER: COLOR DE ESTATUS ---
    const getSeverity = (status: number): "success" | "info" | "warning" | "danger" | null => {
        if (status === 7) return 'info';
        if (status === 8) return 'warning';
        if (status === 9) return 'success';
        if (status === 10) return 'danger';
        if (status === 2) return 'warning';
        if (status === 3 || status === 4) return 'info';
        return null;
    };


    // --- ACCIÓN 2: ENVIAR A REVISIÓN (De 7 -> 8) ---
    const sendToReview = async () => {
        if (!uploadedFile || isSubmitting) {
            toast.current?.show({
                severity: 'warn',
                summary: 'Falta archivo',
                detail: 'Selecciona un archivo de diseño antes de enviarlo a revisión.'
            });
            return;
        }

        const currentUserId = JSON.parse(
            localStorage.getItem('user') || '{}'
        ).idUsuario;

        if (!currentUserId) {
            toast.current?.show({
                severity: 'error',
                summary: 'Error',
                detail: 'No se encontró el usuario actual.'
            });
            return;
        }

        setIsSubmitting(true);

        try {
            await OrderService.subirArchivo(
                Number(orderId),
                uploadedFile
            );

            await OrderService.avanzarEstatus(Number(orderId), {
                idUsuario: currentUserId,
                idEstatusDestino: 8
            });

            setUploadedFile(null);
            fileUploadRef.current?.clear();

            toast.current?.show({
                severity: 'success',
                summary: 'Diseño enviado',
                detail: 'El diseño se envió a revisión del cliente.'
            });

            await loadInitialData(Number(orderId));
        } catch (error) {
            console.error('Error enviando diseño', error);

            toast.current?.show({
                severity: 'error',
                summary: 'Error',
                detail: 'No se pudo completar el envío a revisión.'
            });

            await loadInitialData(Number(orderId));
        } finally {
            setIsSubmitting(false);
        }
    };

    // --- ACCIÓN 3: REGISTRAR DECISIÓN (De 8 -> 9 ó 10) ---
    const registerDecision = async (approved: boolean) => {
        if (isSubmitting) return;

        const currentUserId = JSON.parse(
            localStorage.getItem('user') || '{}'
        ).idUsuario;

        if (!currentUserId) {
            toast.current?.show({
                severity: 'error',
                summary: 'Error',
                detail: 'No se encontró el usuario actual.'
            });
            return;
        }

        setIsSubmitting(true);

        try {
            if (approved) {
                await OrderService.avanzarEstatus(Number(orderId), {
                    idUsuario: currentUserId,
                    idEstatusDestino: 9,
                    clienteAprobo: true
                });

                toast.current?.show({
                    severity: 'success',
                    summary: 'Diseño aprobado',
                    detail: 'El diseño fue enviado al taller.'
                });

                await loadInitialData(Number(orderId));
                setTimeout(() => router.push('/designerlist'), 1500);
            } else {
                await OrderService.avanzarEstatus(Number(orderId), {
                    idUsuario: currentUserId,
                    idEstatusDestino: 10,
                    clienteAprobo: false
                });

                await OrderService.avanzarEstatus(Number(orderId), {
                    idUsuario: currentUserId,
                    idEstatusDestino: 7
                });

                setUploadedFile(null);
                fileUploadRef.current?.clear();

                toast.current?.show({
                    severity: 'warn',
                    summary: 'Diseño rechazado',
                    detail: 'La orden regresó a desarrollo para realizar correcciones.'
                });

                await loadInitialData(Number(orderId));
            }
        } catch (error) {
            console.error('Error registrando decisión', error);

            toast.current?.show({
                severity: 'error',
                summary: 'Error',
                detail: 'No se pudo completar la transición de estado. Verifica el estado actual de la orden.'
            });

            await loadInitialData(Number(orderId));
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDownloadDesign = () => {
        downloadDesignFile({
            imageUrl,
            rutaArchivo: orderData?.rutaArchivo,
            fallbackFilename: `referencia-orden-${orderId}`,
            toastRef: toast
        });
    };

    // --- RENDERIZADO DEL ÁREA DE ACCIÓN ---
    // 1. Componente para Estatus 2 (Bloqueado)
    const renderBlockedCard = () => (
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

    // 2. Componente para Estatus 7, 3, 4 (Desarrollo)
    const renderDevelopmentCard = ({
        uploadedFile,
        setUploadedFile,
        sendToReview,
        isSubmitting,
        fileUploadRef
    }: any) => {

        const handleClearFile = () => {
            setUploadedFile(null);
            fileUploadRef.current?.clear();
        };

        return (
            <Card title="Entrega del diseño" className="shadow-2">
                <p className="text-600 mb-2 text-sm">Sube el archivo de diseño para enviarlo a revisión del cliente.</p>
                <div className="grid">
                    <div className="col-12 md:col-6 flex flex-column gap-3">
                        <div className="border-1 border-round surface-border p-3 bg-50 text-center">
                            <FileUpload
                                ref={fileUploadRef}
                                mode="basic"
                                name="demo[]"
                                accept="image/*,application/pdf"
                                maxFileSize={50000000}
                                chooseLabel={uploadedFile ? "Cambiar Archivo" : "Seleccionar archivo"}
                                className={`w-full ${uploadedFile ? 'p-button-outlined p-button-info' : 'p-button-outlined p-button-secondary'}`}
                                customUpload
                                auto={false}
                                uploadHandler={() => { }}
                                onSelect={(e) => {
                                    if (e.files?.[0]) {
                                        setUploadedFile(e.files[0]);
                                    }
                                }}
                                onClear={() => setUploadedFile(null)}
                            />

                            {uploadedFile && (
                                <div className="flex align-items-center justify-content-between mt-2 p-2 bg-blue-50 border-round border-1 border-blue-200">
                                    <span className="text-sm font-medium text-blue-900 truncate max-w-15rem">
                                        <i className="pi pi-file mr-2"></i>
                                        {uploadedFile.name}
                                    </span>
                                    <Button
                                        type="button"
                                        icon="pi pi-times"
                                        className="p-button-rounded p-button-danger p-button-text p-button-sm"
                                        tooltip="Quitar archivo"
                                        onClick={handleClearFile}
                                    />
                                </div>
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
                            disabled={!uploadedFile || isSubmitting}
                        />
                    </div>
                </div>
            </Card>
        );
    };

    // 4. Componente para Estatus 8 (Revisión)
    const renderReviewCard = ({
        registerDecision,
        isSubmitting,
    }: any) => (
        <Card title="Respuesta del cliente" className="mb-4 shadow-2 border-left-3 border-orange-500">
            <div className="text-center mb-4">
                <span className="text-xl font-bold text-700">Después de la revisión del cliente. ¿Cuál fue su respuesta?</span>
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
                        disabled={isSubmitting}
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
                        disabled={isSubmitting}
                    />
                </div>
            </div>
        </Card>
    );

    // 5. Componente para Estatus 9 (Aprobado)
    const renderApprovedCard = () => (
        <Card className="mb-4 shadow-2 bg-green-50 border-left-3 border-green-500">
            <div className="flex flex-column align-items-center justify-content-center text-center">
                <i className="pi pi-check-circle text-5xl text-green-600 mb-3"></i>
                <h2 className="text-green-800 m-0 mb-2">Diseño aprobado</h2>
                <p className="text-green-700 mb-4">
                    El cliente aprobó el diseño. La orden está en el taller.
                </p>
                <Link href="/designerlist">
                    <Button
                        label="Volver a la Lista"
                        icon="pi pi-arrow-left"
                        severity="success"
                        text
                    />
                </Link>
            </div>
        </Card>
    );

    const renderActionArea = () => {
        const estatus = Number(orderData.idEstatusActual);
        switch (estatus) {
            case 2:
                return renderBlockedCard();

            case 3:
            case 4:
            case 7:
            case 10:
                return renderDevelopmentCard({
                    uploadedFile,
                    setUploadedFile,
                    sendToReview,
                    isSubmitting,
                    fileUploadRef
                });

            case 8:
                return renderReviewCard({
                    registerDecision,
                    isSubmitting
                });

            case 9:
                return renderApprovedCard();

            default:
                return null;
        }
    };

    const renderMedidas = (rowData: any) => (
        <span className="text-blue-600 font-bold">
            <i className="pi pi-arrows-h mr-1 text-sm"></i>
            {rowData.medidas}
        </span>
    );

    const renderCantidad = (rowData: any) => (
        <div className="flex flex-column align-items-center">
            <span className="font-bold text-lg text-900">{rowData.cantidad}</span>
        </div>
    );

    return (
        <div className="grid justify-content-center">
            <Toast ref={toast} />

            {loading || !orderData ? (
                <div className="flex justify-content-center h-screen align-items-center">
                    <i className="pi pi-spin pi-spinner text-4xl"></i>
                </div>
            ) : (
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
                                    <Tag
                                        severity={getSeverity(Number(orderData.idEstatusActual))}
                                        value={getStatusLabel(Number(orderData.idEstatusActual))}
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* BARRA DE PROGRESO */}
                    <div className="card mb-4 shadow-1 py-4">
                        <Steps model={stepsItems} activeIndex={activeIndex} readOnly={true} className="w-full" />
                    </div>

                    {/* DETALLES */}
                    <Card title="Detalles del diseño" className="mb-4 shadow-2">
                        <div className="grid">
                            <div className="col-12 md:col-7 flex flex-column gap-3">
                                <div className="p-2 border-1 surface-border border-round bg-50">
                                    <h3 className="text-lg font-bold m-0 mb-2 p-2 text-700">Especificaciones</h3>
                                    <DataTable value={orderItems} size="small" responsiveLayout="scroll" className="p-datatable-sm" emptyMessage="Sin productos">
                                        <Column
                                            field="cantidad"
                                            header="Cant."
                                            style={{ width: '20%' }}
                                            body={renderCantidad}
                                            className="text-center"
                                        />
                                        <Column field="nombreProducto" header="Producto" style={{ width: '40%' }}></Column>
                                        <Column
                                            field="medidas"
                                            header="Medidas"
                                            style={{ width: '40%' }}
                                            body={renderMedidas}
                                        />
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
                                        <label className="text-sm font-bold text-600 block mb-1">Comentarios / Notas de diseño</label>
                                        <div className="p-3 bg-50 border-1 border-yellow-100 border-round text-700 font-italic">
                                            {orderData.notasDiseno || orderData.comentarios || 'Sin notas de diseño.'}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="col-12 md:col-5 flex flex-column pl-0 md:pl-4 mt-4 md:mt-0 border-top-1 md:border-top-none md:border-left-1 surface-border">
                                <label className="font-bold block mb-2 w-full text-center text-600">Referencia inicial</label>
                                <div className="flex align-items-center justify-content-center w-full p-2 surface-50 border-round-xl border-1 border-dashed surface-border relative" style={{ minHeight: '300px' }}>
                                    {imageUrl && !imageError ? (
                                        <Image src={imageUrl} alt="Referencia" width="100%" preview className="shadow-2 border-round w-full block" imageStyle={{ width: '100%', height: 'auto', maxHeight: '350px', objectFit: 'contain' }} onError={() => setImageError(true)} />
                                    ) : (
                                        <div className="flex flex-column align-items-center justify-content-center text-gray-400"><i className="pi pi-image text-5xl mb-2"></i><span className="text-sm text-center px-4">{imageError ? "Archivo no encontrado" : "Sin archivo"}</span></div>
                                    )}
                                </div>
                                {imageUrl && (
                                    <div className="mt-3 text-center">
                                        <Button
                                            type="button"
                                            label="Descargar referencia"
                                            icon="pi pi-download"
                                            className="p-button-sm p-button-outlined p-button-secondary"
                                            onClick={handleDownloadDesign}
                                        />
                                    </div>
                                )}
                            </div>
                        </div>
                    </Card>
                    {renderActionArea()}
                </div >
            )
            }
        </div >
    );
};

export default DesignerOrderDetailPage;