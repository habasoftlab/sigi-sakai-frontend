/* eslint-disable @next/next/no-img-element */
'use client';
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { AutoComplete, AutoCompleteCompleteEvent } from 'primereact/autocomplete';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Button } from 'primereact/button';
import { Dropdown } from 'primereact/dropdown';
import { Checkbox } from 'primereact/checkbox';
import { InputNumber, InputNumberValueChangeEvent } from 'primereact/inputnumber';
import { InputText } from 'primereact/inputtext';
import { Dialog } from 'primereact/dialog';
import { Toast } from 'primereact/toast';
import { Divider } from 'primereact/divider';
import { FileUpload, FileUploadHandlerEvent } from 'primereact/fileupload';
import Link from 'next/link';

// SERVICIOS
import { ClientService } from "@/app/service/clientService";
import { CatalogService } from "@/app/service/catalogService";
import { OrderService } from "@/app/service/orderService";
import { Client } from "@/app/types/clients";
import { Producto, NuevaOrdenRequest } from "@/app/types/orders";
import { ClientFormDialog } from "@/app/components/ClientFormDialog";
import { ClientSearchDialog } from "@/app/components/ClientSearchDialog";
import { UserService } from "@/app/service/userService";

interface QuoteItemUI extends Producto {
    cantidad: number;
    importe: number;
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
    const [expandedRows, setExpandedRows] = useState<any>([]);
    const [activeOrderItems, setActiveOrderItems] = useState<any[]>([]);
    const [paymentConditions, setPaymentConditions] = useState<any[]>([]);
    const [activeOrderStatus, setActiveOrderStatus] = useState<number>(0);
    const [activeOrderPaid, setActiveOrderPaid] = useState(0);

    // DATOS PARA LISTAS
    const [ShowOrdersList, setShowOrdersList] = useState(false);
    const [ordersList, setOrdersList] = useState<any[]>([]);
    const [quotesList, setQuotesList] = useState<any[]>([]);
    const [isLoadingList, setIsLoadingList] = useState(false);
    const [orderNotes, setOrderNotes] = useState('');
    const [ShowQuoteList, setShowQuotesList] = useState(false);
    const [statusMap, setStatusMap] = useState<any>({});
    const [totalRecords, setTotalRecords] = useState(0);
    const [lazyParams, setLazyParams] = useState({
        first: 0,
        rows: 10,
        page: 0
    });

