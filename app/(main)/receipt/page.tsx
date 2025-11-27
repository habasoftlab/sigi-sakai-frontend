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

import { dummyOrders, allProducts, Product } from '@/app/api/mockData';

const UploadReceiptPage = () => {
    const searchParams = useSearchParams();
    const router = useRouter();
    const orderId = searchParams.get('id');
    const toast = useRef<Toast>(null);

    const [orderData, setOrderData] = useState<any>(null);
    const [productData, setProductData] = useState<Product | null>(null);
    const [uploadedFile, setUploadedFile] = useState<any>(null);
    const [showDelayDialog, setShowDelayDialog] = useState(false);
    const [delayDays, setDelayDays] = useState<number | null>(null);

    useEffect(() => {
        if (orderId) {
            const order = dummyOrders.find(o => o.id === orderId);
            if (order) {
                setOrderData(order);
                let product = allProducts.find(p => p.id === order.mainProductId);
                if (!product) product = allProducts[0];
                setProductData(product);
            }
        }
    }, [orderId]);

    const onUpload = (event: any) => {
        setUploadedFile(event.files[0]);
        toast.current?.show({ severity: 'success', summary: 'Recibo Recibido', detail: 'El comprobante se ha guardado correctamente.', life: 3000 });

        setTimeout(() => {
            router.push('/');
        }, 2000);
    };

    const handleNotifyDelay = () => {
        if (!delayDays) {
            toast.current?.show({ severity: 'warn', summary: 'Faltan datos', detail: 'Ingresa la cantidad de días de retraso.', life: 3000 });
            return;
        }

        console.log(`Notificando retraso de ${delayDays} días para la orden ${orderId}`);
        toast.current?.show({ severity: 'info', summary: 'Notificación Enviada', detail: `Se ha notificado un retraso de ${delayDays} días.`, life: 3000 });
        setShowDelayDialog(false);
    };

    if (!orderData) {
        return <div className="p-4">Cargando información de la orden...</div>;
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
                    <h1 className="m-0 text-3xl font-bold">Orden N° {orderId}</h1>
                </div>
                <Card className="mb-4 shadow-2">
                    <h2 className="text-xl font-bold m-0 mb-3 flex align-items-center">
                        <i className="pi pi-list mr-2 text-blue-500"></i>
                        Detalle de los insumos
                    </h2>

                    <div className="mb-3">
                        <span className="block text-900 font-medium text-lg">{productData?.name}</span>
                        <span className="block text-500">{productData?.format}</span>
                    </div>

                    <div className="surface-100 p-3 border-round">
                        <div className="font-bold mb-2">Materiales requeridos:</div>
                        <ul className="pl-3 m-0">
                            {productData?.materials?.map((mat, i) => (
                                <li key={i} className="mb-1">
                                    <span className="font-medium">{mat.name}: </span>
                                    <span className="text-600">{mat.amount}</span>
                                </li>
                            ))}
                        </ul>
                    </div>
                </Card>

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
                        <h2 className="text-2xl font-bold m-0 text-red-700">Insumos atrasados</h2>
                        <p className="text-red-600 mt-2">
                            Por favor, solicita los insumos a la brevedad y sube el recibo/factura.
                        </p>
                    </div>

                    <div className="surface-card border-2 border-dashed surface-border border-round p-5 flex flex-column align-items-center justify-content-center bg-white">
                        <i className="pi pi-cloud-upload text-6xl text-400 mb-4"></i>
                        <FileUpload
                            mode="basic"
                            name="receipt[]"
                            url="/api/upload"
                            accept="image/*,application/pdf"
                            maxFileSize={2000000}
                            onSelect={onUpload}
                            chooseLabel="Sube tu recibo"
                            className="p-button-lg"
                            auto={true}
                        />
                        <span className="text-500 mt-3 text-sm">Formatos: PDF, JPG, PNG</span>
                    </div>
                </Card>
            </div>

            <Dialog
                header="Insumos atrasados"
                visible={showDelayDialog}
                style={{ width: '90vw', maxWidth: '400px' }}
                modal
                onHide={() => setShowDelayDialog(false)}
            >
                <div className="flex flex-column gap-3 pt-2">
                    <p className="m-0 line-height-3">
                        Notificar al equipo sobre el tiempo estimado de llegada de los insumos.
                    </p>

                    <div className="field">
                        <label htmlFor="days" className="font-bold block mb-2"># Cantidad de días:</label>
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