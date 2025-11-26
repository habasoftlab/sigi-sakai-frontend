'use client';
import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Card } from 'primereact/card';
import { Button } from 'primereact/button';
import { InputText } from 'primereact/inputtext';
import { Toast } from 'primereact/toast';
import { Image } from 'primereact/image';
import Link from 'next/link';

// Importamos datos e interfaces
import { dummyOrders, allProducts, dummyClients, Product } from '@/app/api/mockData';

const PrintOrderPage = () => {
    const searchParams = useSearchParams();
    const router = useRouter();
    const orderId = searchParams.get('id');
    const toast = useRef<Toast>(null);

    const [orderData, setOrderData] = useState<any>(null);
    const [productData, setProductData] = useState<Product | null>(null);
    const [clientData, setClientData] = useState<any>(null);

    // --- CARGAR DATOS ---
    useEffect(() => {
        if (orderId) {
            const order = dummyOrders.find(o => o.id === orderId);
            if (order) {
                setOrderData(order);

                // Lógica: Buscar el producto real de la orden
                // Usamos 'mainProductId' que añadimos a dummyOrders en mockData.ts
                // Si no existe (porque es un mock antiguo), hacemos fallback a encontrar por nombre o al primero
                let product = allProducts.find(p => p.id === order.mainProductId);

                if (!product) {
                    // Intento de fallback por si no hay mainProductId en el objeto order
                    product = allProducts[0];
                }

                setProductData(product);

                const client = dummyClients.find(c => c.name === order.cliente);
                setClientData(client);
            }
        }
    }, [orderId]);

    // --- HANDLERS ---

    // 1. Descargar Diseño
    const handleDownloadDesign = () => {
        if (orderData?.imageUrl) {
            // Simulamos descarga abriendo en nueva pestaña
            window.open(orderData.imageUrl, '_blank');
            toast.current?.show({ severity: 'info', summary: 'Descargando', detail: 'Iniciando descarga del archivo...', life: 2000 });
        } else {
            toast.current?.show({ severity: 'error', summary: 'Error', detail: 'No hay archivo de diseño disponible.', life: 3000 });
        }
    };

    // 2. Marcar Listo para Entrega
    const handleMarkReady = () => {
        toast.current?.show({
            severity: 'success',
            summary: 'Orden Lista',
            detail: `La orden ${orderId} ha sido marcada como lista para entrega.`,
            life: 3000
        });

        // Regresar a la lista después de un momento
        setTimeout(() => {
            router.push('/workshoplist');
        }, 1500);
    };

    if (!orderData) {
        return <div className="p-4">Cargando información de la orden...</div>;
    }

    return (
        <div className="grid justify-content-center">
            <Toast ref={toast} />

            <div className="col-12 md:col-8 lg:col-6">
                {/* Cabecera */}
                <div className="flex align-items-center gap-3 mb-4">
                    <Link href="/workshoplist" passHref legacyBehavior>
                        <a className="p-button p-component p-button-text p-button-rounded p-button-icon-only">
                            <i className="pi pi-arrow-left text-xl"></i>
                        </a>
                    </Link>
                    <h1 className="m-0 text-3xl font-bold">Orden N° {orderId}</h1>
                </div>

                {/* --- DETALLE DE LA ORDEN --- */}
                <Card title="Detalle de la orden" className="mb-4 shadow-2">
                    <div className="flex flex-column gap-3">
                        <div>
                            <label className="font-bold block text-700 mb-1">Descripción del producto</label>
                            <div className="text-xl">{productData?.name}</div>
                        </div>
                        <div className="flex gap-4">
                            <div>
                                <label className="font-bold block text-700 mb-1">Cliente</label>
                                <div>{orderData.cliente}</div>
                            </div>
                            <div>
                                <label className="font-bold block text-700 mb-1">Teléfono</label>
                                <div>{clientData?.phone || '---'}</div>
                            </div>
                        </div>
                    </div>
                </Card>

                {/* --- MATERIALES NECESARIOS (DINÁMICOS) --- */}
                <Card title="Materiales necesarios" className="mb-4 shadow-2 bg-blue-50">
                    <ul className="list-none p-0 m-0">
                        {productData?.materials && productData.materials.length > 0 ? (
                            productData.materials.map((mat, i) => (
                                <li key={i} className="flex align-items-center justify-content-between p-3 border-bottom-1 surface-border bg-white mb-2 border-round">
                                    <span className="font-medium"><i className="pi pi-box mr-2 text-blue-500"></i>{mat.name}</span>
                                    <span className="font-bold text-700">{mat.amount}</span>
                                </li>
                            ))
                        ) : (
                            <li className="p-3 text-center text-500">No hay materiales especificados para este producto.</li>
                        )}
                    </ul>
                </Card>

                {/* --- LISTO PARA IMPRIMIR (Pág 26) --- */}
                <Card className="shadow-4 border-top-3 border-green-500 mb-4">
                    <div className="text-center">
                        <h2 className="text-2xl font-bold mt-0 mb-2 text-green-700">Listo para imprimir</h2>
                        <p className="text-600 mb-4">Descarga el diseño y realiza la impresión a la brevedad.</p>

                        {/* Imagen de referencia */}
                        <div className="mb-4 flex justify-content-center">
                            {orderData.imageUrl ? (
                                <Image
                                    src={orderData.imageUrl}
                                    alt="Diseño final"
                                    width="200"
                                    preview
                                    className="shadow-2 border-round"
                                />
                            ) : (
                                <div className="p-4 bg-gray-100 border-round text-gray-500">Sin vista previa</div>
                            )}
                        </div>

                        {/* Botón de Descarga */}
                        <Button
                            label="Descargar Diseño"
                            icon="pi pi-download"
                            className="p-button-outlined p-button-lg w-full md:w-auto mb-3"
                            onClick={handleDownloadDesign}
                        />
                    </div>
                </Card>

                {/* --- BOTÓN FINAL: LISTA PARA ENTREGA --- */}
                <Button
                    label="Marcar como lista para entrega"
                    icon="pi pi-check-circle"
                    severity="success"
                    className="w-full p-button-lg py-3 shadow-2"
                    onClick={handleMarkReady}
                />

            </div>
        </div>
    );
};

export default PrintOrderPage;