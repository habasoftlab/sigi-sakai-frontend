/* eslint-disable @next/next/no-img-element */
'use client';
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { AutoComplete, AutoCompleteCompleteEvent } from 'primereact/autocomplete';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Button } from 'primereact/button';
import { Toast } from 'primereact/toast';
import Link from 'next/link';
// SERVICIOS
import { ClientService } from "@/app/service/clientService";
import { CatalogService } from "@/app/service/catalogService";
import { OrderService } from "@/app/service/orderService";
import { UserService } from "@/app/service/userService";
// TIPOS
import { Client } from "@/app/types/clients";
import { Producto, NuevaOrdenRequest } from "@/app/types/orders";
// DIALOGS
import { QuoteListDialog } from './QuoteListDialog';
import { ActiveOrdersDialog } from './ActiveOrdersDialog';
import { QuoteSummaryDialog } from './QuoteSummaryDialog';
import { OrderPaymentDialog, PaymentData } from './OrderPaymentDialog';
import { ProductQuantityDialog } from './ProductQuantityDialog';
import { ClientFormDialog } from "@/app/components/ClientFormDialog";
import { ClientSearchDialog } from "@/app/components/ClientSearchDialog";

interface QuoteItemUI extends Producto {
    cantidad: number;
    importe: number;
    precioAplicado: number;
}

