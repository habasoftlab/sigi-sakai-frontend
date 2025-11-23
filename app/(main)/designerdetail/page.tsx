'use client';
import React, { useState, useRef, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { Card } from 'primereact/card';
import { Button } from 'primereact/button';
import { RadioButton } from 'primereact/radiobutton';
import { FileUpload } from 'primereact/fileupload';
import { Toast } from 'primereact/toast';
import { InputText } from 'primereact/inputtext';
import { Image } from 'primereact/image';
import Link from 'next/link';

// Importamos datos simulados
import { dummyOrders, dummyClients } from '@/app/api/mockData';

const DesignerOrderDetailPage = () => {
    const searchParams = useSearchParams();
    const orderId = searchParams.get('id');
    const toast = useRef<Toast>(null);

    // --- ESTADOS ---
    const [orderData, setOrderData] = useState<any>(null);
    const [clientData, setClientData] = useState<any>(null);
    const [designStatus, setDesignStatus] = useState<string>('');
    const [uploadedFile, setUploadedFile] = useState<any>(null);

    // --- CARGAR DATOS ---
    useEffect(() => {
        if (orderId) {
            const order = dummyOrders.find(o => o.id === orderId);
            if (order) {
                setOrderData(order);
                const client = dummyClients.find(c => c.name === order.cliente);
                setClientData(client);
            }
        }
    }, [orderId]);

    // --- HANDLERS ---
    const onUpload = (event: any) => {
        setUploadedFile(event.files[0]);
        toast.current?.show({ severity: 'info', summary: 'Éxito', detail: 'Captura subida correctamente', life: 3000 });
    };

    const handleSendToPrint = () => {
        if (designStatus !== 'accepted') {
            toast.current?.show({ severity: 'error', summary: 'Error', detail: 'El cliente debe aceptar el diseño antes de imprimir.', life: 3000 });
            return;
        }
        if (!uploadedFile) {
            toast.current?.show({ severity: 'warn', summary: 'Advertencia', detail: 'Se recomienda subir una captura de prueba.', life: 3000 });
        }

        toast.current?.show({ severity: 'success', summary: 'Enviado', detail: `La orden ${orderId} ha sido enviada a impresión.`, life: 3000 });
    };

    if (!orderData) {
        return <div className="card">Cargando información de la orden...</div>;
    }

    const mockProductDetail = {
        descripcion: 'Tarjetas de presentación (couché 300g)',
        dimensiones: '9x5 cm',
        formato: 'Horizontal / PDF'
    };

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
                        <h1 className="m-0 text-3xl font-bold">Orden N° {orderId}</h1>
                    </div>
                </div>

                {/* --- SECCIÓN 1: DETALLE DE LA ORDEN (NUEVO LAYOUT) --- */}
                <Card title="Detalle de la orden" className="mb-4 shadow-2">
                    <div className="grid">

                        {/* COLUMNA IZQUIERDA: Todos los detalles (md:col-6) */}
                        <div className="col-12 md:col-6 p-fluid flex flex-column gap-3">
                            <div className="field">
                                <label className="font-bold block mb-2">Descripción del producto</label>
                                <InputText value={mockProductDetail.descripcion} readOnly className="bg-gray-50" />
                            </div>
                            <div className="field">
                                <label className="font-bold block mb-2">Nombre del cliente</label>
                                <InputText value={orderData.cliente} readOnly className="bg-gray-50" />
                            </div>
                            <div className="field">
                                <label className="font-bold block mb-2">Teléfono del cliente</label>
                                <div className="p-inputgroup">
                                    <span className="p-inputgroup-addon"><i className="pi pi-phone"></i></span>
                                    <InputText value={clientData?.phone || 'No registrado'} readOnly className="bg-gray-50" />
                                </div>
                            </div>
                            <div className="field">
                                <label className="font-bold block mb-2">Dimensiones a considerar</label>
                                <InputText value={mockProductDetail.dimensiones} readOnly className="bg-gray-50" />
                            </div>
                            <div className="field">
                                <label className="font-bold block mb-2">Formato/Tamaño</label>
                                <InputText value={mockProductDetail.formato} readOnly className="bg-gray-50" />
                            </div>
                        </div>

                        {/* COLUMNA DERECHA: Imagen Grande (md:col-6) */}
                        <div className="col-12 md:col-6 flex flex-column align-items-center justify-content-center pl-4 border-left-1 surface-border">
                            <label className="font-bold block mb-3 w-full text-center text-xl text-600">Imagen</label>
                            <div className="flex align-items-center justify-content-center w-full h-full p-3 surface-50 border-round-xl">
                                {orderData.imageUrl ? (
                                    <Image
                                        src={orderData.imageUrl}
                                        alt="Referencia de orden"
                                        width="100%"
                                        preview
                                        className="shadow-4 border-round w-full block"
                                        imageStyle={{ width: '100%', objectFit: 'contain', maxHeight: '400px' }}
                                    />
                                ) : (
                                    <div className="flex flex-column align-items-center justify-content-center text-gray-400" style={{ minHeight: '300px' }}>
                                        <i className="pi pi-image text-6xl mb-3"></i>
                                        <span className="text-xl">Sin imagen de referencia</span>
                                    </div>
                                )}
                            </div>
                        </div>

                    </div>
                </Card>

                {/* --- SECCIÓN 2: CONFIRMACIÓN --- */}
                <Card title="Confirmación de envío al cliente" className="mb-4 shadow-2">
                    <p className="text-600 mb-4">
                        Una vez que el diseño esté listo, ponte en contacto con el cliente y sube una captura de pantalla de prueba.
                    </p>

                    <div className="grid">
                        <div className="col-12 md:col-6 flex flex-column gap-3">
                            <div className="field-radiobutton">
                                <RadioButton inputId="accepted" name="design" value="accepted" onChange={(e) => setDesignStatus(e.value)} checked={designStatus === 'accepted'} />
                                <label htmlFor="accepted" className="ml-2 font-medium text-green-600">Cliente aceptó el diseño</label>
                            </div>
                            <div className="field-radiobutton">
                                <RadioButton inputId="rejected" name="design" value="rejected" onChange={(e) => setDesignStatus(e.value)} checked={designStatus === 'rejected'} />
                                <label htmlFor="rejected" className="ml-2 font-medium text-red-600">Cliente no aceptó el diseño</label>
                            </div>
                        </div>

                        <div className="col-12 md:col-6">
                            <div className="text-center border-1 surface-border border-round p-4 bg-gray-50">
                                <i className="pi pi-image text-4xl text-gray-400 mb-3"></i>
                                <p className="m-0 font-semibold mb-3">Escoge la captura a subir</p>
                                <FileUpload
                                    mode="basic"
                                    name="demo[]"
                                    url="/api/upload"
                                    accept="image/*"
                                    maxFileSize={1000000}
                                    onSelect={onUpload}
                                    chooseLabel="Subir Imagen"
                                    className="p-button-outlined p-button-secondary"
                                />
                                {uploadedFile && <small className="block mt-2 text-green-600">Archivo seleccionado: {uploadedFile.name}</small>}
                            </div>
                        </div>
                    </div>
                </Card>

                {/* --- SECCIÓN 3: BOTÓN --- */}
                <Card className="shadow-2 surface-50">
                    <div className="flex flex-column md:flex-row align-items-center justify-content-between gap-3">
                        <div className="flex align-items-center gap-2 text-700">
                            <i className="pi pi-info-circle text-xl"></i>
                            <span>Envía únicamente cuando el cliente haya confirmado.</span>
                        </div>
                        <Button
                            label="Enviar a impresión"
                            icon="pi pi-print"
                            className="p-button-lg"
                            severity="success"
                            onClick={handleSendToPrint}
                            disabled={designStatus !== 'accepted'}
                        />
                    </div>
                </Card>

            </div>
        </div>
    );
};

export default DesignerOrderDetailPage;