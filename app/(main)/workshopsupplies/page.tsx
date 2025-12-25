'use client';
import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Card } from 'primereact/card';
import { Button } from 'primereact/button';
import { InputTextarea } from 'primereact/inputtextarea';
import { Dialog } from 'primereact/dialog';
import { Toast } from 'primereact/toast';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import Link from 'next/link';

// Servicios
import { OrderService } from '@/app/service/orderService';
import { CatalogService } from '@/app/service/catalogService';
import { ClientService } from '@/app/service/clientService';

const SuppliesVerificationPage = () => {
    const searchParams = useSearchParams();
    const router = useRouter();
    const orderId = searchParams.get('id');
    const toast = useRef<Toast>(null);

    // --- ESTADOS ---
    const [orderData, setOrderData] = useState<any>(null);
    const [orderItems, setOrderItems] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // --- ESTADOS PARA REPORTE DE FALTANTES ---
    const [showRequestDialog, setShowRequestDialog] = useState(false);
    // Almacena los productos que el usuario marca como "Faltantes"
    const [selectedMissingProducts, setSelectedMissingProducts] = useState<any[]>([]);
    const [requestNotes, setRequestNotes] = useState('');

    useEffect(() => {
        if (orderId) {
            loadData(Number(orderId));
        }
    }, [orderId]);

    const loadData = async (id: number) => {
        setLoading(true);
        try {
            const [order, allProducts] = await Promise.all([
                OrderService.getOrdenById(id),
                CatalogService.getAllProductos()
            ]);

            const productMap = new Map();
            allProducts.forEach((p: any) => productMap.set(p.idProducto, p));

            const itemsConNombre = (order.detalles || []).map((d: any) => {
                const prod = productMap.get(d.idProducto);
                return {
                    ...d,
                    nombreProducto: prod?.descripcion || prod?.nombre || 'Producto desconocido',
                    unidad: prod?.unidadVenta || 'pzas'
                };
            });

            let clienteNombre = "Cliente Mostrador";
            if (order.idCliente) {
                try {
                    const client = await ClientService.getById(order.idCliente);
                    clienteNombre = client.nombre;
                } catch (e) { console.error("Error cliente", e); }
            }

            setOrderData({ ...order, clienteNombre });
            setOrderItems(itemsConNombre);

        } catch (error) {
            console.error("Error cargando datos", error);
            toast.current?.show({ severity: 'error', summary: 'Error', detail: 'No se pudo cargar la orden.' });
        } finally {
            setLoading(false);
        }
    };

    const handleConfirmSupplies = async () => {
        setIsSubmitting(true);
        try {
            //await OrderService.actualizarVerificacionInsumos(Number(orderId), true);
            toast.current?.show({
                severity: 'success',
                summary: 'Insumos Confirmados',
                detail: `La orden ${orderId} está lista para producción.`,
                life: 2000
            });
            setTimeout(() => {
                router.push('/workshoplist');
            }, 1500);
        } catch (error) {
            toast.current?.show({ severity: 'error', summary: 'Error', detail: 'No se pudo confirmar la orden.' });
            setIsSubmitting(false);
        }
    };

    // --- ABRIR MODAL DE FALTANTES ---
    const handleMissingSupplies = () => {
        setSelectedMissingProducts([]);
        setRequestNotes('');
        setShowRequestDialog(true);
    };

    // --- ENVIAR REPORTE DE FALTANTES ---
    const sendSupplyRequest = async () => {
        if (selectedMissingProducts.length === 0) {
            toast.current?.show({
                severity: 'warn',
                summary: 'Selección requerida',
                detail: 'Selecciona al menos un producto que le falte material.',
                life: 3000
            });
            return;
        }

        setIsSubmitting(true);
        try {
            const userStr = localStorage.getItem('user');
            const currentUserId = userStr ? JSON.parse(userStr).idUsuario : 1;
            const listaProductos = selectedMissingProducts
                .map(p => `• ${p.nombreProducto} (${p.cantidad} ${p.unidad})`)
                .join('\n');

            const reporteFinal = `REPORTE DE FALTANTES:\n${listaProductos}\n\nNota Adicional: ${requestNotes || 'Ninguna'}`;

            await OrderService.avanzarEstatus(Number(orderId), {
                idUsuario: currentUserId,
                idEstatusDestino: 4,
                clienteAprobo: false,
            });

            toast.current?.show({
                severity: 'warn',
                summary: 'Reporte Enviado',
                detail: 'Se notificó la falta de material para los productos seleccionados.',
                life: 3000
            });

            setShowRequestDialog(false);
            setTimeout(() => {
                router.push('/workshoplist');
            }, 1500);

        } catch (error) {
            console.error(error);
            toast.current?.show({ severity: 'error', summary: 'Error', detail: 'No se pudo registrar la incidencia.' });
            setIsSubmitting(false);
        }
    };

    if (loading) return <div className="flex justify-content-center align-items-center h-screen"><i className="pi pi-spin pi-spinner text-4xl"></i></div>;
    if (!orderData) return <div className="p-4 text-center">No se encontró la orden.</div>;

    return (
        <div className="grid justify-content-center">
            <Toast ref={toast} />

            <div className="col-12 md:col-10 lg:col-8">
                {/* Cabecera */}
                <div className="flex align-items-center gap-3 mb-4">
                    <Link href="/workshoplist" passHref legacyBehavior>
                        <a className="p-button p-component p-button-text p-button-rounded p-button-icon-only">
                            <i className="pi pi-arrow-left text-xl"></i>
                        </a>
                    </Link>
                    <div>
                        <h1 className="m-0 text-3xl font-bold">Verificación de insumos para orden #{orderId}</h1>
                        <span className="text-500">Confirma existencia física para liberar producción</span>
                    </div>
                </div>

                <div className="grid">
                    {/* COLUMNA IZQUIERDA: RESUMEN */}
                    <div className="col-12 md:col-6">
                        <Card title="Datos generales" className="mb-3 shadow-1 h-full">
                            <ul className="list-none p-0 m-0">
                                <li className="flex justify-content-between mb-3 border-bottom-1 surface-border pb-2">
                                    <span className="text-600 font-medium">Cliente:</span>
                                    <span className="text-900 font-bold">{orderData.clienteNombre}</span>
                                </li>
                                <li className="flex justify-content-between mb-3 border-bottom-1 surface-border pb-2">
                                    <span className="text-600 font-medium">Fecha Entrega:</span>
                                    <span className="text-900 font-bold">
                                        {orderData.fechaEntregaFormal
                                            ? new Date(orderData.fechaEntregaFormal).toLocaleDateString()
                                            : 'No definida'}
                                    </span>
                                </li>
                                <li className="flex justify-content-between">
                                    <span className="text-600 font-medium">Total orden:</span>
                                    <span className="text-green-600 font-bold text-lg">
                                        ${orderData.montoTotal?.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                                    </span>
                                </li>
                            </ul>
                        </Card>
                    </div>

                    {/* COLUMNA DERECHA: MATERIALES A VERIFICAR */}
                    <div className="col-12 md:col-6">
                        <Card title="Productos solicitados" className="mb-3 shadow-1 bg-100 h-full">
                            <p className="text-sm text-600 mb-2">Revisa la existencia de:</p>
                            <DataTable value={orderItems} size="small" className="surface-0" showGridlines>
                                <Column field="nombreProducto" header="Producto"></Column>
                                <Column
                                    field="cantidad"
                                    header="Cant."
                                    body={(d) => `${d.cantidad} ${d.unidad}`}
                                    style={{ width: '30%', textAlign: 'center', fontWeight: 'bold' }}
                                ></Column>
                            </DataTable>
                        </Card>
                    </div>
                </div>

                {/* --- BOTONES DE ACCIÓN GRANDE --- */}
                <Card className="shadow-4 border-top-3 border-orange-500 mt-4">
                    <div className="text-center">
                        <h2 className="text-2xl font-bold mt-0 mb-2">¿Están completos los insumos?</h2>
                        <p className="text-600 mb-5">Verifica físicamente en almacén antes de confirmar.</p>

                        <div className="flex flex-column md:flex-row gap-4 justify-content-center px-4 pb-2">
                            <Button
                                className="p-button-success p-button-lg flex-1 flex flex-column py-5 shadow-2 hover:shadow-4 transition-all"
                                onClick={handleConfirmSupplies}
                                loading={isSubmitting}
                                disabled={isSubmitting}
                            >
                                <i className="pi pi-check-circle text-5xl mb-3"></i>
                                <span className="font-bold text-xl">Confirmar existencia</span>
                                <span className="text-sm opacity-90 mt-1">Todo listo para producir</span>
                            </Button>

                            <Button
                                className="p-button-danger p-button-outlined p-button-lg flex-1 flex flex-column py-5 shadow-2 hover:shadow-4 transition-all"
                                onClick={handleMissingSupplies}
                                disabled={isSubmitting}
                            >
                                <i className="pi pi-exclamation-triangle text-5xl mb-3"></i>
                                <span className="font-bold text-xl">Falta material</span>
                                <span className="text-sm opacity-90 mt-1">Reportar productos faltantes</span>
                            </Button>
                        </div>
                    </div>
                </Card>
            </div>

            {/* --- MODAL: SELECCIÓN DE PRODUCTOS CON FALTANTES --- */}
            <Dialog
                header={
                    <div className="flex align-items-center text-red-700">
                        <i className="pi pi-exclamation-triangle mr-2 text-2xl"></i>
                        <span className="font-bold">Reporte de faltantes</span>
                    </div>
                }
                visible={showRequestDialog}
                style={{ width: '90vw', maxWidth: '600px' }}
                modal
                onHide={() => setShowRequestDialog(false)}
                footer={
                    <div className="flex justify-content-end gap-2 pt-2">
                        <Button label="Cancelar" icon="pi pi-times" onClick={() => setShowRequestDialog(false)} className="p-button-text" />
                        <Button
                            label="Confirmar reporte"
                            icon="pi pi-send"
                            onClick={sendSupplyRequest}
                            autoFocus
                            severity="danger"
                            loading={isSubmitting}
                            disabled={selectedMissingProducts.length === 0}
                        />
                    </div>
                }
            >
                <div className="flex flex-column gap-3 pt-1">
                    <p className="m-0 text-700">
                        Selecciona los productos que <strong>no se pueden producir</strong> por falta de material:
                    </p>

                    {/* TABLA DE SELECCIÓN */}
                    <div className="border-1 surface-border border-round overflow-hidden">
                        <DataTable
                            value={orderItems}
                            selection={selectedMissingProducts}
                            onSelectionChange={(e) => setSelectedMissingProducts(e.value)}
                            dataKey="idDetalle"
                            responsiveLayout="scroll"
                            size="small"
                            stripedRows
                        >
                            <Column selectionMode="multiple" headerStyle={{ width: '3rem' }}></Column>
                            <Column field="nombreProducto" header="Producto faltante"></Column>
                            <Column field="cantidad" header="Cantidad" body={(d) => `${d.cantidad} ${d.unidad}`} style={{ width: '25%' }}></Column>
                        </DataTable>
                    </div>

                    <div className="field mt-2">
                        <label htmlFor="notas" className="font-bold block mb-2 text-800">
                            Detalles para compras <span className="text-red-500">*</span>
                        </label>
                        <InputTextarea
                            id="notas"
                            value={requestNotes}
                            onChange={(e) => setRequestNotes(e.target.value)}
                            rows={3}
                            className="w-full"
                            placeholder="Ej. Falta Lona 13oz, solo hay 2 metros. Se requiere tinta magenta..."
                        />
                        <small className="text-500">Especifica qué material falta y la urgencia.</small>
                    </div>
                </div>
            </Dialog>

        </div>
    );
};

export default SuppliesVerificationPage;