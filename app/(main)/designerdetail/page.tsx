/* eslint-disable @next/next/no-img-element */
'use client';
import React, { useState, useRef, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Card } from 'primereact/card';
import { Button } from 'primereact/button';
import { RadioButton } from 'primereact/radiobutton';
import { FileUpload, FileUploadSelectEvent } from 'primereact/fileupload';
import { Toast } from 'primereact/toast';
import { Image } from 'primereact/image';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import Link from 'next/link';
import { Tag } from 'primereact/tag';

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

    // Estado para la URL de la imagen
    const [imageUrl, setImageUrl] = useState<string | null>(null);
    const [imageError, setImageError] = useState(false); // Nuevo estado

    const [loading, setLoading] = useState(true);
    const [statuses, setStatuses] = useState<any[]>([]);

    const [designStatus, setDesignStatus] = useState<string>('');
    const [uploadedFile, setUploadedFile] = useState<File | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        if (orderId) {
            loadInitialData(Number(orderId));
        }
    }, [orderId]);

    useEffect(() => {
        setImageError(false);
    }, [orderId]);

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
            const [order, estatusList, allProducts, historial] = await Promise.all([
                OrderService.getOrdenById(id),
                OrderService.getEstatusOperaciones(),
                CatalogService.getAllProductos(),
                OrderService.getHistorial(id)
            ]);
            setStatuses(estatusList);
            const statusPagada = estatusList.find((s: any) => s.clave === 'COT_PAGADA')?.idEstatus;
            const statusConInsumos = estatusList.find((s: any) => s.clave === 'ORD_EN_DISENO_CON_INSUMOS')?.idEstatus;
            const statusSinInsumos = estatusList.find((s: any) => s.clave === 'ORD_EN_DISENO_SIN_INSUMOS')?.idEstatus;
            const statusEnProceso = estatusList.find((s: any) => s.clave === 'DIS_EN_PROCESO')?.idEstatus;
            const yaEstuvoEnProceso = historial.some((h: any) => h.claveEstatus === 'DIS_EN_PROCESO');
            const esEstatusPrevio = [statusPagada, statusConInsumos, statusSinInsumos].includes(order.idEstatusActual);
            let ordenActualizada = { ...order };

            if (statusEnProceso && esEstatusPrevio && !yaEstuvoEnProceso) {
                try {
                    const userStr = localStorage.getItem('user');
                    const userObj = userStr ? JSON.parse(userStr) : {};
                    const currentUserId = userObj.idUsuario || userObj.id;
                    if (currentUserId) {
                        await OrderService.avanzarEstatus(id, {
                            idUsuario: currentUserId,
                            idEstatusDestino: statusEnProceso
                        });
                        ordenActualizada.idEstatusActual = statusEnProceso;
                        toast.current?.show({ severity: 'info', summary: 'Diseño Iniciado', detail: 'Orden marcada "En Desarrollo".', life: 4000 });
                    }
                } catch (err) { console.error("Error auto-avance", err); }
            }
            setOrderData(ordenActualizada);
            if (order.detalles && order.detalles.length > 0) {
                const productMap = new Map();
                allProducts.forEach((p: any) => {
                    const pId = String(p.idProducto || p.id);
                    productMap.set(pId, p);
                });
                const enrichedItems = order.detalles.map((detalle: any) => {
                    const productInfo = productMap.get(String(detalle.idProducto));
                    const nombreReal = productInfo?.descripcion || productInfo?.nombre || `Producto #${detalle.idProducto}`;
                    const medidasReales = productInfo?.formatoTamano || productInfo?.medidas || 'Estándar';
                    const unidadVentaReal = productInfo?.unidadVenta || 'Unidad';
                    return {
                        ...detalle,
                        nombreProducto: nombreReal,
                        medidas: medidasReales,
                        unidadVenta: unidadVentaReal
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

    const onFileSelect = (event: FileUploadSelectEvent) => {
        if (event.files && event.files.length > 0) {
            setUploadedFile(event.files[0]);
            toast.current?.show({ severity: 'info', summary: 'Archivo seleccionado', detail: 'Listo para subir.', life: 2000 });
        }
    };

    const handleProcessOrder = async () => {
        if (!designStatus) {
            toast.current?.show({ severity: 'warn', summary: 'Atención', detail: 'Debes indicar si el cliente aceptó o rechazó.', life: 3000 });
            return;
        }
        if (designStatus === 'accepted') {
            const tieneArchivoNuevo = uploadedFile !== null;
            const tieneArchivoPrevio = orderData.rutaArchivo && orderData.rutaArchivo !== 'Pendiente';
            if (!tieneArchivoNuevo && !tieneArchivoPrevio) {
                toast.current?.show({
                    severity: 'error',
                    summary: 'Archivo Requerido',
                    detail: 'Para aprobar, debes subir el diseño final o asegurar que ya exista uno.',
                    life: 5000
                });
                return;
            }
        }

        setIsSubmitting(true);
        try {
            const currentUserId = JSON.parse(localStorage.getItem('user') || '{}').idUsuario;
            if (uploadedFile) {
                await OrderService.subirArchivo(Number(orderId), uploadedFile);
            }
            let nuevoEstatusId = 0;
            let clienteAprobo = false;
            if (designStatus === 'accepted') {
                const statusObj = statuses.find(s => s.clave === 'ORD_EN_IMPRESION');
                nuevoEstatusId = statusObj ? statusObj.idEstatus : 5;
                clienteAprobo = true;
            } else {
                const statusObj = statuses.find(s => s.clave === 'DIS_DISENO_RECHAZADO');
                nuevoEstatusId = statusObj ? statusObj.idEstatus : 10;
                clienteAprobo = false;
            }
            await OrderService.avanzarEstatus(Number(orderId), {
                idUsuario: currentUserId,
                idEstatusDestino: nuevoEstatusId,
                clienteAprobo: clienteAprobo
            });
            toast.current?.show({ severity: 'success', summary: 'Éxito', detail: 'Orden procesada correctamente.', life: 3000 });

            setTimeout(() => {
                router.push('/designerlist');
            }, 1500);
        } catch (error: any) {
            console.error("Error procesando:", error);
            toast.current?.show({ severity: 'error', summary: 'Error', detail: 'No se pudo procesar la orden.' });
        } finally {
            setIsSubmitting(false);
        }
    };

    if (loading || !orderData) {
        return (
            <div className="flex align-items-center justify-content-center h-screen">
                <i className="pi pi-spin pi-spinner text-4xl mr-3"></i>
                <span className="text-xl">Cargando orden...</span>
            </div>
        );
    }

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
                                <Tag severity={orderData.idEstatusActual === 7 ? 'info' : 'warning'} value={orderData.idEstatusActual === 7 ? 'En Proceso de Diseño' : 'Estado Inicial'} />
                            </div>
                        </div>
                    </div>
                </div>

                {/* DETALLES */}
                <Card title="Detalles del Trabajo" className="mb-4 shadow-2">
                    <div className="grid">
                        {/* COLUMNA IZQUIERDA: TABLA Y DATOS (7/12 del ancho) */}
                        <div className="col-12 md:col-7 flex flex-column gap-3">
                            <div className="p-2 border-1 surface-border border-round bg-gray-50">
                                <h3 className="text-lg font-bold m-0 mb-2 p-2 text-700">Especificaciones</h3>
                                <DataTable
                                    value={orderItems}
                                    size="small"
                                    responsiveLayout="scroll"
                                    className="p-datatable-sm"
                                    emptyMessage="Sin productos"
                                >
                                    <Column
                                        field="cantidad"
                                        header="Cant."
                                        style={{ width: '20%' }}
                                        body={(rowData) => {
                                            const isM2 = rowData.unidadVenta?.toLowerCase().includes('m²');
                                            return (
                                                <div className="flex flex-column align-items-center">
                                                    <span className="font-bold text-lg text-900">{rowData.cantidad}</span>
                                                    <span className="text-xs text-500 font-semibold bg-white px-2 py-1 border-round border-1 border-200 mt-1">
                                                        {isM2 ? 'Metros²' : 'Piezas'}
                                                    </span>
                                                </div>
                                            );
                                        }}
                                        className="text-center"
                                    ></Column>
                                    <Column field="nombreProducto" header="Producto" style={{ width: '40%' }}></Column>
                                    <Column
                                        field="medidas"
                                        header="Medidas"
                                        style={{ width: '40%' }}
                                        body={(rowData) => (
                                            <div className="flex flex-column">
                                                <span className="text-blue-600 font-bold">
                                                    <i className="pi pi-arrows-h mr-1 text-sm"></i>
                                                    {rowData.medidas}
                                                </span>
                                            </div>
                                        )}
                                    ></Column>
                                </DataTable>
                            </div>

                            {/* DATOS CLIENTE */}
                            <div className="grid mt-2">
                                <div className="col-12 md:col-6">
                                    <label className="text-sm font-bold text-600 block mb-1">Cliente</label>
                                    <div className="p-2 surface-100 border-round font-medium text-overflow-ellipsis overflow-hidden white-space-nowrap">
                                        {clientData?.nombre || orderData.clienteNombre || 'Mostrador'}
                                    </div>
                                </div>
                                <div className="col-12 md:col-6">
                                    <label className="text-sm font-bold text-600 block mb-1">Teléfono</label>
                                    <div className="p-2 surface-100 border-round font-medium">
                                        <i className="pi pi-phone text-green-600 mr-2"></i>
                                        {clientData?.telefono || 'N/A'}
                                    </div>
                                </div>
                                <div className="col-12">
                                    <label className="text-sm font-bold text-600 block mb-1">Comentarios</label>
                                    <div className="p-3 bg-yellow-50 border-1 border-yellow-100 border-round text-700 font-italic" style={{ minHeight: '60px' }}>
                                        {orderData.comentarios || 'Sin comentarios'}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* COLUMNA DERECHA: VISUALIZADOR DE IMAGEN (5/12 del ancho) */}
                        <div className="col-12 md:col-5 flex flex-column pl-0 md:pl-4 mt-4 md:mt-0 border-top-1 md:border-top-none md:border-left-1 surface-border">
                            <label className="font-bold block mb-2 w-full text-center text-600">Referencia Inicial</label>
                            <div className="flex align-items-center justify-content-center w-full p-2 surface-50 border-round-xl border-1 border-dashed surface-border relative" style={{ minHeight: '300px' }}>
                                {imageUrl && !imageError ? (
                                    <Image
                                        src={imageUrl}
                                        alt="Referencia"
                                        width="100%"
                                        preview
                                        className="shadow-2 border-round w-full block"
                                        imageStyle={{ width: '100%', height: 'auto', maxHeight: '350px', objectFit: 'contain' }}
                                        onError={(e) => {
                                            console.warn("La imagen no existe o falló la carga");
                                            setImageError(true);
                                        }}
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

                            {/* Link externo si existe archivo */}
                            {orderData.rutaArchivo && orderData.rutaArchivo !== 'Pendiente' && (
                                <div className="mt-3 text-center">
                                    <div className="text-xs text-gray-500 mb-1 overflow-hidden text-overflow-ellipsis px-2" title={orderData.rutaArchivo}>
                                        {orderData.rutaArchivo}
                                    </div>
                                    <a href={imageUrl!} target="_blank" rel="noopener noreferrer" className="p-button p-button-sm p-button-outlined p-button-secondary text-xs no-underline">
                                        <i className="pi pi-external-link mr-2"></i>
                                        Abrir en pestaña nueva
                                    </a>
                                </div>
                            )}
                        </div>
                    </div>
                </Card>

                {/* AREA DE SUBIDA Y APROBACION */}
                <Card title="Entrega de Diseño" className="mb-4 shadow-2">
                    <p className="text-600 mb-4 text-sm">
                        Contacta al cliente para revisión. Si el diseño es aprobado, sube el archivo final para enviar a producción.
                    </p>
                    <div className="grid">
                        <div className="col-12 md:col-6 flex flex-column gap-3">
                            <label className="font-bold text-lg">Respuesta del cliente:</label>
                            <div className={`field-radiobutton p-3 border-1 border-round transition-colors ${designStatus === 'accepted' ? 'surface-100 border-green-500' : 'surface-border'}`}>
                                <RadioButton inputId="accepted" name="design" value="accepted" onChange={(e) => setDesignStatus(e.value)} checked={designStatus === 'accepted'} />
                                <label htmlFor="accepted" className="ml-2 font-medium text-green-700 cursor-pointer w-full">
                                    <i className="pi pi-check-circle mr-2"></i>
                                    Aprobado (Enviar a Taller)
                                </label>
                            </div>
                            <div className={`field-radiobutton p-3 border-1 border-round transition-colors ${designStatus === 'rejected' ? 'surface-100 border-red-500' : 'surface-border'}`}>
                                <RadioButton inputId="rejected" name="design" value="rejected" onChange={(e) => setDesignStatus(e.value)} checked={designStatus === 'rejected'} />
                                <label htmlFor="rejected" className="ml-2 font-medium text-red-700 cursor-pointer w-full">
                                    <i className="pi pi-times-circle mr-2"></i>
                                    Rechazado (Requiere cambios)
                                </label>
                            </div>
                        </div>
                        <div className="col-12 md:col-6">
                            <div className={`h-full flex flex-column align-items-center justify-content-center text-center border-1 border-round p-4 transition-colors ${designStatus === 'accepted' ? 'surface-0 border-green-500 bg-green-50' : 'surface-border bg-gray-50'}`}>
                                <i className="pi pi-cloud-upload text-4xl text-600 mb-3"></i>
                                <p className="m-0 font-semibold mb-3">Subir Diseño Final / Prueba</p>
                                <FileUpload
                                    mode="basic"
                                    name="file"
                                    accept="image/*,application/pdf"
                                    maxFileSize={50000000} // 50MB
                                    chooseLabel={uploadedFile ? "Cambiar Archivo" : "Seleccionar Archivo"}
                                    className={`p-button-outlined ${uploadedFile ? 'p-button-success' : 'p-button-secondary'}`}
                                    auto={false}
                                    onSelect={onFileSelect}
                                />
                                {uploadedFile && (
                                    <div className="mt-2 text-green-700 font-bold text-sm">
                                        <i className="pi pi-file mr-1"></i>
                                        Listo para subir: {uploadedFile.name}
                                    </div>
                                )}
                                {!uploadedFile && designStatus === 'accepted' && !imageUrl && (
                                    <small className="block mt-2 text-red-500 font-bold animate-pulse">
                                        ⚠️ Requerido: Sube el archivo final.
                                    </small>
                                )}
                            </div>
                        </div>
                    </div>
                </Card>

                {/* BOTÓN DE ACCIÓN */}
                <Card className="shadow-2 surface-50">
                    <div className="flex flex-column md:flex-row align-items-center justify-content-between gap-3">
                        <div className="flex align-items-center gap-2 text-700">
                            <i className="pi pi-info-circle text-xl"></i>
                            <span>Esta acción actualizará el estatus de la orden irreversiblemente.</span>
                        </div>
                        <Button
                            label={designStatus === 'rejected' ? "Solicitar Correcciones" : "Enviar a Impresión"}
                            icon={designStatus === 'rejected' ? "pi pi-replay" : "pi pi-print"}
                            className="p-button-lg"
                            severity={designStatus === 'rejected' ? "danger" : "success"}
                            onClick={handleProcessOrder}
                            loading={isSubmitting}
                            disabled={!designStatus}
                        />
                    </div>
                </Card>
            </div >
        </div >
    );
};

export default DesignerOrderDetailPage;