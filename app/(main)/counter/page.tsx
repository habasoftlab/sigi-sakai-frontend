/* eslint-disable @next/next/no-img-element */
'use client';
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { AutoComplete, AutoCompleteCompleteEvent } from 'primereact/autocomplete';
import { DataTable, DataTableRowEditCompleteEvent } from 'primereact/datatable';
import { Column, ColumnEditorOptions } from 'primereact/column';
import { Button } from 'primereact/button';
import { Dropdown } from 'primereact/dropdown';
import { Checkbox } from 'primereact/checkbox';
import { InputNumber, InputNumberValueChangeEvent } from 'primereact/inputnumber';
import { InputText } from 'primereact/inputtext';
import { Dialog } from 'primereact/dialog';
import { TreeTable } from 'primereact/treetable';
import { TreeNode } from 'primereact/treenode';
import { Toast } from 'primereact/toast';
import { Divider } from 'primereact/divider';
import { FileUpload } from 'primereact/fileupload';
import { FilterMatchMode } from 'primereact/api';
import Link from 'next/link';
import {
    allProducts,
    dummyClients,
    dummyQuotes,
    dummyOrders,
    designers,
    cfdiOptions,
    type Product,
    type QuoteItem,
    type NewClient,
    regimenFiscalOptions
} from '@/app/api/mockData';

