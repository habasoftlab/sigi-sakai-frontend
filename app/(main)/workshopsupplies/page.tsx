/* eslint-disable @next/next/no-img-element */
'use client';
import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Card } from 'primereact/card';
import { Button } from 'primereact/button';
import { InputTextarea } from 'primereact/inputtextarea';
import { InputText } from 'primereact/inputtext';
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
    const [selectedMissingProducts, setSelectedMissingProducts] = useState<any[]>([]);
    const [requestNotes, setRequestNotes] = useState('');

    // Estado para guardar las cantidades manuales (Key: idDetalle, Value: string)
    const [missingQuantities, setMissingQuantities] = useState<Record<number, string>>({});

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
                    unidad: prod?.unidadVenta || 'pzas',
                    cantidadPaquete: prod?.cantidadPaquete || 1,
                    precioPaquete: prod?.precioPaquete || 0,
                    idProducto: d.idProducto
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
            const userStr = localStorage.getItem('user');
            const currentUserId = userStr ? JSON.parse(userStr).idUsuario : 1;

            await OrderService.avanzarEstatus(Number(orderId), {
                idUsuario: currentUserId,
                idEstatusDestino: 3,
                hayInsumos: true,
                clienteAprobo: false
            });

            toast.current?.show({ severity: 'success', summary: 'Insumos Confirmados', detail: `Orden #${orderId} marcada con insumos completos.` });
            setTimeout(() => { router.push('/workshoplist'); }, 1500);
        } catch (error: any) {
            toast.current?.show({ severity: 'error', summary: 'Error', detail: error.message || 'No se pudo confirmar.' });
            setIsSubmitting(false);
        }
    };

    const handleMissingSupplies = () => {
        setSelectedMissingProducts([]);
        setMissingQuantities({});
        setRequestNotes('');
        setShowRequestDialog(true);
    };

    const calculateSuggestion = (item: any): string => {
        const cantidadOrden = Number(item.cantidad);
        const tamanoPaquete = Number(item.cantidadPaquete);
        if (!tamanoPaquete || tamanoPaquete <= 1) {
            return `${cantidadOrden}`;
        }
        const paquetesNecesarios = Math.ceil(cantidadOrden / tamanoPaquete);
        return `${paquetesNecesarios} Paquetes`;
    };

    const onSelectionChange = (e: any) => {
        const selectedItems = e.value;
        setSelectedMissingProducts(selectedItems);

        const updates = { ...missingQuantities };
        selectedItems.forEach((item: any) => {
            if (!updates[item.idDetalle]) {
                updates[item.idDetalle] = calculateSuggestion(item);
            }
        });
        setMissingQuantities(updates);
    };

    const onQuantityChange = (idDetalle: number, value: string) => {
        setMissingQuantities(prev => ({ ...prev, [idDetalle]: value }));
    };

    const quantityInputTemplate = (rowData: any) => {
        const isSelected = selectedMissingProducts.some(p => p.idDetalle === rowData.idDetalle);
        return (
            <InputText
                value={missingQuantities[rowData.idDetalle] || ''}
                onChange={(e) => onQuantityChange(rowData.idDetalle, e.target.value)}
                placeholder={isSelected ? calculateSuggestion(rowData) : ""}
                disabled={!isSelected}
                className="w-full p-inputtext-sm"
            />
        );
    };

    const sendSupplyRequest = async () => {
        if (selectedMissingProducts.length === 0) {
            toast.current?.show({ severity: 'warn', summary: 'Selección requerida', detail: 'Selecciona los productos faltantes.' });
            return;
        }

        setIsSubmitting(true);
        try {
            const userStr = localStorage.getItem('user');
            const currentUserId = userStr ? JSON.parse(userStr).idUsuario : 1;

            const productosPayload = selectedMissingProducts.map(p => {
                const valorInput = missingQuantities[p.idDetalle] || calculateSuggestion(p);
                return {
                    idProducto: Number(p.idProducto),
                    cantidad: String(valorInput)
                };
            });

            const requestBody = {
                idUsuario: currentUserId,
                idOrden: Number(orderId),
                descripcionGeneral: requestNotes || 'Solicitud de insumos',
                productos: productosPayload
            };
            await OrderService.crearSolicitudCompra(requestBody);
            await OrderService.avanzarEstatus(Number(orderId), {
                idUsuario: currentUserId,
                idEstatusDestino: 4,
                hayInsumos: false
            });

            toast.current?.show({ severity: 'success', summary: 'Solicitud Creada', detail: 'Se ha enviado la lista a compras.' });
            setShowRequestDialog(false);
            setTimeout(() => { router.push('/workshoplist'); }, 1500);

        } catch (error: any) {
            console.error("Error payload:", error);
            toast.current?.show({ severity: 'error', summary: 'Error', detail: error.message || 'Error al procesar solicitud.' });
            setIsSubmitting(false);
        }
    };

    if (loading) return <div className="flex justify-content-center align-items-center h-screen"><i className="pi pi-spin pi-spinner text-4xl"></i></div>;
    if (!orderData) return <div className="p-4 text-center">No se encontró la orden.</div>;

    const renderCantidadRequerida = (rowData: any) => (
        <span className="text-600">
            {rowData.cantidad} {rowData.unidad}
        </span>
    );

    const renderPresentacion = (rowData: any) => {
        const esPaquete = rowData.cantidadPaquete > 1;
        const textoPresentacion = esPaquete ? `Paq. de ${rowData.cantidadPaquete}` : 'Unitario';

        return <span className="text-sm text-blue-600">{textoPresentacion}</span>;
    };

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
                        <h1 className="m-0 text-3xl font-bold">Verificación de insumos orden #{orderId}</h1>
                        <span className="text-500">Confirma existencia física para liberar producción</span>
                    </div>
                </div>

                <div className="grid">
                    {/* RESUMEN */}
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
                                        {orderData.fechaEntregaFormal ? new Date(orderData.fechaEntregaFormal).toLocaleDateString() : 'No definida'}
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

                    {/* MATERIALES */}
                    <div className="col-12 md:col-6">
                        <Card title="Productos solicitados" className="mb-3 shadow-1 bg-100 h-full">
                            <p className="text-sm text-600 mb-2">Revisa la existencia de:</p>
                            <DataTable value={orderItems} size="small" className="surface-0" showGridlines>
                                <Column field="nombreProducto" header="Producto"></Column>
                                <Column
                                    field="cantidad"
                                    header="Cant."
                                    body={(d) => `${d.cantidad}`}
                                    style={{ width: '30%', textAlign: 'center', fontWeight: 'bold' }}
                                ></Column>
                            </DataTable>
                        </Card>
                    </div>
                </div>

                {/* BOTONES DE ACCIÓN */}
                <Card className="shadow-4 border-top-3 border-orange-500 mt-4">
                    <div className="text-center">
                        <h2 className="text-2xl font-bold mt-0 mb-2">¿Están completos los insumos?</h2>
                        <p className="text-600 mb-5">Verifica físicamente en almacén antes de confirmar.</p>

                        <div className="flex flex-column md:flex-row gap-4 justify-content-center px-4 pb-2">
                            <Button className="p-button-success p-button-lg flex-1 py-5" onClick={handleConfirmSupplies} loading={isSubmitting} disabled={isSubmitting}>
                                <i className="pi pi-check-circle text-5xl mb-3"></i>
                                <span className="font-bold text-xl">Confirmar existencia</span>
                            </Button>
                            <Button className="p-button-danger p-button-outlined p-button-lg flex-1 py-5" onClick={handleMissingSupplies} disabled={isSubmitting}>
                                <i className="pi pi-exclamation-triangle text-5xl mb-3"></i>
                                <span className="font-bold text-xl">Falta material</span>
                            </Button>
                        </div>
                    </div>
                </Card>
            </div>

            {/* MODAL FALTANTES */}
            <Dialog
                header={<div className="text-red-700 font-bold"><i className="pi pi-shopping-cart mr-2"></i>Solicitar insumos</div>}
                visible={showRequestDialog}
                style={{ width: '90vw', maxWidth: '900px' }}
                modal
                onHide={() => setShowRequestDialog(false)}
                footer={
                    <div className="flex justify-content-end gap-2 pt-2">
                        <Button label="Cancelar" icon="pi pi-times" onClick={() => setShowRequestDialog(false)} className="p-button-text" />
                        <Button label="Enviar Solicitud" icon="pi pi-send" onClick={sendSupplyRequest} severity="danger" loading={isSubmitting} disabled={selectedMissingProducts.length === 0} />
                    </div>
                }
            >
                <div className="flex flex-column gap-3 pt-1">
                    <p className="m-0 text-700">
                        Selecciona los productos y <strong>especifica la cantidad de material</strong> a comprar:
                    </p>

                    <div className="border-1 surface-border border-round overflow-hidden">
                        <DataTable
                            value={orderItems}
                            selection={selectedMissingProducts}
                            onSelectionChange={onSelectionChange}
                            dataKey="idDetalle"
                            responsiveLayout="scroll"
                            size="small"
                            stripedRows
                        >
                            <Column selectionMode="multiple" headerStyle={{ width: '3rem' }}></Column>

                            <Column field="nombreProducto" header="Producto de la Orden"></Column>

                            <Column
                                field="Cantidad"
                                header="Requerido"
                                body={renderCantidadRequerida}
                            />

                            <Column
                                header="Presentación"
                                body={renderPresentacion}
                            />

                            <Column
                                header="Cantidad a pedir"
                                body={quantityInputTemplate}
                                style={{ width: '25%' }}
                            ></Column>
                        </DataTable>
                    </div>

                    <div className="field mt-2">
                        <label htmlFor="notas" className="font-bold block mb-2 text-800">
                            Notas generales para compras (Urgencia, proveedor sugerido, etc):
                        </label>
                        <InputTextarea
                            id="notas"
                            value={requestNotes}
                            onChange={(e) => setRequestNotes(e.target.value)}
                            rows={2}
                            className="w-full"
                            placeholder="Ej. Urgente para el pedido de Coca-Cola..."
                        />
                    </div>
                </div>
            </Dialog>
        </div>
    );
};

export default SuppliesVerificationPage;