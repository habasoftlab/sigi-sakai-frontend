/* eslint-disable @next/next/no-img-element */
'use client';
import React, { useState, useRef, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Card } from 'primereact/card';
import { Button } from 'primereact/button';
import { RadioButton } from 'primereact/radiobutton';
import { FileUpload } from 'primereact/fileupload';
import { Toast } from 'primereact/toast';
import { InputText } from 'primereact/inputtext';
import { Image } from 'primereact/image';
import Link from 'next/link';

// Servicios
import { OrderService } from '@/app/service/orderService';
import { ClientService } from '@/app/service/clientService';

// URL Base
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/api';

const DesignerOrderDetailPage = () => {
    const searchParams = useSearchParams();
    const orderId = searchParams.get('id');
    const router = useRouter();
    const toast = useRef<Toast>(null);

    // --- ESTADOS ---
    const [orderData, setOrderData] = useState<any>(null);
    const [clientData, setClientData] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    
    // Estado para el catálogo de estatus
    const [statuses, setStatuses] = useState<any[]>([]);

    // Estados de lógica
    const [designStatus, setDesignStatus] = useState<string>(''); // 'accepted' | 'rejected'
    const [uploadedFile, setUploadedFile] = useState<File | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // --- CARGAR DATOS ---
    useEffect(() => {
        if (orderId) {
            loadInitialData(Number(orderId));
        }
    }, [orderId]);

    const loadInitialData = async (id: number) => {
        setLoading(true);
        try {
            // 1. Cargar Orden, Cliente y Catálogo de Estatus en paralelo
            const [order, estatusList] = await Promise.all([
                OrderService.getOrdenById(id),
                OrderService.getEstatusOperaciones()
            ]);

            setOrderData(order);
            setStatuses(estatusList);

            // 2. Cargar Cliente si existe
            if (order.idCliente) {
                const client = await ClientService.getById(order.idCliente);
                setClientData(client);
            }
        } catch (error) {
            console.error("Error cargando datos", error);
            toast.current?.show({ severity: 'error', summary: 'Error', detail: 'No se pudo cargar la información.' });
        } finally {
            setLoading(false);
        }
    };

    // --- HELPER IMAGEN ---
    const getImageUrl = (filename: string | null) => {
        if (!filename || filename === 'Pendiente') return null;
        return `${API_URL}/uploads/files/${filename}`;
    };

    // --- HANDLERS ---
    const onFileSelect = (event: any) => {
        if (event.files && event.files.length > 0) {
            setUploadedFile(event.files[0]);
            toast.current?.show({ severity: 'info', summary: 'Archivo seleccionado', detail: 'Listo para subir al confirmar.', life: 2000 });
        }
    };

    const handleProcessOrder = async () => {
        if (!designStatus) {
            toast.current?.show({ severity: 'warn', summary: 'Atención', detail: 'Debes indicar si el cliente aceptó o rechazó.', life: 3000 });
            return;
        }

        setIsSubmitting(true);
        try {
            const currentUserId = JSON.parse(localStorage.getItem('user') || '{}').idUsuario;

            // 1. Subir archivo si existe
            if (uploadedFile) {
                await OrderService.subirArchivo(Number(orderId), uploadedFile);
            } else if (designStatus === 'accepted' && !orderData.rutaArchivo) {
                console.warn("Aprobando sin archivo de diseño.");
            }

            // 2. Determinar Estatus usando el Catálogo (Por Clave)
            let nuevoEstatus = 0;
            let mensajeExito = "";

            if (designStatus === 'accepted') {
                // Buscamos el ID correspondiente a 'ORD_EN_IMPRESION' (Orden en etapa de taller / impresión)
                const statusObj = statuses.find(s => s.clave === 'ORD_EN_IMPRESION');
                nuevoEstatus = statusObj ? statusObj.idEstatus : 5; // Fallback a 5 si no se encuentra
                
                mensajeExito = "Diseño aprobado. Enviado a impresión.";
            } else {
                // Buscamos el ID correspondiente a 'DIS_DISENO_RECHAZADO'
                const statusObj = statuses.find(s => s.clave === 'DIS_DISENO_RECHAZADO');
                nuevoEstatus = statusObj ? statusObj.idEstatus : 10; // Fallback a 10
                
                mensajeExito = "Orden marcada como rechazada. Requiere corrección.";
            }

            // 3. Enviar actualización
            await OrderService.avanzarEstatus(Number(orderId), { 
                idUsuario: currentUserId,
                idEstatusDestino: nuevoEstatus,
                clienteAprobo: designStatus === 'accepted' // Opcional, para redundancia semántica
            });

            toast.current?.show({ severity: 'success', summary: 'Procesado', detail: mensajeExito, life: 3000 });

            setTimeout(() => {
                router.push('/designerlist');
            }, 1500);

        } catch (error) {
            console.error(error);
            toast.current?.show({ severity: 'error', summary: 'Error', detail: 'Ocurrió un error al procesar la orden.' });
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

    const descripcionProductos = orderData.detalles?.map((d: any) => 
        `${d.cantidad}x ${d.productoNombre || 'Producto'}`
    ).join(', ') || 'Sin detalles';

    const imageUrl = getImageUrl(orderData.rutaArchivo);

    return (
        <div className="grid justify-content-center">
            <Toast ref={toast} />

            <div className="col-12 md:col-10 lg:col-8">
                {/* --- CABECERA --- */}
                <div className="flex align-items-center justify-content-between mb-4">
                    <div className="flex align-items-center gap-3">
                        <Link href="/designerlist" passHref legacyBehavior>
                            <a className="p-button p-component p-button-text p-button-rounded p-button-icon-only">
                                <i className="pi pi-arrow-left text-xl"></i>
                            </a>
                        </Link>
                        <div>
                            <h1 className="m-0 text-3xl font-bold">Orden N° {orderId}</h1>
                            <span className="text-gray-500">Fecha de entrega: {orderData.fechaEntregaFormal || 'Pendiente'}</span>
                        </div>
                    </div>
                </div>

                {/* --- SECCIÓN 1: DETALLE --- */}
                <Card title="Detalle de la orden" className="mb-4 shadow-2">
                    <div className="grid">
                        <div className="col-12 md:col-6 p-fluid flex flex-column gap-3">
                            <div className="field">
                                <label className="font-bold block mb-2">Productos / Descripción</label>
                                <InputText value={descripcionProductos} readOnly className="bg-gray-50" />
                            </div>
                            <div className="field">
                                <label className="font-bold block mb-2">Nombre del cliente</label>
                                <InputText value={clientData?.nombre || orderData.clienteNombre || 'Cliente Mostrador'} readOnly className="bg-gray-50" />
                            </div>
                            <div className="field">
                                <label className="font-bold block mb-2">Contacto / Teléfono</label>
                                <div className="p-inputgroup">
                                    <span className="p-inputgroup-addon"><i className="pi pi-phone"></i></span>
                                    <InputText value={clientData?.telefono || 'No registrado'} readOnly className="bg-gray-50" />
                                </div>
                            </div>
                            <div className="field">
                                <label className="font-bold block mb-2">Notas / Comentarios</label>
                                <InputText value={orderData.comentarios || 'Sin comentarios adicionales'} readOnly className="bg-gray-50" />
                            </div>
                        </div>

                        <div className="col-12 md:col-6 flex flex-column align-items-center justify-content-center pl-4 border-left-1 surface-border">
                            <label className="font-bold block mb-3 w-full text-center text-xl text-600">Referencia / Archivo Actual</label>
                            <div className="flex align-items-center justify-content-center w-full h-full p-3 surface-50 border-round-xl">
                                {imageUrl ? (
                                    <Image
                                        src={imageUrl}
                                        alt="Referencia"
                                        width="100%"
                                        preview
                                        className="shadow-4 border-round w-full block"
                                        imageStyle={{ width: '100%', objectFit: 'contain', maxHeight: '300px' }}
                                    />
                                ) : (
                                    <div className="flex flex-column align-items-center justify-content-center text-gray-400" style={{ minHeight: '200px' }}>
                                        <i className="pi pi-image text-6xl mb-3"></i>
                                        <span className="text-xl">Sin archivo adjunto</span>
                                    </div>
                                )}
                            </div>
                            {orderData.rutaArchivo && orderData.rutaArchivo !== 'Pendiente' && (
                                <small className="mt-2 text-gray-500 word-break-all text-center">{orderData.rutaArchivo}</small>
                            )}
                        </div>
                    </div>
                </Card>

                {/* --- SECCIÓN 2: GESTIÓN DE DISEÑO --- */}
                <Card title="Gestión y Entrega" className="mb-4 shadow-2">
                    <p className="text-600 mb-4">
                        Contacta al cliente para revisión. Si el diseño es aprobado, sube el archivo final para producción.
                    </p>

                    <div className="grid">
                        <div className="col-12 md:col-6 flex flex-column gap-3">
                            <label className="font-bold text-lg">Estatus de revisión:</label>
                            
                            <div className="field-radiobutton">
                                <RadioButton inputId="accepted" name="design" value="accepted" onChange={(e) => setDesignStatus(e.value)} checked={designStatus === 'accepted'} />
                                <label htmlFor="accepted" className="ml-2 font-medium text-green-600 cursor-pointer">
                                    <i className="pi pi-check-circle mr-2"></i>
                                    Cliente aprobó el diseño
                                </label>
                            </div>
                            <div className="field-radiobutton">
                                <RadioButton inputId="rejected" name="design" value="rejected" onChange={(e) => setDesignStatus(e.value)} checked={designStatus === 'rejected'} />
                                <label htmlFor="rejected" className="ml-2 font-medium text-red-600 cursor-pointer">
                                    <i className="pi pi-times-circle mr-2"></i>
                                    Cliente solicitó cambios (Rechazado)
                                </label>
                            </div>
                        </div>

                        <div className="col-12 md:col-6">
                            <div className={`text-center border-1 border-round p-4 transition-colors transition-duration-300 ${designStatus === 'accepted' ? 'surface-0 border-green-500' : 'surface-border bg-gray-50'}`}>
                                <i className="pi pi-cloud-upload text-4xl text-gray-400 mb-3"></i>
                                <p className="m-0 font-semibold mb-3">Subir Diseño Final / Prueba</p>
                                
                                <FileUpload
                                    mode="basic"
                                    name="demo[]"
                                    accept="image/*,application/pdf"
                                    maxFileSize={50000000}
                                    chooseLabel={uploadedFile ? "Cambiar Archivo" : "Seleccionar Archivo"}
                                    className={`p-button-outlined ${uploadedFile ? 'p-button-success' : 'p-button-secondary'}`}
                                    auto={false}
                                    onSelect={onFileSelect}
                                />
                                {uploadedFile && <div className="mt-2 text-green-600 font-bold text-sm">Listo para subir: {uploadedFile.name}</div>}
                                {!uploadedFile && designStatus === 'accepted' && <small className="block mt-2 text-orange-500">Se recomienda subir el archivo final.</small>}
                            </div>
                        </div>
                    </div>
                </Card>

                {/* --- SECCIÓN 3: BOTÓN DE ACCIÓN --- */}
                <Card className="shadow-2 surface-50">
                    <div className="flex flex-column md:flex-row align-items-center justify-content-between gap-3">
                        <div className="flex align-items-center gap-2 text-700">
                            <i className="pi pi-info-circle text-xl"></i>
                            <span>Esta acción actualizará el estatus de la orden.</span>
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

            </div>
        </div>
    );
};

export default DesignerOrderDetailPage;