const Counter = () => {
    const [selectedProduct, setSelectedProduct] = useState<any>(null);
    const [filteredProducts, setFilteredProducts] = useState<any[]>([]);
    const [quoteItems, setQuoteItems] = useState<any[]>([]);
    const [showQuotesDialog, setShowQuotesDialog] = useState(false);
    const [showOrdersDialog, setShowOrdersDialog] = useState(false);
    const [showQuantityDialog, setShowQuantityDialog] = useState(false);
    const [pendingProduct, setPendingProduct] = useState<Product | null>(null);
    const [pendingQuantity, setPendingQuantity] = useState<number>(1);
    const [showSummaryDialog, setShowSummaryDialog] = useState(false);
    const [selectedDesigner, setSelectedDesigner] = useState(null);
    const [showAssignClientDialog, setShowAssignClientDialog] = useState(false);
    const [showAddNewClientDialog, setShowAddNewClientDialog] = useState(false);
    const [selectedClient, setSelectedClient] = useState<any>(null);
    const [assignedClient, setAssignedClient] = useState<any>(null);
    const [newClientData, setNewClientData] = useState<NewClient>({
        name: '', email: '', phone: '', rfc: '', cfdi: '', cp: '', regimenFiscal: ''
    });
    const [requiresBilling, setRequiresBilling] = useState(false);
    const [quoteTree, setQuoteTree] = useState<TreeNode[]>([]);
    const [orderTree, setOrderTree] = useState<TreeNode[]>([]);
    const toast = useRef<Toast>(null);
    const [selectedQuote, setSelectedQuote] = useState<any>(null);
    const [showOrderSummaryDialog, setShowOrderSummaryDialog] = useState(false);
    const [paymentType, setPaymentType] = useState<'unico' | 'anticipo' | 'plazos'>('unico');
    const [advanceAmount, setAdvanceAmount] = useState<number>(0);
    const [orderNotes, setOrderNotes] = useState('');
    const [installmentsScheme, setInstallmentsScheme] = useState<2 | 3 | null>(null);
    const [globalFilterValue, setGlobalFilterValue] = useState('');

    // Estado para la lógica interna de filtrado de la tabla
    const [filters, setFilters] = useState({
        global: { value: null, matchMode: FilterMatchMode.CONTAINS }
    });

    // Preparar datos jerárquicos para TreeTable
    useEffect(() => {
        const transformToTree = (items: any[]) => {
            const groups = new Map<string, any[]>();
            items.forEach(item => {
                if (!groups.has(item.designer)) {
                    groups.set(item.designer, []);
                }
                groups.get(item.designer)?.push(item);
            });

            return Array.from(groups.entries()).map(([designerName, childrenItems], index) => ({
                key: `designer-${index}`,
                data: {
                    name: designerName,
                    cliente: '',
                    total: null,
                    estatus: ''
                },
                children: childrenItems.map(item => ({
                    key: item.id,
                    data: {
                        name: item.id,
                        cliente: item.cliente,
                        designer: item.designer,
                        total: item.total,
                        estatus: item.estatus,
                        items: item.items || []
                    }
                }))
            }));
        };

        setQuoteTree(transformToTree(dummyQuotes));
        setOrderTree(transformToTree(dummyOrders));
    }, []);

    useEffect(() => {
        const hasFiscalData = assignedClient && assignedClient.rfc && assignedClient.cfdi && assignedClient.cp;
        if (!hasFiscalData) {
            setRequiresBilling(false);
        }
    }, [assignedClient]);

    useEffect(() => {
        if (!selectedQuote) return;
        const total = selectedQuote.data.total || 0;

        switch (paymentType) {
            case 'unico':
                // Regla 1: Pago Único = 100%
                setAdvanceAmount(total);
                setInstallmentsScheme(null);
                break;

            case 'anticipo':
                // Regla 2: Anticipo = Por defecto sugerimos el 20%, pero es editable
                if (advanceAmount === total || advanceAmount === 0) {
                    setAdvanceAmount(total * 0.20);
                }
                setInstallmentsScheme(null);
                break;

            case 'plazos':
                // Regla 3: Plazos (Validación por monto)
                if (total >= 3000) {
                    // Esquema 3 plazos: 33% inicial
                    setInstallmentsScheme(3);
                    setAdvanceAmount(total * 0.3334); // Ajuste ligero para cubrir el tercio
                } else if (total >= 1000) {
                    // Esquema 2 plazos: 50% inicial
                    setInstallmentsScheme(2);
                    setAdvanceAmount(total * 0.50);
                } else {
                    // Fallback de seguridad (no debería poder seleccionarse visualmente)
                    setInstallmentsScheme(null);
                    setPaymentType('unico');
                }
                break;
        }
    }, [paymentType, selectedQuote]);

    const orderTableItems = useMemo(() => {
        if (!selectedQuote || !selectedQuote.data.items) return [];

        return selectedQuote.data.items.map((item: any) => ({
            ...item,
            clienteName: selectedQuote.data.cliente,
            designerName: selectedQuote.data.designer
        }));
    }, [selectedQuote]);

    const searchProduct = (event: AutoCompleteCompleteEvent) => {
        let _filteredProducts;
        if (!event.query.trim().length) {
            _filteredProducts = [...allProducts];
        } else {
            _filteredProducts = allProducts.filter((product) => {
                const queryLower = event.query.toLowerCase();
                return product.name.toLowerCase().includes(queryLower) ||
                    product.id.toLowerCase().includes(queryLower);
            });
        }
        setFilteredProducts(_filteredProducts);
    };

    const onProductSelect = (e: any) => {
        const product: Product = e.value;
        if (product && !quoteItems.find(item => item.id === product.id)) {
            setPendingProduct(product);
            setPendingQuantity(product.minOrder ?? 1);
            setShowQuantityDialog(true);
        }
        setSelectedProduct(null);
    };

    const handleAddItem = () => {
        if (!pendingProduct) return;
        const defaultCost = pendingProduct.pricePerUnit ?? pendingProduct.pricePerPackage ?? 0;
        const newItem: QuoteItem = {
            id: pendingProduct.id,
            descripcion: pendingProduct.name,
            costo: defaultCost,
            cantidad: pendingQuantity,
            importe: defaultCost * pendingQuantity
        };
        setQuoteItems([...quoteItems, newItem]);
        setShowQuantityDialog(false);
        setPendingProduct(null);
    };

    const quantityEditor = (options: ColumnEditorOptions) => {
        return <InputNumber value={options.value} onValueChange={(e: InputNumberValueChangeEvent) => options.editorCallback?.(e.value)} mode="decimal" minFractionDigits={0} />;
    };

    const quoteTotal = quoteItems.reduce((total, item) => total + item.importe, 0);

    const handleDelete = (itemToDelete: QuoteItem) => {
        const _items = quoteItems.filter(item => item.id !== itemToDelete.id);
        setQuoteItems(_items);
    };

    const handleNewClientChange = (e: any) => {
        const name = e.target?.name;
        const value = e.value ?? e.target?.value;
        setNewClientData(prev => ({ ...prev, [name]: value }));
    };

    const handleSaveNewClient = () => {
        setAssignedClient(newClientData);
        setNewClientData({ name: '', email: '', phone: '', rfc: '', cfdi: '', cp: '', regimenFiscal: '' });
        setShowAddNewClientDialog(false);
    };

    const handleAssignClient = () => {
        setAssignedClient(selectedClient);
        setShowAssignClientDialog(false);
    };

    const onRowEditComplete = (e: DataTableRowEditCompleteEvent) => {
        let { newData, index } = e;
        let _items = [...quoteItems];
        const updatedItem = { ..._items[index], ...newData };
        updatedItem.importe = updatedItem.costo * updatedItem.cantidad;
        _items[index] = updatedItem as QuoteItem;
        setQuoteItems(_items);
    };

    const treeTotalBodyTemplate = (node: TreeNode) => {
        if (node.data && node.data.total !== null) {
            return `$${node.data.total.toFixed(2)}`;
        }
        return '';
    };

    const estimatedProductionTime = useMemo(() => {
        if (quoteItems.length === 0) return 0;
        const timeArray = quoteItems.map(item => {
            const product = allProducts.find(p => p.id === item.id);
            if (product) {
                let days = parseInt(product.productionTime) || 0;
                if (product.volumeDiscount && item.cantidad > product.volumeDiscount) {
                    days += 2;
                }
                return days;
            }
            return 0;
        });
        return Math.max(...timeArray);
    }, [quoteItems]);

    const handleConfirmQuote = () => {
        toast.current?.show({
            severity: 'success',
            summary: 'Éxito',
            detail: 'Cotización creada correctamente',
            life: 3000
        });
        setShowSummaryDialog(false);
        setQuoteItems([]);
        setAssignedClient(null);
        setSelectedClient(null);
        setSelectedDesigner(null);
        setRequiresBilling(false);
    };

    // Función para abrir la nueva modal desde la lista de cotizaciones
    const handleOrder = () => {
        if (!selectedQuote) return;
        setShowQuotesDialog(false);
        setPaymentType('unico'); // Por defecto pago único
        setOrderNotes('');
        setShowOrderSummaryDialog(true);
    };

    const handleConfirmOrder = () => {
        if (!selectedQuote) return;
        const total = selectedQuote.data.total;

        // 1. Validación de seguridad (aunque el botón se bloquea visualmente)
        if (paymentType === 'anticipo' && advanceAmount < (total * 0.20)) {
            toast.current?.show({
                severity: 'error',
                summary: 'Anticipo Insuficiente',
                detail: 'El anticipo debe cubrir al menos el 20% del total.'
            });
            return;
        }

        // 2. Simulación de guardado de la orden
        const newOrder = {
            cotizacionRef: selectedQuote.data.name,
            cliente: selectedQuote.data.cliente,
            productos: selectedQuote.data.items,
            finanzas: {
                total: total,
                tipoPago: paymentType, // 'unico', 'anticipo', 'plazos'
                montoInicial: advanceAmount,
                saldoPendiente: total - advanceAmount,
                esquemaPlazos: paymentType === 'plazos' ? installmentsScheme : null // null, 2 o 3
            },
            notas: orderNotes,
            fecha: new Date()
        };

        console.log("Orden Procesada:", newOrder);

        // 3. Feedback al usuario
        toast.current?.show({
            severity: 'success',
            summary: 'Orden Creada',
            detail: `Orden generada correctamente. Pago inicial: $${advanceAmount.toFixed(2)}`
        });

        // 4. Limpieza y cierre
        setShowOrderSummaryDialog(false);
        setSelectedQuote(null);
        setPaymentType('unico');
        setAdvanceAmount(0);
        setOrderNotes('');
    };

    const onTemplateUpload = (e: any) => {
        let _totalSize = 0;
        e.files.forEach((file: any) => {
            _totalSize += file.size;
        });

        toast.current?.show({
            severity: 'info',
            summary: 'Éxito',
            detail: 'Diseño cargado correctamente',
            life: 3000
        });
        // Aquí podrías guardar el archivo en un estado si lo necesitas enviar luego
        // setUploadedFile(e.files[0]);
        e.options.clear();
    };

    const footerContent = (
        <div className="flex justify-content-end gap-2">
            <Button
                label="Cancelar"
                icon="pi pi-times"
                text
                onClick={() => {
                    setShowQuotesDialog(false);
                    setSelectedQuote(null); // <--- ¡IMPORTANTE! Limpia al cancelar
                }}
            />
            <Button
                label="Ordenar"
                icon="pi pi-shopping-cart"
                disabled={!selectedQuote}
                onClick={handleOrder}
            />
        </div>
    );

    const onGlobalFilterChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        let _filters = { ...filters };

        // @ts-ignore
        _filters['global'].value = value;

        setFilters(_filters);
        setGlobalFilterValue(value);
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

                    <Button label="Lista de cotizaciones" icon="pi pi-list" outlined onClick={() => setShowQuotesDialog(true)} />

                    <Button label="Lista de ordenes" icon="pi pi-inbox" outlined onClick={() => setShowOrdersDialog(true)} />

                </div>
                <div className="p-fluid grid formgrid">
                    <div className="field col-12">
                        <AutoComplete
                            field="name"
                            value={selectedProduct}
                            suggestions={filteredProducts}
                            completeMethod={searchProduct}
                            onChange={(e) => setSelectedProduct(e.value)}
                            onSelect={onProductSelect}
                            placeholder="Buscar y agregar un producto"
                            dropdown
                            id="searchProduct"
                        />
                    </div>
                </div>

                <DataTable value={quoteItems} editMode="row" dataKey="id" onRowEditComplete={onRowEditComplete} responsiveLayout="scroll">
                    <Column field="descripcion" header="Descripción del producto" style={{ width: '40%' }}></Column>
                    <Column field="costo" header="Costo" style={{ width: '20%' }}></Column>
                    <Column field="cantidad" header="Cantidad" editor={(options) => quantityEditor(options)} style={{ width: '20%' }}></Column>
                    <Column field="importe" header="Importe" style={{ width: '20%' }}></Column>
                    <Column rowEditor headerStyle={{ width: '10%' }} bodyStyle={{ textAlign: 'center' }}></Column>
                    <Column
                        body={(rowData: QuoteItem) => {
                            return <Button icon="pi pi-trash" rounded text onClick={() => handleDelete(rowData)} />;
                        }}
                        headerStyle={{ width: '10%' }}
                        bodyStyle={{ textAlign: 'center' }}
                    />
                </DataTable>

                <div className="flex justify-content-end mt-4">
                    <Button
                        label="Cotizar"
                        icon="pi pi-money-bill"
                        className="p-button-lg"
                        onClick={() => setShowSummaryDialog(true)}
                        disabled={quoteItems.length === 0}
                    />
                </div>

                {/* Modal de Cotizaciones */}
                <Dialog
                    header="Lista de Cotizaciones"
                    visible={showQuotesDialog}
                    style={{ width: '75vw', minWidth: '350px' }}
                    modal
                    footer={footerContent}
                    onHide={() => {
                        setShowQuotesDialog(false);
                        setSelectedQuote(null);
                    }}
                >
                    <TreeTable value={quoteTree} paginator rows={10} rowsPerPageOptions={[5, 10, 25]}>
                        <Column field="name" header="Diseñador" expander style={{ width: '25%' }} />
                        <Column field="cliente" header="Cliente" style={{ width: '25%' }} />
                        <Column field="total" header="Total" style={{ width: '20%' }} />
                        <Column field="estatus" header="Estatus" style={{ width: '20%' }} />
                        <Column
                            style={{ width: '10%', textAlign: 'center' }}
                            body={(node) => (
                                (!node.children || node.children.length === 0) && (
                                    <Button
                                        icon="pi pi-check"
                                        rounded
                                        outlined={selectedQuote?.key !== node.key}
                                        severity={selectedQuote?.key === node.key ? 'success' : 'secondary'}
                                        onClick={() => setSelectedQuote(selectedQuote?.key === node.key ? null : node)}
                                    />
                                )
                            )}
                        />
                    </TreeTable>
                </Dialog>

                {/* ---MODAL: RESUMEN DE LA ORDEN --- */}
                <Dialog
                    header="Resumen de la Orden"
                    visible={showOrderSummaryDialog}
                    style={{ width: '85vw', maxWidth: '1200px' }}
                    modal
                    onHide={() => {
                        setShowOrderSummaryDialog(false);
                        setSelectedQuote(null);
                        setPaymentType('unico');
                        setAdvanceAmount(0);
                        setOrderNotes('');
                    }}
                >
                    {selectedQuote && (
                        <div className="grid">
                            {/* COLUMNA IZQUIERDA: TABLA DE PRODUCTOS */}
                            <div className="col-12 lg:col-8">
                                <div className="surface-card p-4 border-round shadow-1 h-full">
                                    <h3 className="mb-4 text-gray-700 text-xl font-bold">Detalle de Productos</h3>
                                    <DataTable value={orderTableItems} responsiveLayout="scroll" size="small" showGridlines stripedRows>
                                        <Column field="descripcion" header="Producto" style={{ minWidth: '150px' }} />
                                        <Column field="clienteName" header="Cliente" />
                                        <Column field="designerName" header="Diseñador" />
                                        <Column field="cantidad" header="Cant." className="text-center" />
                                        <Column field="costo" header="Precio U." body={(d) => `$${d.costo}`} className="text-right" />
                                        <Column field="importe" header="Total" body={(d) => `$${d.importe.toFixed(2)}`} className="text-right font-bold" />
                                    </DataTable>

                                    <div className="flex justify-content-end mt-5">
                                        <div className="text-right p-3 border-round surface-50">
                                            <span className="text-xl text-gray-600 mr-3">Total Orden:</span>
                                            <span className="text-3xl font-bold text-primary">${selectedQuote.data.total.toFixed(2)}</span>
                                        </div>
                                    </div>

                                    <Divider />
                                    {/* SECCIÓN DE SUBIDA DE ARCHIVO (FileUpload) */}
                                    <div className="mb-4">
                                        <label className="font-bold block mb-2 text-gray-700">Subir Diseño</label>
                                        <FileUpload
                                            name="demo[]"
                                            customUpload
                                            uploadHandler={onTemplateUpload}
                                            mode="advanced"
                                            accept="image/*,application/pdf"
                                            maxFileSize={10000000}
                                            chooseLabel="Elegir"
                                            uploadLabel="Subir"
                                            cancelLabel="Cancelar"
                                            emptyTemplate={
                                                <div className="flex align-items-center justify-content-center flex-column">
                                                    <i className="pi pi-cloud-upload border-2 border-circle p-3 text-4xl text-400 border-400" />
                                                    <p className="mt-4 mb-0">Arrastra y suelta tu diseño aquí.</p>
                                                </div>
                                            }
                                            progressBarTemplate={
                                                <div className="w-full bg-gray-200 border-round h-1rem mt-2">
                                                    <div className="bg-primary h-full border-round" style={{ width: '100%' }}></div>
                                                </div>
                                            }
                                        />

                                    </div>
                                </div>
                            </div>

                            {/* COLUMNA DERECHA: LÓGICA DE PAGOS */}
                            <div className="col-12 lg:col-4">
                                <div className="surface-card p-4 border-round shadow-1 h-full flex flex-column">
                                    <h3 className="mb-3 text-gray-700 text-xl font-bold">Método de Pago</h3>

                                    {/* SELECTOR DE TRES OPCIONES */}
                                    <div className="flex flex-column gap-2 mb-4">
                                        {/* Opción 1: Total */}
                                        <Button
                                            label="Pago Total (100%)"
                                            icon="pi pi-check-circle"
                                            className={`p-button-sm text-left ${paymentType === 'unico' ? 'p-button-primary' : 'p-button-outlined p-button-secondary'}`}
                                            onClick={() => setPaymentType('unico')}
                                        />

                                        {/* Opción 2: Anticipo */}
                                        <Button
                                            label="Dejar Anticipo (Flexible)"
                                            icon="pi pi-wallet"
                                            className={`p-button-sm text-left ${paymentType === 'anticipo' ? 'p-button-primary' : 'p-button-outlined p-button-secondary'}`}
                                            onClick={() => setPaymentType('anticipo')}
                                            tooltip="Paga un mínimo del 20% para iniciar"
                                            tooltipOptions={{ showDelay: 500, position: 'left' }}
                                        />

                                        {/* Opción 3: Plazos (Condicional) */}
                                        <Button
                                            label={`Pago a Plazos (${selectedQuote.data.total >= 3000 ? '3 Pagos' : '2 Pagos'})`}
                                            icon="pi pi-calendar"
                                            className={`p-button-sm text-left ${paymentType === 'plazos' ? 'p-button-primary' : 'p-button-outlined p-button-secondary'}`}
                                            onClick={() => setPaymentType('plazos')}
                                            disabled={selectedQuote.data.total < 1000}
                                            tooltip={selectedQuote.data.total < 1000 ? "Solo disponible para pedidos mayores a $1,000" : "Esquema fijo de pagos"}
                                            tooltipOptions={{ showDelay: 300, position: 'left' }}
                                        />
                                        {selectedQuote.data.total < 1000 && <small className="text-gray-400 ml-2">* Plazos disponibles desde $1,000 MXN</small>}
                                    </div>
                                    <Divider />
                                    {/* INPUT Y DETALLES FINANCIEROS */}
                                    <div className="mb-2">
                                        <label className="font-bold block mb-2 text-gray-700">
                                            {paymentType === 'unico' && "Monto a liquidar"}
                                            {paymentType === 'anticipo' && "Definir Anticipo (Min 20%)"}
                                            {paymentType === 'plazos' && `Primer Pago (${installmentsScheme === 3 ? '33%' : '50%'})`}
                                        </label>
                                        <div className="p-inputgroup">
                                            <span className="p-inputgroup-addon text-green-600 font-bold">$</span>
                                            <InputNumber
                                                value={advanceAmount}
                                                onValueChange={(e) => {
                                                    if (paymentType === 'anticipo') setAdvanceAmount(e.value ?? 0);
                                                }}
                                                mode="currency"
                                                currency="MXN"
                                                locale="es-MX"
                                                // Deshabilitado si es Único (100%) o Plazos (Fijo)
                                                disabled={paymentType !== 'anticipo'}
                                                min={paymentType === 'anticipo' ? selectedQuote.data.total * 0.20 : 0}
                                                max={selectedQuote.data.total}
                                                className={paymentType === 'anticipo' ? '' : 'p-inputtext-sm opacity-100 font-bold text-black-alpha-90'}
                                                inputStyle={{ fontWeight: 'bold' }}
                                            />
                                        </div>

                                        {/* Mensajes de Ayuda / Validación */}
                                        {paymentType === 'anticipo' && (
                                            <small className={`block mt-1 ${advanceAmount < selectedQuote.data.total * 0.20 ? 'text-red-500' : 'text-green-600'}`}>
                                                Mínimo requerido: ${(selectedQuote.data.total * 0.20).toFixed(2)}
                                            </small>
                                        )}
                                    </div>

                                    {/* Resumen de Saldos */}
                                    <div className="bg-gray-50 p-3 border-round mb-4 mt-2 text-sm">
                                        <div className="flex justify-content-between mb-2">
                                            <span className="text-gray-600">Total Orden:</span>
                                            <span className="font-semibold">${selectedQuote.data.total.toFixed(2)}</span>
                                        </div>
                                        <div className="flex justify-content-between mb-2">
                                            <span className="text-gray-600">Pago Inicial:</span>
                                            <span className="font-bold text-primary">${advanceAmount.toFixed(2)}</span>
                                        </div>
                                        <div className="border-top-1 border-gray-300 my-2"></div>
                                        <div className="flex justify-content-between align-items-center">
                                            <span className="text-gray-800 font-medium">Restante:</span>
                                            <span className={`text-lg font-bold ${selectedQuote.data.total - advanceAmount <= 0.1 ? 'text-green-500' : 'text-red-500'}`}>
                                                ${(selectedQuote.data.total - advanceAmount).toFixed(2)}
                                            </span>
                                        </div>

                                        {/* Detalle del esquema de plazos */}
                                        {paymentType === 'plazos' && installmentsScheme === 3 && (
                                            <div className="mt-2 text-xs text-gray-500 font-italic">
                                                * Restan 2 pagos de ${((selectedQuote.data.total - advanceAmount) / 2).toFixed(2)}
                                            </div>
                                        )}
                                        {paymentType === 'plazos' && installmentsScheme === 2 && (
                                            <div className="mt-2 text-xs text-gray-500 font-italic">
                                                * Resta 1 pago de ${(selectedQuote.data.total - advanceAmount).toFixed(2)} antes de entrega.
                                            </div>
                                        )}
                                    </div>

                                    {/* Notas */}
                                    <div className="field mb-4">
                                        <InputText
                                            className="w-full"
                                            value={orderNotes}
                                            onChange={(e) => setOrderNotes(e.target.value)}
                                            placeholder="Notas adicionales..."
                                        />
                                    </div>

                                    {/* Botón Acción Principal */}
                                    <Button
                                        label="Confirmar Orden"
                                        icon="pi pi-check-circle"
                                        size="large"
                                        className="mt-auto w-full shadow-2"
                                        onClick={handleConfirmOrder}
                                        // Validación final para deshabilitar botón si no cumple el mínimo en anticipo
                                        disabled={paymentType === 'anticipo' && advanceAmount < (selectedQuote.data.total * 0.20)}
                                    />
                                </div>
                            </div>
                        </div>
                    )
                    }
                </Dialog>

                {/* Modal de Órdenes */}
                <Dialog header="Lista de Órdenes" visible={showOrdersDialog} style={{ width: '75vw', minWidth: '350px' }} modal onHide={() => setShowOrdersDialog(false)}>
                    <TreeTable
                        value={orderTree}
                        paginator
                        rows={10}
                        rowsPerPageOptions={[5, 10, 25]}
                    >
                        <Column field="name" header="Diseñador" expander style={{ width: '30%' }} />
                        <Column field="cliente" header="Cliente" style={{ width: '30%' }} />
                        <Column field="total" header="Precio" body={treeTotalBodyTemplate} style={{ width: '20%' }} />
                        <Column field="estatus" header="Estatus" style={{ width: '20%' }} />
                    </TreeTable>
                </Dialog>

                {/* Modal de Resumen del pedido */}
                <Dialog
                    header="Resumen de cotización"
                    visible={showSummaryDialog}
                    style={{ width: '60vw', minWidth: '500px' }}
                    modal
                    onHide={() => setShowSummaryDialog(false)}
                >
                    <div className="grid">
                        <div className="col-12 md:col-8">
                            <DataTable value={quoteItems} responsiveLayout="scroll">
                                <Column field="descripcion" header="Descripción del producto"></Column>
                                <Column field="cantidad" header="Cantidad" body={(item) => `${item.cantidad} u`}></Column>
                                <Column field="importe" header="Importe" body={(item) => `$${item.importe.toFixed(2)}`}></Column>
                            </DataTable>

                            <div className="text-right text-xl font-bold mt-4">
                                Total: ${quoteTotal.toFixed(2)}
                            </div>
                            <div className="text-right text-lg font-semibold mt-2 text-color-secondary">
                                Tiempo de producción estimado: {estimatedProductionTime} días
                            </div>
                        </div>

                        {/* Columna Derecha: Acciones*/}
                        <div className="col-12 md:col-4 p-fluid flex flex-column gap-3">
                            <Button
                                label="Agregar nuevo cliente"
                                icon="pi pi-user-plus"
                                outlined
                                onClick={() => setShowAddNewClientDialog(true)}
                            />
                            <Button
                                label={assignedClient ? assignedClient.name : "Asignar cliente"}
                                icon="pi pi-user"
                                onClick={() => setShowAssignClientDialog(true)}
                            />

                            <Dropdown
                                value={selectedDesigner}
                                onChange={(e) => setSelectedDesigner(e.value)}
                                options={designers}
                                placeholder="Seleccionar Diseñador"
                            />
                            <div className="field-checkbox mt-2">
                                <Checkbox
                                    inputId="facturacion"
                                    checked={requiresBilling}
                                    onChange={(e) => setRequiresBilling(e.checked ?? false)}
                                    // Lógica de deshabilitado:
                                    // 1. No hay cliente asignado
                                    // 2. El cliente asignado no tiene RFC, CFDI o CP
                                    disabled={!assignedClient || !assignedClient.rfc || !assignedClient.cfdi || !assignedClient.cp}
                                />
                                <label htmlFor="facturacion" className="ml-2">
                                    ¿Requiere facturación?
                                </label>
                            </div>
                            <Button label="Confirmar" icon="pi pi-check" className="p-button-lg mt-auto"
                                onClick={handleConfirmQuote} // <-- ACCIÓN AÑADIDA
                            />
                        </div>
                    </div>
                </Dialog>

                {/* --- MODAL: Asignar Cliente--- */}
                <Dialog
                    header="Asignar Cliente"
                    visible={showAssignClientDialog}
                    style={{ width: '75vw', minWidth: '600px' }}
                    modal
                    onHide={() => {
                        setShowAssignClientDialog(false);
                        setGlobalFilterValue('');
                        setFilters({ global: { value: null, matchMode: FilterMatchMode.CONTAINS } });
                    }}
                    footer={() => (
                        <div>
                            <Button label="Cancelar" icon="pi pi-times" onClick={() => setShowAssignClientDialog(false)} className="p-button-text" />
                            <Button label="Seleccionar" icon="pi pi-check" onClick={handleAssignClient} autoFocus disabled={!selectedClient} />
                        </div>
                    )}
                >
                    <div className="p-fluid mb-2">
                        <span className="p-input-icon-left w-full">
                            <i className="pi pi-search" />
                            <InputText
                                value={globalFilterValue}
                                onChange={onGlobalFilterChange} // Usamos la nueva función
                                placeholder="Buscar por nombre, correo o RFC..."
                            />
                        </span>
                    </div>
                    <DataTable
                        value={dummyClients}
                        paginator
                        rows={5}
                        selectionMode="single"
                        selection={selectedClient}
                        onSelectionChange={(e) => setSelectedClient(e.value)}
                        filters={filters}
                        globalFilterFields={['name', 'email', 'rfc', 'phone']}
                        emptyMessage="No se encontraron clientes."
                    >
                        <Column field="name" header="Nombre" sortable />
                        <Column field="email" header="Correo" sortable />
                        <Column field="rfc" header="RFC" sortable />
                        <Column field="regimenFiscal" header="Régimen" />
                        <Column field="cfdi" header="CFDI" />
                        <Column selectionMode="single" headerStyle={{ width: '3rem' }}></Column>
                    </DataTable>
                </Dialog>

                {/* --- MODAL: Cliente Nuevo (Compacto) --- */}
                <Dialog
                    header="Cliente nuevo"
                    visible={showAddNewClientDialog}
                    style={{ width: '50vw', minWidth: '500px' }}
                    modal
                    onHide={() => setShowAddNewClientDialog(false)}
                    footer={() => (
                        <div className="pt-2"> {/* Un poco de aire arriba de los botones */}
                            <Button label="Cancelar" icon="pi pi-times" onClick={() => setShowAddNewClientDialog(false)} className="p-button-text" />
                            <Button label="Guardar" icon="pi pi-save" onClick={handleSaveNewClient} autoFocus />
                        </div>
                    )}
                >
                    {/* Usamos 'formgrid grid' para un layout más apretado */}
                    <div className="p-fluid formgrid grid">

                        {/* Fila 1: Nombre */}
                        <div className="field col-12 mb-2"> {/* mb-2 reduce el espacio con la siguiente fila */}
                            <label htmlFor="name" className="font-bold block mb-1">Nombre / Razón Social</label>
                            <InputText id="name" name="name" value={newClientData.name} onChange={handleNewClientChange} />
                        </div>

                        {/* Fila 2: Correo y Teléfono */}
                        <div className="field col-12 md:col-6 mb-2">
                            <label htmlFor="email" className="font-bold block mb-1">Correo electrónico</label>
                            <InputText id="email" name="email" value={newClientData.email} onChange={handleNewClientChange} />
                        </div>
                        <div className="field col-12 md:col-6 mb-2">
                            <label htmlFor="phone" className="font-bold block mb-1">Teléfono</label>
                            <InputText id="phone" name="phone" value={newClientData.phone} onChange={handleNewClientChange} />
                        </div>

                        {/* Divider con márgenes reducidos (my-2) */}
                        <div className="col-12">
                            <Divider align="left" className="my-2">
                                <span className="p-tag p-tag-rounded text-xs">Datos Fiscales</span>
                            </Divider>
                        </div>

                        {/* Fila 3: RFC y Régimen */}
                        <div className="field col-12 md:col-4 mb-2">
                            <label htmlFor="rfc" className="font-bold block mb-1">R.F.C.</label>
                            <InputText id="rfc" name="rfc" value={newClientData.rfc} onChange={handleNewClientChange} />
                        </div>

                        <div className="field col-12 md:col-8 mb-2">
                            <label htmlFor="regimenFiscal" className="font-bold block mb-1">Régimen Fiscal</label>
                            <Dropdown
                                id="regimenFiscal"
                                name="regimenFiscal"
                                value={newClientData.regimenFiscal}
                                options={regimenFiscalOptions}
                                onChange={handleNewClientChange}
                                placeholder="Seleccione régimen"
                                className="w-full"
                                filter
                            />
                        </div>

                        {/* Fila 4: CFDI y CP */}
                        <div className="field col-12 md:col-8 mb-0"> {/* mb-0 en la última fila visual */}
                            <label htmlFor="cfdi" className="font-bold block mb-1">Uso del C.F.D.I.</label>
                            <Dropdown
                                id="cfdi"
                                name="cfdi"
                                value={newClientData.cfdi}
                                options={cfdiOptions}
                                onChange={handleNewClientChange}
                                placeholder="Seleccione uso"
                                className="w-full"
                            />
                        </div>
                        <div className="field col-12 md:col-4 mb-0">
                            <label htmlFor="cp" className="font-bold block mb-1">Código Postal</label>
                            <InputText id="cp" name="cp" value={newClientData.cp} onChange={handleNewClientChange} />
                        </div>
                    </div>
                </Dialog>

                {/* Modal de cada producto */}
                <Dialog
                    header={pendingProduct?.name}
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
                            min={pendingProduct?.minOrder ?? 1}
                            showButtons
                        />
                        <small>Tiraje mínimo: {pendingProduct?.minOrder}</small>
                    </div>
                </Dialog>

            </div >
        </>
    );
};

export default Counter;