const Counter = () => {
    const [products, setProducts] = useState<Producto[]>([]);
    const [clients, setClients] = useState<Client[]>([]);
    const [designers, setDesigners] = useState<any[]>([]);
    const [productsCatalog, setProductsCatalog] = useState<any[]>([]);
    const [currentUserId, setCurrentUserId] = useState<number>(0);
    // ESTADO DEL CARRITO / ORDEN ACTUAL
    const [quoteItems, setQuoteItems] = useState<QuoteItemUI[]>([]);
    const [selectedDesigner, setSelectedDesigner] = useState<number | null>(null);
    const [assignedClient, setAssignedClient] = useState<Client | null>(null);
    const [requiresBilling, setRequiresBilling] = useState(false);
    const quoteTotal = quoteItems.reduce((total, item) => total + item.importe, 0);
    // Variables críticas para el flujo de actualización
    const [activeOrderId, setActiveOrderId] = useState<number | null>(null);
    const [activeOrderTotal, setActiveOrderTotal] = useState<number>(0);
    const [isSubmitting, setIsSubmitting] = useState(false);
    // ESTADOS DE UI (MODALES)
    const [showQuoteSummary, setShowQuoteSummary] = useState(false);
    const [showAddNewClientDialog, setShowAddNewClientDialog] = useState(false);
    const [showAssignClientDialog, setShowAssignClientDialog] = useState(false);
    const [showQuantityDialog, setShowQuantityDialog] = useState(false);
    const [showOrderSummary, setShowOrderSummary] = useState(false);
    const [activeOrderItems, setActiveOrderItems] = useState<any[]>([]);
    const [paymentConditions, setPaymentConditions] = useState<any[]>([]);
    const [activeOrderStatus, setActiveOrderStatus] = useState<number>(0);
    const [activeOrderPaid, setActiveOrderPaid] = useState(0);
    const [orderNotes, setOrderNotes] = useState('');
    // DATOS PARA LISTAS
    const [ShowOrdersList, setShowOrdersList] = useState(false);
    const [ordersList, setOrdersList] = useState<any[]>([]);
    const [quotesList, setQuotesList] = useState<any[]>([]);
    const [isLoadingList, setIsLoadingList] = useState(false);
    const [ShowQuoteList, setShowQuotesList] = useState(false);
    const [statusMap, setStatusMap] = useState<any>({});
    const [totalRecords, setTotalRecords] = useState(0);
    const [lazyParams, setLazyParams] = useState({
        first: 0,
        rows: 10,
        page: 0
    });
    const [expandedRows, setExpandedRows] = useState<any>([]);
    // VARIABLES TEMPORALES (Inputs)
    const [selectedProduct, setSelectedProduct] = useState<any>(null);
    const [pendingProduct, setPendingProduct] = useState<Producto | null>(null);
    // LÓGICA DE PAGOS (Para Modal Orden)
    const [paymentType, setPaymentType] = useState<'unico' | 'anticipo' | 'plazos'>('unico');
    const [advanceAmount, setAdvanceAmount] = useState<number>(0);
    // Filtros y Toast
    const toast = useRef<Toast>(null);
    // Calculado
    const currentCartTotal = quoteItems.reduce((acc, item) => acc + item.importe, 0);

    const handleClientCreated = (newClient: Client) => {
        setAssignedClient(newClient);
        loadClients();
    };

    const handleClientSelected = (client: Client) => {
        setAssignedClient(client);
        if (!client.rfc || !client.direccionFiscal) {
            setRequiresBilling(false);
        }
    };

    useEffect(() => {
        loadClients();
        loadDesigners();
        loadStatusCatalog();
        loadOrderHistory();
        loadProductsCatalog();
        loadConditions();
    }, []);

    useEffect(() => {
        const userStr = localStorage.getItem('user');
        if (userStr) {
            const user = JSON.parse(userStr);
            setCurrentUserId(user.idUsuario);
        }
    }, []);

    useEffect(() => {
        if (ShowQuoteList) {
            setLazyParams({ first: 0, rows: 10, page: 0 });
            setExpandedRows([]);
            loadList('quotes', 0, 10);
        }
    }, [ShowQuoteList]);

    useEffect(() => {
        if (ShowOrdersList) {
            setLazyParams({ first: 0, rows: 10, page: 0 });
            setExpandedRows([]);
            loadList('orders', 0, 10);
        }
    }, [ShowOrdersList]);

    const loadList = async (type: 'quotes' | 'orders', page: number, rows: number) => {
        setIsLoadingList(true);
        try {
            let response;
            if (type === 'quotes') {
                response = await OrderService.getCotizacionesYCanceladas(page, rows);
            } else {
                response = await OrderService.getOrdenesActivas(page, rows);
            }
            const data = response.content || response || [];
            const total = response.page?.totalElements
                || response.totalElements
                || data.length;
            const processedData = data.map((item: any) => {
                const designerName = designers.find((d: any) => d.value === item.idUsuarioDisenador)?.label || 'Sin Asignar';
                return { ...item, nombreDisenador: designerName };
            });
            processedData.sort((a: any, b: any) => {
                if (a.nombreDisenador < b.nombreDisenador) return -1;
                if (a.nombreDisenador > b.nombreDisenador) return 1;
                return 0;
            });
            if (type === 'quotes') {
                setQuotesList(processedData);
            } else {
                setOrdersList(processedData);
            }
            setTotalRecords(total);
        } catch (error) {
            console.error("Error cargando lista", error);
        } finally {
            setIsLoadingList(false);
        }
    };

    const loadClients = async () => {
        try {
            const data = await ClientService.getAll();
            setClients(data.map((c: any) => ({ ...c, id: c.id || c.idCliente, nombre: c.nombre ?? '' })));
        } catch (e) { console.error(e); }
    };

    const loadConditions = async () => {
        try {
            const data = await CatalogService.getCondicionesPago();
            setPaymentConditions(data);
        } catch (error) {
            console.error("Error cargando condiciones de pago", error);
        }
    };

    const loadDesigners = async () => {
        try {
            const designUsers = await UserService.getDesigners();
            const options = designUsers.map((u: any) => ({
                label: u.nombre,
                value: u.idUsuario
            }));
            setDesigners([
                { label: '--- Sin Asignar (Pendiente) ---', value: null },
                ...options
            ]);
        } catch (error) {
            console.error("Error cargando diseñadores", error);
            setDesigners([{ label: '--- Sin Asignar (Pendiente) ---', value: null }]);
        }
    };

    const loadStatusCatalog = async () => {
        try {
            const listaEstatus = await OrderService.getEstatusOperaciones();
            const map: any = {};
            listaEstatus.forEach((item: any) => {
                map[item.idEstatus] = item.descripcion;
            });
            setStatusMap(map);
        } catch (error) {
            console.error("Error cargando estatus:", error);
        }
    };

    const loadOrderHistory = async (pageToLoad = lazyParams.page, pageSize = lazyParams.rows) => {
        setIsLoadingList(true);
        try {
            const response = await OrderService.getOrdenes(pageToLoad, pageSize);
            const data = (response as any).content || [];
            const pageInfo = (response as any).page;
            if (pageInfo) {
                setTotalRecords(pageInfo.totalElements);
            }
            if (!data || data.length === 0) {
                setQuotesList([]);
                setOrdersList([]);
                return;
            }
            let listaDiseñadoresParaMapeo = designers;
            if (listaDiseñadoresParaMapeo.length <= 1) {
                try {
                    const rawDesigners = await UserService.getDesigners();
                    const options = rawDesigners.map((u: any) => ({ label: u.nombre, value: u.idUsuario }));
                    listaDiseñadoresParaMapeo = [{ label: '--PENDIENTE DE ASIGNACIÓN--', value: null }, ...options];
                    setDesigners(listaDiseñadoresParaMapeo);
                } catch (err) { console.error(err); }
            }
            let enrichedData = data.map((order: any) => {
                const designerObj = listaDiseñadoresParaMapeo.find(d => d.value == order.idUsuarioDisenador);
                let nombreGrupo = '';
                if (order.idUsuarioDisenador === null) nombreGrupo = '--PENDIENTE DE ASIGNACIÓN--';
                else if (designerObj) nombreGrupo = designerObj.label;
                else nombreGrupo = `Diseñador ID: ${order.idUsuarioDisenador}`;
                const estatusNombre = (statusMap && statusMap[order.idEstatusActual])
                    ? statusMap[order.idEstatusActual]
                    : `Estatus ${order.idEstatusActual}`;
                return {
                    ...order,
                    nombreDisenador: nombreGrupo,
                    saldoPendiente: (order.montoTotal || 0) - (order.montoPagado || 0),
                    estatusNombre: estatusNombre
                };
            });
            enrichedData.sort((a: any, b: any) => {
                if (a.nombreDisenador < b.nombreDisenador) return -1;
                if (a.nombreDisenador > b.nombreDisenador) return 1;
                return 0;
            });
            const initialExpandedRows: any[] = [];
            const addedGroups = new Set();
            enrichedData.forEach((row: any) => {
                const groupKey = row.nombreDisenador;
                if (!addedGroups.has(groupKey)) {
                    addedGroups.add(groupKey);
                    initialExpandedRows.push(row);
                }
            });
            setExpandedRows(initialExpandedRows);
            setQuotesList(enrichedData.filter((o: any) => o.idEstatusActual === 1));
            setOrdersList(enrichedData.filter((o: any) => o.idEstatusActual !== 1));
        } catch (error) {
            toast.current?.show({ severity: 'error', summary: 'Error', detail: 'No se pudo cargar el historial' });
        } finally {
            setIsLoadingList(false);
        }
    };

    const loadProductsCatalog = async () => {
        try {
            const data = await CatalogService.getAllProductos();
            setProductsCatalog(data);
        } catch (error) {
            console.error("Error cargando productos", error);
        }
    };

    const onPage = (event: any) => {
        setLazyParams(event);
        const newPage = event.first / event.rows;
        if (ShowQuoteList) {
            loadList('quotes', newPage, event.rows);
        } else if (ShowOrdersList) {
            loadList('orders', newPage, event.rows);
        }
    };

    const handleCreateQuote = async () => {
        if (!assignedClient) { toast.current?.show({ severity: 'warn', detail: 'Asigna un cliente' }); return; }
        const nuevaOrden: NuevaOrdenRequest = {
            orden: {
                idUsuario: currentUserId,
                idUsuarioDisenador: selectedDesigner,
                idCliente: assignedClient.id!,
                montoTotal: quoteTotal,
                plazoEstimadoDias: estimatedProductionTime,
                requiereFactura: requiresBilling,
                idCondicionPago: 1,
                rutaArchivo: "Pendiente",
                insumosVerificados: false
            },
            detalles: quoteItems.map(i => ({
                idProducto: i.idProducto,
                cantidad: i.cantidad,
                precioUnitario: i.precioUnitario,
                importe: i.importe
            })),
            idUsuarioAccion: currentUserId
        };
        try {
            await OrderService.crearOrden(nuevaOrden);
            toast.current?.show({ severity: 'success', summary: 'Cotización Guardada', detail: 'Disponible en la lista.' });
            setShowQuoteSummary(false);
            handleClearScreen();
            await loadOrderHistory();
        } catch (e) {
            toast.current?.show({ severity: 'error', summary: 'Error', detail: 'Fallo al guardar cotización' });
        }
    };

    const handleCloseQuoteSummary = () => {
        setShowQuoteSummary(false);
        setAssignedClient(null);
        setRequiresBilling(false);
        setSelectedDesigner(null);
    };

    const handleClearScreen = () => {
        setQuoteItems([]); setAssignedClient(null); setSelectedProduct(null);
        setActiveOrderId(null); setActiveOrderTotal(0);
    };

    const searchProduct = async (e: AutoCompleteCompleteEvent) => {
        if (!e.query.trim()) { setProducts([]); return; }
        try { setProducts(await CatalogService.getProductos(e.query)); } catch (err) { }
    };

    const onProductSelect = (e: any) => {
        if (e.value) {
            const exists = quoteItems.some(i => i.idProducto === e.value.idProducto);
            if (exists) {
                toast.current?.show({
                    severity: 'warn',
                    summary: 'Producto duplicado',
                    detail: 'Este producto ya está en la lista. Elimínalo si quieres cambiar la cantidad.',
                    life: 3000
                });
                setSelectedProduct(null);
                return;
            }
            setPendingProduct(e.value);
            setShowQuantityDialog(true);
        }
        setSelectedProduct(null);
    };

    const handleAddProductFromModal = (product: Producto, quantity: number) => {
        const precioReal = product.precioUnitario;
        const newItem: QuoteItemUI = {
            ...product,
            cantidad: quantity,
            precioAplicado: precioReal,
            precioUnitario: precioReal,
            importe: precioReal * quantity,
        };
        setQuoteItems([...quoteItems, newItem]);
    };

    const estimatedProductionTime = useMemo(() => {
        if (quoteItems.length === 0) return 0;
        const timeArray = quoteItems.map(item => {
            let days = item.tiempoProduccionDias || 0;
            if (item.volumenDescuentoCantidad && item.cantidad >= item.volumenDescuentoCantidad) {
                days += 2;
            }
            return days;
        });
        return Math.max(...timeArray);
    }, [quoteItems]);

    const handleDelete = (row: any) => setQuoteItems(quoteItems.filter(i => i.idProducto !== row.idProducto));

    const handleProcessPayment = async (data: PaymentData) => {
        if (!activeOrderId || isSubmitting) return;
        setIsSubmitting(true);
        try {
            await OrderService.updateCondicionPago(activeOrderId, data.conditionId);
            if (data.amount > 0) {
                await OrderService.registrarPago(activeOrderId, {
                    monto: data.amount,
                    referencia: `Pago ${data.paymentType} - ${data.notes}`,
                    idUsuario: currentUserId
                });
            }
            if (data.file) {
                try {
                    await OrderService.subirArchivo(activeOrderId, data.file);
                    toast.current?.show({ severity: 'info', summary: 'Archivo', detail: 'Archivo adjuntado correctamente.' });
                } catch (e) { console.error(e); }
            }
            if (activeOrderStatus === 1) {
                await OrderService.avanzarEstatus(activeOrderId, { idUsuario: currentUserId });
            }
            toast.current?.show({ severity: 'success', summary: 'Éxito', detail: 'Orden actualizada correctamente' });
            setShowOrderSummary(false);
            setActiveOrderId(null);
            loadOrderHistory();
        } catch (error: any) {
            toast.current?.show({ severity: 'error', summary: 'Error', detail: error.message });
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleOrder = async (quoteRow: any) => {
        setActiveOrderId(quoteRow.idOrden);
        setActiveOrderTotal(quoteRow.montoTotal);
        const clientFound = clients.find(c => c.id === quoteRow.idCliente);
        setAssignedClient(clientFound || null);
        setSelectedDesigner(quoteRow.idUsuarioDisenador);
        setRequiresBilling(quoteRow.requiereFactura);
        setPaymentType('unico');
        setAdvanceAmount(0);
        setOrderNotes('');
        setActiveOrderStatus(quoteRow.idEstatusActual);
        setActiveOrderPaid(quoteRow.montoPagado || 0);
        try {
            const fullOrderData = await OrderService.getOrdenById(quoteRow.idOrden);
            if (fullOrderData.detalles && Array.isArray(fullOrderData.detalles)) {
                const mappedItems: any[] = fullOrderData.detalles.map((d: any) => {
                    const catalogoProducto = productsCatalog.find((p: any) => p.idProducto === d.idProducto);
                    return {
                        ...d,
                        idProducto: d.idProducto,
                        descripcion: catalogoProducto ? catalogoProducto.descripcion : `(ID: ${d.idProducto})`,
                        costo: d.precioUnitario,
                        cantidad: d.cantidad,
                        importe: d.importe,
                        tiempoProduccionDias: catalogoProducto?.tiempoProduccionDias || 0,
                        precioUnitario: d.precioUnitario
                    };
                });
                setActiveOrderItems(mappedItems);
            } else {
                setActiveOrderItems([]);
            }
            setShowQuotesList(false);
            setShowOrdersList(false);
            setShowQuoteSummary(false);
            setShowOrderSummary(true);

        } catch (error) {
            setActiveOrderItems([]);
            toast.current?.show({ severity: 'error', summary: 'Error', detail: 'No se pudo cargar la orden.' });
        }
    };

    const handleQuickPay = (rowData: any) => {
        setActiveOrderId(rowData.idOrden);
        setActiveOrderTotal(rowData.montoTotal);
        const { tipoVisual, montoSugerido } = calcularSugerenciaPago(rowData);
        setPaymentType(tipoVisual);
        setAdvanceAmount(montoSugerido);
        setOrderNotes('');
        setActiveOrderItems([]);
        setShowOrderSummary(true);
        setActiveOrderStatus(rowData.idEstatusActual);
        setActiveOrderPaid(rowData.montoPagado || 0);
    };

    type TipoPago = 'unico' | 'anticipo' | 'plazos';
    const calcularSugerenciaPago = (orden: any) => {
        const saldoPendiente = orden.montoTotal - orden.montoPagado;
        let tipoVisual: TipoPago = 'unico';
        let montoSugerido = saldoPendiente;
        switch (orden.idCondicionPago) {
            case 1:
                tipoVisual = 'unico';
                montoSugerido = saldoPendiente;
                break;

            case 2:
                tipoVisual = 'anticipo';
                if (orden.montoPagado >= (orden.montoTotal * 0.19)) {
                    montoSugerido = saldoPendiente;
                } else {
                    montoSugerido = orden.montoTotal * 0.50;
                }
                break;

            case 3:
                tipoVisual = 'plazos';
                const pago50 = orden.montoTotal * 0.50;
                montoSugerido = Math.min(pago50, saldoPendiente);
                break;

            case 4:
                tipoVisual = 'plazos';
                const pago33 = orden.montoTotal / 3;
                montoSugerido = Math.min(pago33, saldoPendiente);
                break;

            default:
                tipoVisual = 'unico';
                montoSugerido = saldoPendiente;
        }
        montoSugerido = Math.max(0, Math.min(montoSugerido, saldoPendiente));
        return { tipoVisual, montoSugerido };
    };

    return (
        <>
            <Toast ref={toast} />

            <div className="card">
                <div className="flex flex-wrap gap-2 mb-4">
                    <Link href="/listclient" passHref legacyBehavior>
                        <a className="p-button p-component p-button-outlined p-button-icon-left">
                            <i className="pi pi-users p-button-icon p-button-icon-left"></i>
                            <span className="p-button-label">Lista de clientes</span>
                        </a>
                    </Link>
                    <Button label="Lista de cotizaciones" icon="pi pi-list" outlined onClick={() => setShowQuotesList(true)} />
                    <Button label="Lista de ordenes" icon="pi pi-inbox" outlined onClick={() => setShowOrdersList(true)} />
                </div>

                {/* --- BUSCADOR DE PRODUCTOS --- */}
                <div className="p-fluid grid formgrid">
                    <div className="field col-12">
                        <span className="p-float-label">
                            <AutoComplete
                                inputId="searchProduct"
                                field="descripcion"
                                value={selectedProduct}
                                suggestions={products}
                                completeMethod={searchProduct}
                                onChange={(e) => setSelectedProduct(e.value)}
                                onSelect={onProductSelect}
                                dropdown
                                placeholder="Escribe para buscar productos..."
                            />
                            <label htmlFor="searchProduct">Buscar y agregar un producto</label>
                        </span>
                    </div>
                </div>

                {/* --- Lista de Productos agregados --- */}
                <DataTable value={quoteItems} size="small" emptyMessage="Carrito vacío.">
                    <Column field="descripcion" header="Descripción" style={{ width: '40%' }} />
                    <Column
                        field="precioUnitario"
                        header="Precio Unitario"
                        body={(d) => `$${d.precioUnitario.toFixed(2)}`}
                        style={{ width: '15%' }}
                    />
                    <Column field="cantidad" header="Cantidad" style={{ width: '15%' }} />
                    <Column
                        field="importe"
                        header="Total"
                        body={(d) => (
                            <span className="text-green-700 text-lg">
                                ${d.importe.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </span>
                        )}
                        style={{ width: '15%', fontWeight: 'bold', textAlign: 'right' }}
                    />
                    <Column body={(d) => <Button icon="pi pi-trash" rounded text severity="danger" onClick={() => handleDelete(d)} />} style={{ width: '8%' }} />
                </DataTable>

                <div className="flex justify-content-end mt-4 align-items-center gap-4">
                    <h3 className="m-0 text-gray-700">Total: ${currentCartTotal.toFixed(2)}</h3>
                    <Button label="Cotizar" icon="pi pi-money-bill" className="p-button-lg" onClick={() => setShowQuoteSummary(true)} disabled={quoteItems.length === 0} />
                </div>

                <QuoteListDialog
                    visible={ShowQuoteList}
                    onHide={() => setShowQuotesList(false)}
                    quotes={quotesList}
                    clients={clients}
                    loading={isLoadingList}
                    totalRecords={totalRecords}
                    lazyParams={lazyParams}
                    onPage={onPage}
                    expandedRows={expandedRows}
                    onRowToggle={setExpandedRows}
                    onRetake={handleOrder}
                />

                {/* MODAL: LISTA DE ÓRDENES */}
                <ActiveOrdersDialog
                    visible={ShowOrdersList}
                    onHide={() => setShowOrdersList(false)}
                    orders={ordersList}
                    clients={clients}
                    loading={isLoadingList}
                    totalRecords={totalRecords}
                    lazyParams={lazyParams}
                    onPage={onPage}
                    expandedRows={expandedRows}
                    onRowToggle={setExpandedRows}
                    onQuickPay={handleQuickPay}
                />

                {/* MODAL: RESUMEN DE COTIZACIÓN */}
                <QuoteSummaryDialog
                    visible={showQuoteSummary}
                    onHide={handleCloseQuoteSummary}
                    items={quoteItems}
                    total={currentCartTotal}
                    productionTime={estimatedProductionTime}
                    assignedClient={assignedClient}
                    onAssignClient={() => setShowAssignClientDialog(true)}
                    onNewClient={() => setShowAddNewClientDialog(true)}
                    designers={designers}
                    selectedDesigner={selectedDesigner}
                    onSelectDesigner={setSelectedDesigner}
                    requiresBilling={requiresBilling}
                    onToggleBilling={setRequiresBilling}
                    onConfirm={handleCreateQuote}
                />

                {/* MODAL: RESUMEN Y PAGO DE ORDEN */}
                <OrderPaymentDialog
                    visible={showOrderSummary}
                    onHide={() => setShowOrderSummary(false)}
                    orderId={activeOrderId}
                    items={activeOrderItems}
                    total={activeOrderTotal}
                    paidAmount={activeOrderPaid}
                    paymentConditions={paymentConditions}
                    isSubmitting={isSubmitting}
                    onConfirmPayment={handleProcessPayment}
                />

                {/* MODAL: SELECCION DE CLIENTE*/}
                <ClientSearchDialog
                    visible={showAssignClientDialog}
                    clients={clients}
                    onHide={() => setShowAssignClientDialog(false)}
                    onSelect={handleClientSelected}
                />

                {/* MODAL: NUEVO CLIENTE*/}
                <ClientFormDialog
                    visible={showAddNewClientDialog}
                    onHide={() => setShowAddNewClientDialog(false)}
                    onSuccess={handleClientCreated}
                />

                {/* MODAL: AGREGAR CANTIDAD*/}
                <ProductQuantityDialog
                    visible={showQuantityDialog}
                    product={pendingProduct}
                    onHide={() => {
                        setShowQuantityDialog(false);
                        setPendingProduct(null);
                    }}
                    onConfirm={handleAddProductFromModal}
                />

            </div>
        </>
    );
};

export default Counter;