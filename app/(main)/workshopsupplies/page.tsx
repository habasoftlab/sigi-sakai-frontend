'use client';
import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams, useRouter } from 'next/navigation'; // Importar useRouter
import { Card } from 'primereact/card';
import { Button } from 'primereact/button';
import { InputText } from 'primereact/inputtext';
import { InputTextarea } from 'primereact/inputtextarea';
import { InputNumber } from 'primereact/inputnumber';
import { Dialog } from 'primereact/dialog';
import { Toast } from 'primereact/toast';
import Link from 'next/link';

// Importamos datos
import { dummyOrders, allProducts } from '@/app/api/mockData';

const SuppliesVerificationPage = () => {
    const searchParams = useSearchParams();
    const router = useRouter(); // Para redirigir al terminar
    const orderId = searchParams.get('id');
    const toast = useRef<Toast>(null);

    // --- ESTADOS ---
    const [orderData, setOrderData] = useState<any>(null);
    const [productData, setProductData] = useState<any>(null);

    // Estado para el modal de solicitud
    const [showRequestDialog, setShowRequestDialog] = useState(false);
    const [requestDetails, setRequestDetails] = useState({
        material: '',
        cantidad: 1,
        notas: ''
    });

    // --- CARGAR DATOS ---
    useEffect(() => {
        if (orderId) {
            const order = dummyOrders.find(o => o.id === orderId);
            if (order) {
                setOrderData(order);
                // Buscar detalles del producto (simulado buscando el primer item o hardcoded)
                // En un caso real, order tendría un array de items. Aquí buscamos uno que coincida.
                // Para el demo, asumimos que es el primer producto del catálogo que coincida con la descripción o uno genérico.
                const product = allProducts[0]; // Usamos uno de ejemplo para mostrar datos
                setProductData(product);
            }
        }
    }, [orderId]);

    // --- HANDLERS ---

    // 1. Confirmar Insumos (Botón Verde)
    const handleConfirmSupplies = () => {
        toast.current?.show({
            severity: 'success',
            summary: 'Insumos Confirmados',
            detail: `Los insumos para la orden ${orderId} han sido marcados como listos.`,
            life: 3000
        });

        // Simular espera y regresar a la lista
        setTimeout(() => {
            router.push('/workshoplist');
        }, 1500);
    };

    // 2. Abrir Solicitud (Botón Rojo)
    const handleMissingSupplies = () => {
        // Pre-llenar datos si es necesario
        setRequestDetails(prev => ({ ...prev, material: productData?.name || '' }));
        setShowRequestDialog(true);
    };

    // 3. Enviar Solicitud (Dentro del Modal)
    const sendSupplyRequest = () => {
        if (!requestDetails.material || !requestDetails.cantidad) {
            toast.current?.show({ severity: 'warn', summary: 'Faltan datos', detail: 'Por favor completa el material y cantidad.', life: 3000 });
            return;
        }

        console.log("Solicitud enviada:", requestDetails);

        toast.current?.show({
            severity: 'warn',
            summary: 'Solicitud Enviada',
            detail: 'Se ha notificado a compras sobre los insumos faltantes.',
            life: 3000
        });

        setShowRequestDialog(false);

        // Regresar a la lista indicando demora
        setTimeout(() => {
            router.push('/workshoplist');
        }, 1500);
    };

    if (!orderData) {
        return <div className="p-4">Cargando información de la orden...</div>;
    }

    // Datos mockeados de materiales (Pág 24 del PDF)
    const mockMaterials = [
        { nombre: 'Papel Couché 300g', cantidad: '2 pliegos' },
    ];

    return (
        <div className="grid justify-content-center">
            <Toast ref={toast} />

            <div className="col-12 md:col-8 lg:col-6">
                {/* Cabecera con botón de regreso */}
                <div className="flex align-items-center gap-3 mb-4">
                    <Link href="/workshoplist" passHref legacyBehavior>
                        <a className="p-button p-component p-button-text p-button-rounded p-button-icon-only">
                            <i className="pi pi-arrow-left text-xl"></i>
                        </a>
                    </Link>
                    <h1 className="m-0 text-3xl font-bold">Orden N° {orderId}</h1>
                </div>

                {/* --- TARJETA: DETALLE DE LA ORDEN --- */}
                <Card title="Detalle de la orden" className="mb-4 shadow-2">
                    <div className="flex flex-column gap-3">
                        <div>
                            <label className="font-bold block text-700 mb-1">Descripción del producto</label>
                            <div className="text-xl">{productData?.name || 'Producto personalizado'}</div>
                        </div>
                        <div className="flex gap-4">
                            <div>
                                <label className="font-bold block text-700 mb-1">Cliente</label>
                                <div>{orderData.cliente}</div>
                            </div>
                            <div>
                                <label className="font-bold block text-700 mb-1">Total Orden</label>
                                <div>${orderData.total.toFixed(2)}</div>
                            </div>
                        </div>
                    </div>
                </Card>

                {/* --- TARJETA: MATERIALES NECESARIOS --- */}
                <Card title="Materiales necesarios" className="mb-4 shadow-2 bg-blue-50">
                    <ul className="list-none p-0 m-0">
                        {mockMaterials.map((mat, i) => (
                            <li key={i} className="flex align-items-center justify-content-between p-3 border-bottom-1 surface-border bg-white mb-2 border-round">
                                <span className="font-medium"><i className="pi pi-box mr-2 text-blue-500"></i>{mat.nombre}</span>
                                <span className="font-bold text-700">{mat.cantidad}</span>
                            </li>
                        ))}
                    </ul>
                </Card>

                {/* --- TARJETA: VERIFICACIÓN DE INSUMOS --- */}
                <Card className="shadow-3 border-top-3 border-orange-500">
                    <div className="text-center">
                        <h2 className="text-2xl font-bold mt-0 mb-2">Verificación de insumos</h2>
                        <p className="text-600 mb-4">Verifica físicamente los insumos. Si no se cuenta con ellos, marca la opción correspondiente para generar una solicitud.</p>

                        <div className="flex flex-column md:flex-row gap-3 justify-content-center">
                            {/* Opción 1: SÍ HAY INSUMOS */}
                            <Button
                                className="p-button-success p-button-lg flex-1 flex flex-column py-4"
                                onClick={handleConfirmSupplies}
                            >
                                <i className="pi pi-check-circle text-4xl mb-2"></i>
                                <span className="font-bold text-lg">Se cuenta con los insumos</span>
                                <span className="text-sm opacity-80 mt-1">Proceder a producción</span>
                            </Button>

                            {/* Opción 2: NO HAY INSUMOS */}
                            <Button
                                className="p-button-danger p-button-outlined p-button-lg flex-1 flex flex-column py-4"
                                onClick={handleMissingSupplies}
                            >
                                <i className="pi pi-times-circle text-4xl mb-2"></i>
                                <span className="font-bold text-lg">No se cuenta con los insumos</span>
                                <span className="text-sm opacity-80 mt-1">Generar solicitud</span>
                            </Button>
                        </div>
                    </div>
                </Card>
            </div>

            {/* --- MODAL: SOLICITUD DE INSUMOS (Pág 25) --- */}
            <Dialog
                header="Solicitud de insumos"
                visible={showRequestDialog}
                style={{ width: '90vw', maxWidth: '500px' }}
                modal
                onHide={() => setShowRequestDialog(false)}
                footer={
                    <div>
                        <Button label="Cancelar" icon="pi pi-times" onClick={() => setShowRequestDialog(false)} className="p-button-text" />
                        <Button label="Enviar Solicitud" icon="pi pi-send" onClick={sendSupplyRequest} autoFocus severity="danger" />
                    </div>
                }
            >
                <div className="flex flex-column gap-4 pt-2">
                    <div className="p-3 bg-red-50 border-round text-red-700 flex align-items-center">
                        <i className="pi pi-exclamation-triangle mr-2 text-xl"></i>
                        <span>Esta acción marcará la orden como <strong>Demorada</strong>.</span>
                    </div>

                    <div className="field">
                        <label htmlFor="material" className="font-bold block mb-2">Descripción del material faltante</label>
                        <InputText
                            id="material"
                            value={requestDetails.material}
                            onChange={(e) => setRequestDetails({ ...requestDetails, material: e.target.value })}
                            className="w-full"
                            placeholder="Ej. Papel couché agotado..."
                        />
                    </div>

                    <div className="formgrid grid">
                        <div className="field col-12">
                            <label htmlFor="cantidad" className="font-bold block mb-2">Cantidad requerida</label>
                            <InputNumber
                                id="cantidad"
                                value={requestDetails.cantidad}
                                onValueChange={(e) => setRequestDetails({ ...requestDetails, cantidad: e.value || 0 })}
                                showButtons
                                min={1}
                                className="w-full"
                            />
                        </div>
                    </div>

                    <div className="field">
                        <label htmlFor="notas" className="font-bold block mb-2">Insumos adicionales (Opcional)</label>
                        <InputTextarea
                            id="notas"
                            value={requestDetails.notas}
                            onChange={(e) => setRequestDetails({ ...requestDetails, notas: e.target.value })}
                            rows={3}
                            className="w-full"
                            placeholder="Especificaciones, marca, urgencia..."
                        />
                    </div>
                </div>
            </Dialog>

        </div>
    );
};

export default SuppliesVerificationPage;