    // VARIABLES TEMPORALES (Inputs)
    const [selectedProduct, setSelectedProduct] = useState<any>(null);
    const [pendingProduct, setPendingProduct] = useState<Producto | null>(null);
    const [pendingQuantity, setPendingQuantity] = useState<number>(1);

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
        loadOrderHistory(event.page, event.rows);
    };

    const handleAddPayment = (orderRow: any) => {
        setActiveOrderId(orderRow.idOrden);
        setActiveOrderTotal(orderRow.saldoPendiente);
        setQuoteItems([]);
        setShowOrdersList(false);
        setPaymentType('unico');
        setAdvanceAmount(orderRow.saldoPendiente);
        setOrderNotes('');
        setShowOrderSummary(true);
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

    const onTemplateUpload = async (e: FileUploadHandlerEvent) => {
        if (activeOrderId) {
            await OrderService.subirArchivo(activeOrderId, e.files[0]);
            toast.current?.show({ severity: 'success', detail: 'Archivo subido' });
            e.options.clear();
        } else {
            toast.current?.show({ severity: 'warn', detail: 'Solo se pueden subir archivos a órdenes activas' });
        }
    };

    const searchProduct = async (e: AutoCompleteCompleteEvent) => {
        if (!e.query.trim()) { setProducts([]); return; }
        try { setProducts(await CatalogService.getProductos(e.query)); } catch (err) { }
    };
    const onProductSelect = (e: any) => {
        if (e.value && !quoteItems.find(i => i.idProducto === e.value.idProducto)) {
            setPendingProduct(e.value); setPendingQuantity(1); setShowQuantityDialog(true);
        }
        setSelectedProduct(null);
    };

    const handleAddItem = () => {
        if (!pendingProduct) return;
        const newItem: QuoteItemUI = {
            ...pendingProduct,
            cantidad: pendingQuantity,
            importe: pendingProduct.precioUnitario * pendingQuantity,
        };
        setQuoteItems([...quoteItems, newItem]);
        setShowQuantityDialog(false);
        setPendingProduct(null);
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

    const headerTemplate = (data: any, options: any) => {
        return (
            <div
                className="inline-flex align-items-center gap-2 px-2 py-1 cursor-pointer transition-colors border-round hover:surface-100"
                style={{ verticalAlign: 'middle' }}
                onClick={options.onTogglerClick}
            >
                <i className="pi pi-user text-primary text-xl"></i>
                <span className="font-bold text-lg text-900">
                    {data.nombreDisenador}
                </span>
            </div>
        );
    };

    const handleConfirmOrder = async () => {
        if (!activeOrderId) return;
        if (isSubmitting) return;
        setIsSubmitting(true);
        try {
            let condicionEncontrada: any = null;
            if (paymentType === 'unico') {
                condicionEncontrada = paymentConditions.find(c => c.numeroPlazos === 1);
            }
            else if (paymentType === 'anticipo') {
                condicionEncontrada = paymentConditions.find(c => c.descripcion.includes('20%'))
                    || paymentConditions.find(c => c.numeroPlazos === 2);
            }
            else if (paymentType === 'plazos') {
                if (activeOrderTotal >= 3000) {
                    condicionEncontrada = paymentConditions.find(c => c.numeroPlazos === 3);
                } else {
                    condicionEncontrada = paymentConditions.find(c => c.descripcion.includes('50%'))
                        || paymentConditions.find(c => c.numeroPlazos === 2 && !c.descripcion.includes('20%'));
                }
            }
            const idCondicionFinal = condicionEncontrada ? condicionEncontrada.idCondicion : 1;
            if (!condicionEncontrada) {
                console.warn("No se encontró la condición exacta en el catálogo, usando ID 1 por defecto.");
            }
            await OrderService.updateCondicionPago(activeOrderId, idCondicionFinal);
            if (advanceAmount > 0) {
                await OrderService.registrarPago(activeOrderId, {
                    monto: advanceAmount,
                    referencia: `Pago ${paymentType} - ${orderNotes}`,
                    idUsuario: currentUserId
                });
            }
            if (activeOrderStatus === 1) {
                const statusUpdateBody = { idUsuario: currentUserId };
                await OrderService.avanzarEstatus(activeOrderId, statusUpdateBody);
            }
            toast.current?.show({
                severity: 'success',
                summary: 'Orden Confirmada',
                detail: `Pago registrado y orden enviada a producción.`
            });
            setShowOrderSummary(false);
            setActiveOrderId(null);
            setOrderNotes('');
            setAdvanceAmount(0);
            setActiveOrderItems([]);
            loadOrderHistory();
        } catch (error: any) {
            const msg = error.message || error.details || "No se pudo procesar la solicitud.";
            toast.current?.show({
                severity: 'error',
                summary: 'Atención',
                detail: msg,
                life: 6000
            });
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
                    montoSugerido = orden.montoTotal * 0.20;
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
                    <Column field="importe" header="Total" body={(d) => `$${d.importe}`} style={{ width: '15%', fontWeight: 'bold' }} />
                    <Column body={(d) => <Button icon="pi pi-trash" rounded text severity="danger" onClick={() => handleDelete(d)} />} style={{ width: '8%' }} />
                </DataTable>

                <div className="flex justify-content-end mt-4 align-items-center gap-4">
                    <h3 className="m-0 text-gray-700">Total: ${currentCartTotal.toFixed(2)}</h3>
                    <Button label="Cotizar" icon="pi pi-money-bill" className="p-button-lg" onClick={() => setShowQuoteSummary(true)} disabled={quoteItems.length === 0} />
                </div>

                {/* MODAL: LISTA DE COTIZACIONES */}
                <Dialog
                    header="Lista de Cotizaciones"
                    visible={ShowQuoteList}
                    style={{ width: '80vw', minWidth: '350px' }}
                    modal
                    onHide={() => setShowQuotesList(false)}
                >
                    <DataTable
                        lazy={true}
                        paginator={true}
                        first={lazyParams.first}
                        rows={lazyParams.rows}
                        totalRecords={totalRecords}
                        onPage={onPage}
                        rowsPerPageOptions={[5, 10]}
                        value={quotesList}
                        loading={isLoadingList}
                        emptyMessage="No hay cotizaciones."
                        rowGroupMode="subheader"
                        groupRowsBy="nombreDisenador"
                        sortMode="single"
                        sortField="nombreDisenador"
                        sortOrder={1}
                        rowGroupHeaderTemplate={headerTemplate}
                        expandableRowGroups
                        expandedRows={expandedRows}
                        onRowToggle={(e) => setExpandedRows(e.data)}
                    >
                        <Column
                            field="idOrden"
                            header="Folio"
                            style={{ width: '10%' }}
                            body={(rowData) => <span className="font-bold">#{rowData.idOrden}</span>}
                        />
                        <Column
                            field="fechaCreacion"
                            header="Fecha"
                            style={{ width: '15%' }}
                            body={(rowData) => new Date(rowData.fechaCreacion).toLocaleDateString()}
                        />
                        <Column
                            header="Cliente"
                            field="idCliente"
                            style={{ width: '30%' }}
                            body={(d) => {
                                const c = clients.find(cl => cl.id === d.idCliente);
                                return c ? c.nombre : 'Desconocido';
                            }}
                        />
                        <Column
                            field="montoTotal"
                            header="Total"
                            body={(d) => `$${d.montoTotal.toFixed(2)}`}
                            style={{ width: '20%' }}
                        />
                        <Column
                            header=""
                            style={{ width: '15%', textAlign: 'center' }}
                            body={(data) => (
                                <Button
                                    label="Retomar"
                                    icon="pi pi-arrow-right"
                                    size="small"
                                    severity="info"
                                    onClick={() => handleOrder(data)}
                                />
                            )}
                        />
                    </DataTable>
                </Dialog>

                {/* MODAL: LISTA DE ÓRDENES */}
                <Dialog
                    header="Lista de Órdenes"
                    visible={ShowOrdersList}
                    style={{ width: '80vw' }}
                    modal
                    onHide={() => setShowOrdersList(false)}
                >
                    <DataTable
                        lazy={true}
                        paginator={true}
                        first={lazyParams.first}
                        rows={lazyParams.rows}
                        totalRecords={totalRecords}
                        onPage={onPage}
                        rowsPerPageOptions={[5, 10]}
                        value={ordersList}
                        rowGroupMode="subheader"
                        groupRowsBy="nombreDisenador"
                        sortMode="single"
                        sortField="nombreDisenador"
                        sortOrder={1}
                        rowGroupHeaderTemplate={headerTemplate}
                        expandableRowGroups
                        expandedRows={expandedRows}
                        onRowToggle={(e) => setExpandedRows(e.data)}
                    >
                        <Column field="idOrden" header="Folio" sortable style={{ width: '10%' }} />
                        <Column field="fechaCreacion" header="Fecha" body={(d) => new Date(d.fechaCreacion).toLocaleDateString()} style={{ width: '15%' }} />
                        <Column header="Cliente" field="idCliente" sortable body={(d) => clients.find(c => c.id === d.idCliente)?.nombre || 'Desconocido'} />
                        <Column field="montoTotal" header="Total" body={(d) => `$${d.montoTotal.toFixed(2)}`} />
                        <Column field="saldoPendiente" header="Saldo" body={(d) => <span className={d.saldoPendiente > 0 ? 'text-red-500 font-bold' : 'text-green-500'}>${d.saldoPendiente?.toFixed(2)}</span>} />
                        <Column header="Pagos" style={{ textAlign: 'center' }} body={(data) => (
                            data.saldoPendiente > 0 ?
                                <Button label="Abonar" icon="pi pi-dollar" severity="success" size="small" onClick={() => handleQuickPay(data)} /> :
                                <i className="pi pi-check-circle text-green-500 text-xl" title="Pagado"></i>
                        )} />
                    </DataTable>
                </Dialog>

                {/*MODAL: RESUMEN DE COTIZACIÓN*/}
                <Dialog
                    header="Confirmar Nueva Cotización"
                    visible={showQuoteSummary}
                    style={{ width: '60vw', minWidth: '500px' }}
                    modal
                    onHide={handleCloseQuoteSummary}
                >
                    <div className="grid">
                        <div className="col-12 md:col-8">
                            <DataTable value={quoteItems} responsiveLayout="scroll" size="small" showGridlines stripedRows>
                                <Column
                                    header="Descripción del producto"
                                    body={(rowData) => (
                                        <span className="font-semibold">
                                            {rowData.descripcion || rowData.nombre || rowData.producto?.nombre || "Producto sin nombre"}
                                        </span>
                                    )}
                                ></Column>
                                <Column field="cantidad" header="Cantidad" body={(item) => `${item.cantidad} u`} className="text-center"></Column>
                                <Column field="importe" header="Importe" body={(item) => `$${item.importe.toFixed(2)}`} className="text-right font-bold"></Column>
                            </DataTable>

                            {/* Totales y Tiempos */}
                            <div className="flex flex-column align-items-end mt-4 gap-2">
                                <div className="text-xl font-bold text-900">
                                    Total: <span className="text-primary text-2xl ml-2">${quoteTotal.toFixed(2)}</span>
                                </div>
                                <div className="text-600 flex align-items-center gap-2 bg-yellow-50 p-2 border-round">
                                    <i className="pi pi-clock text-orange-500"></i>
                                    <span className="font-medium">Producción estimada: {estimatedProductionTime} días hábiles</span>
                                </div>
                            </div>
                        </div>

                        <div className="col-12 md:col-4 p-fluid flex flex-column gap-3">
                            {/* Selector de Cliente */}
                            {assignedClient ? (
                                <div className="surface-100 p-3 border-round border-1 border-300 relative">
                                    <div className="text-xs text-500 uppercase font-bold mb-1">Cliente Asignado</div>
                                    <div className="font-bold text-lg text-900 mb-1">{assignedClient.nombre}</div>
                                    <div className="text-sm text-700 flex align-items-center gap-2">
                                        <i className="pi pi-id-card"></i>
                                        {assignedClient.rfc || 'Sin RFC'}
                                    </div>
                                    <Button
                                        icon="pi pi-pencil"
                                        className="p-button-rounded p-button-text p-button-secondary absolute top-0 right-0 mt-2 mr-2"
                                        onClick={() => setShowAssignClientDialog(true)}
                                        tooltip="Cambiar cliente"
                                    />
                                </div>
                            ) : (
                                <div className="flex flex-column gap-2 border-1 border-dashed border-300 p-3 border-round surface-50">
                                    <span className="text-center text-600 text-sm mb-1">Se requiere un cliente</span>
                                    <Button label="Buscar Cliente" icon="pi pi-search" onClick={() => setShowAssignClientDialog(true)} severity="secondary" />
                                    <Button label="Nuevo Cliente" icon="pi pi-user-plus" outlined onClick={() => setShowAddNewClientDialog(true)} />
                                </div>
                            )}

                            <Divider />

                            {/* Selector de Diseñador */}
                            <span className="p-float-label mt-2">
                                <Dropdown
                                    inputId="designer-select"
                                    value={selectedDesigner}
                                    onChange={(e) => setSelectedDesigner(e.value)}
                                    options={designers}
                                    optionLabel="label"
                                    optionValue="value"
                                    placeholder="Seleccionar Diseñador"
                                    showClear
                                    className="w-full"
                                />
                                <label htmlFor="designer-select">Asignar a Diseñador</label>
                            </span>

                            {/* Facturación */}
                            <div className={`field-checkbox mt-2 p-3 border-round border-1 ${requiresBilling ? 'surface-100 border-primary' : 'surface-0 border-300'}`}>
                                <Checkbox
                                    inputId="facturacion"
                                    checked={requiresBilling}
                                    onChange={(e) => setRequiresBilling(e.checked ?? false)}
                                    disabled={!assignedClient || !assignedClient.rfc}
                                />
                                <label htmlFor="facturacion" className="ml-2 cursor-pointer w-full">
                                    <span className="font-medium">¿Requiere Factura?</span>
                                    {(!assignedClient || !assignedClient.rfc) &&
                                        <div className="text-red-500 text-xs mt-1">
                                            <i className="pi pi-exclamation-circle mr-1"></i>
                                            Cliente sin RFC
                                        </div>
                                    }
                                </label>
                            </div>

                            <Button
                                label="Crear Cotización"
                                icon="pi pi-save"
                                className="p-button-lg mt-auto shadow-4"
                                onClick={handleCreateQuote}
                                disabled={!assignedClient}
                            />
                        </div>
                    </div>
                </Dialog>

                {/*MODAL: RESUMEN DE LA ORDEN*/}
                <Dialog
                    header={activeOrderItems.length > 0 ? `Resumen de la orden #${activeOrderId || ''}` : `Abonar orden #${activeOrderId || ''}`}
                    visible={showOrderSummary}
                    style={{ width: '85vw', maxWidth: '1200px' }}
                    modal
                    onHide={() => {
                        setShowOrderSummary(false);
                        setActiveOrderId(null);
                        setPaymentType('unico');
                        setAdvanceAmount(0);
                        setOrderNotes('');
                    }}
                >
                    <div className="grid">
                        {/* COLUMNA IZQUIERDA: DETALLES Y ARCHIVOS */}
                        <div className="col-12 lg:col-8">
                            <div className="surface-card p-4 border-round shadow-1 h-full">
                                <h3 className="mb-4 text-700 text-xl font-bold flex align-items-center gap-2">
                                    <i className="pi pi-list text-primary"></i>
                                    Detalle de la Orden
                                </h3>
                                <DataTable
                                    value={activeOrderItems}
                                    responsiveLayout="scroll"
                                    size="small"
                                    showGridlines
                                    stripedRows
                                    emptyMessage={
                                        <div className="text-center p-4">
                                            <i className="pi pi-wallet text-4xl text-green-500 mb-2"></i>
                                            <p className="font-bold text-xl m-0">Modo de Cobranza Rápida</p>
                                            <p className="text-gray-600">Registrando pago para el saldo pendiente.</p>
                                        </div>
                                    }
                                >
                                    <Column field="descripcion" header="Producto" />
                                    <Column field="cantidad" header="Cant." className="text-center" style={{ width: '10%' }} />
                                    <Column field="costo" header="Precio" body={(d) => `$${d.costo}`} className="text-right" style={{ width: '20%' }} />
                                    <Column field="importe" header="Total" body={(d) => `$${d.importe.toFixed(2)}`} className="text-right font-bold" style={{ width: '20%' }} />
                                </DataTable>

                                <div className="flex justify-content-end mt-5">
                                    <div className="text-right p-3 border-round surface-50 border-1 border-200">
                                        <span className="text-xl text-600 mr-3">
                                            {activeOrderItems.length > 0 ? "Total de la Orden:" : "Total de la Orden:"}
                                        </span>
                                        <span className="text-3xl font-bold text-primary">${activeOrderTotal.toFixed(2)}</span>
                                    </div>
                                </div>
                                <Divider />

                                <div className="mb-4">
                                    <label className="font-bold block mb-2 text-700">
                                        <i className="pi pi-cloud-upload mr-2"></i>
                                        Archivos / Diseño
                                    </label>
                                    <FileUpload
                                        name="demo[]"
                                        customUpload
                                        uploadHandler={onTemplateUpload}
                                        mode="advanced"
                                        accept="image/*,application/pdf"
                                        maxFileSize={10000000}
                                        chooseLabel="Examinar"
                                        uploadLabel="Subir"
                                        cancelLabel="Cancelar"
                                        emptyTemplate={<p className="m-0 p-3 text-center text-500">Arrastra archivos aquí.</p>}
                                    />
                                </div>
                            </div>
                        </div>

                        {/* COLUMNA DERECHA: LÓGICA FINANCIERA */}
                        <div className="col-12 lg:col-4">
                            <div className="surface-card p-4 border-round shadow-1 h-full flex flex-column">
                                <h3 className="mb-3 text-700 text-xl font-bold">Método de Pago</h3>
                                <div className="flex flex-column gap-2 mb-4">
                                    {/* LIQUIDAR: Bloqueará el input y pone el saldo restante */}
                                    <Button
                                        label="Pago Total"
                                        icon="pi pi-check-circle"
                                        className={`p-button-sm text-left ${paymentType === 'unico' ? 'p-button-primary' : 'p-button-outlined p-button-secondary'}`}
                                        onClick={() => {
                                            setPaymentType('unico');
                                            const saldo = (activeOrderTotal || 0) - (activeOrderPaid || 0);
                                            setAdvanceAmount(Number(saldo.toFixed(2)));
                                        }}
                                    />
                                    {/* ANTICIPO: Siempre 20% del total (Fijo) */}
                                    <Button
                                        label={`Anticipo (20%)`}
                                        icon="pi pi-wallet"
                                        className={`p-button-sm text-left ${paymentType === 'anticipo' ? 'p-button-primary' : 'p-button-outlined p-button-secondary'}`}
                                        onClick={() => {
                                            setPaymentType('anticipo');
                                            const anticipo = (activeOrderTotal || 0) * 0.20;
                                            setAdvanceAmount(Number(anticipo.toFixed(2)));
                                        }}
                                    />
                                    {/* PLAZOS */}
                                    <Button
                                        label={`Esquema de Plazos (${activeOrderTotal >= 3000 ? '3' : '2'} Pagos)`}
                                        icon="pi pi-calendar"
                                        className={`p-button-sm text-left ${paymentType === 'plazos' ? 'p-button-primary' : 'p-button-outlined p-button-secondary'}`}
                                        onClick={() => {
                                            setPaymentType('plazos');
                                            const divisor = activeOrderTotal >= 3000 ? 3 : 2;
                                            const letra = (activeOrderTotal || 0) / divisor;
                                            const saldo = (activeOrderTotal || 0) - (activeOrderPaid || 0);
                                            const montoFinal = letra > saldo ? saldo : letra;
                                            setAdvanceAmount(Number(montoFinal.toFixed(2)));
                                        }}
                                        disabled={(activeOrderTotal || 0) < 1000}
                                    />
                                </div>
                                <Divider />
                                {/* Input del Monto */}
                                <div className="mb-2">
                                    <label className="font-bold block mb-2 text-700">Monto a cobrar hoy</label>
                                    <div className="p-inputgroup">
                                        <span className="p-inputgroup-addon text-green-600 font-bold">$</span>
                                        <InputNumber
                                            value={advanceAmount}
                                            onValueChange={(e) => setAdvanceAmount(e.value ?? 0)}
                                            placeholder="0.00"
                                            mode="currency"
                                            currency="MXN"
                                            locale="es-MX"
                                            minFractionDigits={2}
                                            min={0}
                                            inputStyle={{ fontWeight: 'bold', fontSize: '1.2rem' }}
                                            disabled={paymentType === 'unico'}
                                            className={advanceAmount > (activeOrderTotal - activeOrderPaid) ? 'p-invalid' : ''}
                                        />
                                    </div>
                                    {/* Mensajes de Validación / Ayuda */}
                                    <div className="mt-1">
                                        {/* AVISO: Si escribe más de lo que debe */}
                                        {advanceAmount > (activeOrderTotal - activeOrderPaid + 0.1) && (
                                            <div className="text-red-500 text-xs font-bold animate-fade-in">
                                                <i className="pi pi-times-circle mr-1"></i>
                                                El monto excede el saldo pendiente (${(activeOrderTotal - activeOrderPaid).toFixed(2)})
                                            </div>
                                        )}
                                        {/* AVISO: Mínimo sugerido para anticipos */}
                                        {paymentType === 'anticipo' && activeOrderTotal > 0 && advanceAmount < (activeOrderTotal * 0.20) && (
                                            <div className="text-orange-500 text-xs flex align-items-center gap-1">
                                                <i className="pi pi-info-circle"></i>
                                                <span>Sugerido 20%: ${(activeOrderTotal * 0.20).toFixed(2)}</span>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Boleta de Saldos*/}
                                <div className="surface-100 p-3 border-round mb-4 mt-2 text-sm">
                                    <div className="flex justify-content-between mb-1">
                                        <span className="text-600">Total Orden:</span>
                                        <span className="font-semibold">${activeOrderTotal.toFixed(2)}</span>
                                    </div>
                                    {activeOrderPaid > 0 && (
                                        <div className="flex justify-content-between mb-1">
                                            <span className="text-600">Abonado anteriormente:</span>
                                            <span className="font-semibold text-green-600">-${activeOrderPaid.toFixed(2)}</span>
                                        </div>
                                    )}
                                    <div className="flex justify-content-between mb-2 pt-2 border-top-1 border-300">
                                        <span className="text-800 font-bold">Saldo Pendiente:</span>
                                        <span className="font-bold text-900">${(activeOrderTotal - activeOrderPaid).toFixed(2)}</span>
                                    </div>
                                    <div className="flex justify-content-between mb-2 align-items-center bg-white p-2 border-round">
                                        <span className="text-primary font-bold">Abonar Hoy:</span>
                                        <span className="font-bold text-primary text-lg">-${advanceAmount.toFixed(2)}</span>
                                    </div>
                                    <div className="border-top-1 surface-border my-2"></div>
                                    <div className="flex justify-content-between align-items-center">
                                        <span className="text-900 font-medium">Restante Final:</span>
                                        <span className={`text-lg font-bold ${(activeOrderTotal - activeOrderPaid - advanceAmount) <= 0.1
                                            ? 'text-green-500'
                                            : 'text-red-500'
                                            }`}>
                                            ${Math.max(0, activeOrderTotal - activeOrderPaid - advanceAmount).toFixed(2)}
                                        </span>
                                    </div>
                                </div>

                                <InputText
                                    className="w-full mb-4"
                                    value={orderNotes}
                                    onChange={(e) => setOrderNotes(e.target.value)}
                                    placeholder="Referencia de pago / Notas..."
                                />
                                <Button
                                    label="Confirmar Pago"
                                    icon="pi pi-check-circle"
                                    size="large"
                                    className="mt-auto w-full shadow-3"
                                    onClick={handleConfirmOrder}
                                    disabled={
                                        !advanceAmount ||
                                        advanceAmount <= 0 ||
                                        advanceAmount > (activeOrderTotal - activeOrderPaid + 0.5)
                                    }
                                />
                            </div>
                        </div>
                    </div>
                </Dialog>

                <ClientSearchDialog
                    visible={showAssignClientDialog}
                    clients={clients}
                    onHide={() => setShowAssignClientDialog(false)}
                    onSelect={handleClientSelected}
                />

                <ClientFormDialog
                    visible={showAddNewClientDialog}
                    onHide={() => setShowAddNewClientDialog(false)}
                    onSuccess={handleClientCreated}
                />

                <Dialog
                    header={pendingProduct?.descripcion}
                    visible={showQuantityDialog}
                    style={{ width: '30vw', minWidth: '350px' }}
                    modal
                    onHide={() => {
                        setShowQuantityDialog(false);
                        setPendingProduct(null);
                    }}
                    footer={() => (
                        <div>
                            <Button label="Cancelar" icon="pi pi-times" onClick={() => setShowQuantityDialog(false)} className="p-button-text" />
                            <Button label="Agregar" icon="pi pi-check" onClick={handleAddItem} autoFocus />
                        </div>
                    )}
                >
                    <div className="field p-fluid">
                        <label htmlFor="cantidad"># Cantidad</label>
                        <InputNumber
                            id="cantidad"
                            value={pendingQuantity}
                            onValueChange={(e: InputNumberValueChangeEvent) => setPendingQuantity(e.value ?? 1)}
                            mode="decimal"
                            minFractionDigits={0}
                            min={pendingProduct?.tirajeMinimo ?? 1}
                            showButtons
                        />
                        <small>Tiraje mínimo: {pendingProduct?.tirajeMinimo}</small>
                    </div>
                </Dialog>
            </div>
        </>
    );
};

export default Counter;