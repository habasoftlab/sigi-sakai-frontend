/* eslint-disable @next/next/no-img-element */
'use client';
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { AutoComplete, AutoCompleteCompleteEvent } from 'primereact/autocomplete';
import { DataTable, DataTableRowEditCompleteEvent } from 'primereact/datatable';
import { Column, ColumnEditorOptions } from 'primereact/column';
import { Button } from 'primereact/button';
import { Dropdown } from 'primereact/dropdown';
import { SelectButton } from 'primereact/selectbutton';
import { Checkbox } from 'primereact/checkbox';
import { InputNumber, InputNumberValueChangeEvent } from 'primereact/inputnumber';
import { InputText } from 'primereact/inputtext';
import { Dialog } from 'primereact/dialog';
import { TreeTable } from 'primereact/treetable';
import { TreeNode } from 'primereact/treenode';
import { Toast } from 'primereact/toast';
import Link from 'next/link';


interface QuoteItem {
    id: string;
    descripcion: string;
    costo: number;
    cantidad: number;
    importe: number;
}

interface Product {
    id: string;
    name: string;
    pricePerUnit: number | null;
    pricePerPackage: number | null;
    packageSize: number | null;
    productionTime: string;
    format: string;
    saleUnit: string;
    minOrder: number;
    volumeDiscount: number;
}

interface NewClient {
    name: string;
    email: string;
    phone: string;
    rfc: string;
    cfdi: string;
    cp: string;
}

const allProducts: Product[] = [
    { id: 'PRD-001A', name: 'Tarjetas básicas (couché 300g, 1 cara)', pricePerUnit: 1.8, pricePerPackage: 180, packageSize: 100, productionTime: '2 días', format: '9x5 cm', saleUnit: 'Paquete (100)', minOrder: 100, volumeDiscount: 1000 },
    { id: 'PRD-001B', name: 'Tarjetas estándar (2 caras, laminado mate)', pricePerUnit: 2.2, pricePerPackage: 220, packageSize: 100, productionTime: '3 días', format: '9x5 cm', saleUnit: 'Paquete (100)', minOrder: 100, volumeDiscount: 1000 },
    { id: 'PRD-002A', name: 'Hojas membretadas básicas (bond 90g, B/N)', pricePerUnit: 1.5, pricePerPackage: 750, packageSize: 500, productionTime: '2 días', format: 'Carta', saleUnit: 'Paquete (500)', minOrder: 500, volumeDiscount: 2000 },
    { id: 'PRD-002B', name: 'Hojas membretadas color (bond 90g, full color)', pricePerUnit: 1.8, pricePerPackage: 900, packageSize: 500, productionTime: '3 días', format: 'Carta', saleUnit: 'Paquete (500)', minOrder: 500, volumeDiscount: 2000 },
    { id: 'PRD-002C', name: 'Hojas premium (opalina, watermark)', pricePerUnit: 2.0, pricePerPackage: 1000, packageSize: 500, productionTime: '4 días', format: 'Carta', saleUnit: 'Paquete (500)', minOrder: 500, volumeDiscount: 2000 },
    { id: 'PRD-003A', name: 'Sobres estándar (carta, sin ventana)', pricePerUnit: 2.0, pricePerPackage: 1000, packageSize: 500, productionTime: '3 días', format: 'Carta', saleUnit: 'Paquete (500)', minOrder: 500, volumeDiscount: 2000 },
    { id: 'PRD-003B', name: 'Sobres personalizados (oficio, con ventana)', pricePerUnit: 2.5, pricePerPackage: 1250, packageSize: 500, productionTime: '3 días', format: 'Oficio', saleUnit: 'Paquete (500)', minOrder: 500, volumeDiscount: 2000 },
    { id: 'PRD-003C', name: 'Sobres premium (full color, adhesivo siliconado)', pricePerUnit: 3.0, pricePerPackage: 1500, packageSize: 500, productionTime: '4 días', format: 'Oficio/Carta', saleUnit: 'Paquete (500)', minOrder: 500, volumeDiscount: 2000 },
    { id: 'PRD-004A', name: 'Folder estándar (sin solapas, impresión 1 cara)', pricePerUnit: 15, pricePerPackage: 1500, packageSize: 100, productionTime: '3 días', format: 'Carta', saleUnit: 'Paquete (100)', minOrder: 100, volumeDiscount: 1000 },
    { id: 'PRD-004B', name: 'Folder corporativo (con solapa y bolsillo)', pricePerUnit: 18, pricePerPackage: 1800, packageSize: 100, productionTime: '4 días', format: 'Carta', saleUnit: 'Paquete (100)', minOrder: 100, volumeDiscount: 1000 },
    { id: 'PRD-005A', name: 'Volantes económicos (couché 130g, 1 cara)', pricePerUnit: 0.8, pricePerPackage: 800, packageSize: 1000, productionTime: '2 días', format: 'Carta', saleUnit: 'Millar', minOrder: 1000, volumeDiscount: 5000 },
    { id: 'PRD-005B', name: 'Volantes estándar (couché 150g, 2 caras)', pricePerUnit: 0.9, pricePerPackage: 900, packageSize: 1000, productionTime: '3 días', format: 'Carta', saleUnit: 'Millar', minOrder: 1000, volumeDiscount: 5000 },
    { id: 'PRD-006A', name: 'Díptico estándar (couché 150g, doblado en U)', pricePerUnit: 1.5, pricePerPackage: 1500, packageSize: 1000, productionTime: '3 días', format: 'Carta', saleUnit: 'Millar', minOrder: 1000, volumeDiscount: 5000 },
    { id: 'PRD-006B', name: 'Tríptico estándar (couché 150g, doblado en Z)', pricePerUnit: 1.7, pricePerPackage: 1700, packageSize: 1000, productionTime: '4 días', format: 'Carta', saleUnit: 'Millar', minOrder: 1000, volumeDiscount: 5000 },
    { id: 'PRD-007A', name: 'Póster económico (bond, 1 cara)', pricePerUnit: 12, pricePerPackage: 1200, packageSize: 100, productionTime: '2 días', format: 'Tabloide', saleUnit: 'Paquete (100)', minOrder: 100, volumeDiscount: 500 },
    { id: 'PRD-007B', name: 'Póster estándar (couché 150g, color)', pricePerUnit: 14, pricePerPackage: 1400, packageSize: 100, productionTime: '3 días', format: 'Tabloide', saleUnit: 'Paquete (100)', minOrder: 100, volumeDiscount: 500 },
    { id: 'PRD-007C', name: 'Póster premium (couché 200g, laminado brillante)', pricePerUnit: 15, pricePerPackage: 1500, packageSize: 100, productionTime: '4 días', format: 'Tabloide', saleUnit: 'Paquete (100)', minOrder: 100, volumeDiscount: 500 },
    { id: 'PRD-008', name: 'Catálogos / Revistas (20 págs.)', pricePerUnit: 60, pricePerPackage: 3000, packageSize: 50, productionTime: '5 días', format: 'Carta', saleUnit: 'Lote (50)', minOrder: 50, volumeDiscount: 200 },
    { id: 'PRD-009', name: 'Lonas publicitarias', pricePerUnit: 120, pricePerPackage: null, packageSize: null, productionTime: '2 días', format: '1x1 m', saleUnit: 'Unidad', minOrder: 1, volumeDiscount: 10 },
    { id: 'PRD-009A', name: 'Lonas publicitarias grandes', pricePerUnit: null, pricePerPackage: 150, packageSize: null, productionTime: '6 días', format: 'Personalizado', saleUnit: 'm²', minOrder: 1, volumeDiscount: 10 },
    { id: 'PRD-010', name: 'Vinil adhesivo', pricePerUnit: null, pricePerPackage: 150, packageSize: null, productionTime: '2 días', format: 'Personalizado', saleUnit: 'm²', minOrder: 1, volumeDiscount: 10 },
    { id: 'PRD-011', name: 'Bolsas de papel impresas', pricePerUnit: 20, pricePerPackage: 2000, packageSize: 100, productionTime: '5 días', format: 'Personalizado', saleUnit: 'Paquete (100)', minOrder: 100, volumeDiscount: 500 },
    { id: 'PRD-012', name: 'Calendarios de escritorio', pricePerUnit: 20, pricePerPackage: 2000, packageSize: 100, productionTime: '5 días', format: '15x20 cm', saleUnit: 'Paquete (100)', minOrder: 100, volumeDiscount: 500 },
    { id: 'PRD-013', name: 'Calendarios de pared', pricePerUnit: 30, pricePerPackage: 3000, packageSize: 100, productionTime: '5 días', format: 'Carta/Tabloide', saleUnit: 'Paquete (100)', minOrder: 100, volumeDiscount: 500 },
    { id: 'PRD-014', name: 'Playeras sublimadas', pricePerUnit: 130, pricePerPackage: null, packageSize: null, productionTime: '4 días', format: 'S, M, L, XL', saleUnit: 'Unidad', minOrder: 1, volumeDiscount: 50 },
    { id: 'PRD-015', name: 'Tazas sublimadas', pricePerUnit: 90, pricePerPackage: null, packageSize: null, productionTime: '3 días', format: '11 oz', saleUnit: 'Unidad', minOrder: 1, volumeDiscount: 50 },
    { id: 'PRD-016', name: 'Libros tapa blanda (200 págs.)', pricePerUnit: 200, pricePerPackage: 10000, packageSize: 50, productionTime: '7 días', format: 'Carta', saleUnit: 'Lote (50)', minOrder: 50, volumeDiscount: 200 },
    { id: 'PRD-017', name: 'Libros tapa dura (200 págs.)', pricePerUnit: 220, pricePerPackage: 11000, packageSize: 50, productionTime: '10 días', format: 'Carta', saleUnit: 'Lote (50)', minOrder: 50, volumeDiscount: 200 }
];


const dummyClients = [
    { id: 'C001', name: 'Juan Pérez', email: 'juan.perez@email.com', phone: '5512345678', rfc: 'PEPJ800101ABC', cfdi: 'G03', cp: '06500' },
    { id: 'C002', name: 'Sofía Herrera', email: 'sofia.herrera@email.com', phone: '5587654321', rfc: 'HESF900202XYZ', cfdi: 'G01', cp: '03100' },
    { id: 'C003', name: 'Carlos Ramírez', email: 'carlos.ramirez@email.com', phone: '5555555555', rfc: '', cfdi: '', cp: '' }
];

const dummyQuotes = [
    { id: 'COT-001', cliente: 'Juan Pérez', total: 225.00, estatus: 'Activa', designer: 'Ana Torres' },
    { id: 'COT-002', cliente: 'Sofía Herrera', total: 450.00, estatus: 'Activa', designer: 'Ana Torres' },
    { id: 'COT-003', cliente: 'Carlos Ramírez', total: 1575.75, estatus: 'Activa', designer: 'Carlos Ramírez' },
    { id: 'COT-004', cliente: 'Luisa Gómez', total: 640.20, estatus: 'Activa', designer: 'Luisa Gómez' },
    { id: 'COT-005', cliente: 'Mario Sánchez', total: 2100.00, estatus: 'Activa', designer: 'Sofía Herrera' },
    { id: 'COT-006', cliente: 'Laura Fernández', total: 850.90, estatus: 'Activa', designer: 'Sofía Herrera' },
];

const dummyOrders = [
    { id: 'ORD-001', cliente: 'Juan Pérez', total: 1250.00, estatus: 'En diseño', designer: 'Juan Pérez' },
    { id: 'ORD-002', cliente: 'Sofía Herrera', total: 980.50, estatus: 'En impresión', designer: 'Ana Torres' },
    { id: 'ORD-003', cliente: 'Carlos Ramírez', total: 1575.75, estatus: 'En diseño', designer: 'Carlos Ramírez' },
    { id: 'ORD-004', cliente: 'Luisa Gómez', total: 640.20, estatus: 'En impresión', designer: 'Luisa Gómez' },
    { id: 'ORD-005', cliente: 'Mario Sánchez', total: 2100.00, estatus: 'En diseño', designer: 'Mario Sánchez' },
    { id: 'ORD-006', cliente: 'Laura Fernández', total: 850.90, estatus: 'En impresión', designer: 'Sofía Herrera' },
    { id: 'ORD-007', cliente: 'Diego Martínez', total: 1325.40, estatus: 'En diseño', designer: 'Diego Martínez' },
    { id: 'ORD-008', cliente: 'Sofía Herrera', total: 1720.80, estatus: 'En impresión', designer: 'Sofía Herrera' }
];

const designers = [
    { label: 'Juan Pérez', value: 'JP' },
    { label: 'Ana Torres', value: 'AT' },
    { label: 'Diego Martínez', value: 'DM' }
];

const paymentOptions = [
    { label: 'Pago único', value: 'unico' },
    { label: 'Pago a plazos', value: 'plazos' }
];

const cfdiOptions = [
    { label: 'Gastos en general', value: 'G01' },
    { label: 'Adquisición de mercancías', value: 'G02' },
    { label: 'Honorarios profesionales', value: 'G03' }
];

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
    const [selectedPayment, setSelectedPayment] = useState('unico');
    const [showAssignClientDialog, setShowAssignClientDialog] = useState(false);
    const [showAddNewClientDialog, setShowAddNewClientDialog] = useState(false);
    const [selectedClient, setSelectedClient] = useState<any>(null);
    const [assignedClient, setAssignedClient] = useState<any>(null);
    const [newClientData, setNewClientData] = useState<NewClient>({
        name: '', email: '', phone: '', rfc: '', cfdi: '', cp: ''
    });
    const [requiresBilling, setRequiresBilling] = useState(false);
    const [quoteTree, setQuoteTree] = useState<TreeNode[]>([]);
    const [orderTree, setOrderTree] = useState<TreeNode[]>([]);
    const toast = useRef<Toast>(null);
    const [selectedQuote, setSelectedQuote] = useState<any>(null);


    useEffect(() => {
        // Función helper para transformar la data plana a jerárquica
        const transformToTree = (items: any[]) => {
            const groups = new Map<string, any[]>();

            // 1. Agrupar items por diseñador
            items.forEach(item => {
                if (!groups.has(item.designer)) {
                    groups.set(item.designer, []);
                }
                groups.get(item.designer)?.push(item);
            });

            // 2. Convertir los grupos al formato TreeNode
            return Array.from(groups.entries()).map(([designerName, childrenItems], index) => ({
                key: `designer-${index}`, // Clave única para el nodo padre (diseñador)
                data: {
                    // Datos del nodo PADRE (el diseñador)
                    name: designerName,
                    cliente: '',
                    total: null,
                    estatus: ''
                },
                children: childrenItems.map(item => ({
                    key: item.id, // Clave única para el nodo hijo (la orden/cotización)
                    data: {
                        // Datos del nodo HIJO (la orden/cotización)
                        name: item.id, // Mostramos el ID en la columna principal
                        cliente: item.cliente,
                        total: item.total,
                        estatus: item.estatus
                    }
                }))
            }));
        };

        setQuoteTree(transformToTree(dummyQuotes));
        setOrderTree(transformToTree(dummyOrders));

    }, []);

    // --- NUEVO EFFECT para validar facturación ---
    useEffect(() => {
        const hasFiscalData = assignedClient && assignedClient.rfc && assignedClient.cfdi && assignedClient.cp;
        if (!hasFiscalData) {
            setRequiresBilling(false); // Desmarca y deshabilita si el cliente no tiene datos
        }
    }, [assignedClient]);


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

        // No añadir si ya está en la tabla
        if (product && !quoteItems.find(item => item.id === product.id)) {
            setPendingProduct(product);
            setPendingQuantity(product.minOrder ?? 1); // Pone el tiraje mínimo por defecto
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
        // Aquí iría la lógica para guardar el newClientData en la base de datos
        console.log("Guardando nuevo cliente:", newClientData);
        setAssignedClient(newClientData);
        setNewClientData({ name: '', email: '', phone: '', rfc: '', cfdi: '', cp: '' }); // Limpiar formulario
        setShowAddNewClientDialog(false); // Cerrar modal de nuevo cliente
    };

    const handleAssignClient = () => {
        // Asigna el cliente seleccionado de la lista a la cotización
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
        // Solo muestra el total si es un nodo hijo (una orden/cotización)
        if (node.data && node.data.total !== null) {
            return `$${node.data.total.toFixed(2)}`;
        }
        return ''; // El diseñador (nodo padre) no tiene total
    };

    const estimatedProductionTime = useMemo(() => {
        if (quoteItems.length === 0) {
            return 0;
        }

        const timeArray = quoteItems.map(item => {
            // Encontrar el producto en el catálogo completo
            const product = allProducts.find(p => p.id === item.id);
            if (product) {
                // 1. Obtener el tiempo de producción base
                let days = parseInt(product.productionTime) || 0; // ej. "3 días" -> 3

                // 2. NUEVA REGLA: Añadir tiempo si la cantidad supera el umbral de volumen
                // Comparamos la cantidad pedida (item.cantidad) con el umbral (product.volumeDiscount)
                if (product.volumeDiscount && item.cantidad > product.volumeDiscount) {
                    days += 2; // Añadir 2 días extra por ser un pedido de gran volumen
                }

                return days;
            }
            return 0;
        });
        // Devolver el tiempo de producción más largo de la lista
        return Math.max(...timeArray);
    }, [quoteItems]); // Se recalcula solo cuando los items de la cotización cambian

    const handleConfirmQuote = () => {
        // 1. Simular guardado
        console.log("Cotización Confirmada:", {
            client: assignedClient,
            items: quoteItems,
            total: quoteTotal,
            designer: selectedDesigner,
            payment: selectedPayment,
            billing: requiresBilling
        });

        // 2. Mostrar Toast de éxito
        toast.current?.show({
            severity: 'success',
            summary: 'Éxito',
            detail: 'Cotización creada correctamente',
            life: 3000
        });

        // 3. Cerrar modal
        setShowSummaryDialog(false);
        setQuoteItems([]);
        setAssignedClient(null);
        setSelectedClient(null);
        setSelectedDesigner(null);
        setRequiresBilling(false);
        setSelectedPayment('unico');
    };

    const selectButtonTemplate = (node: any) => {
        // Si el nodo tiene hijos, significa que es un diseñador (no mostrar botón)
        if (node.children && node.children.length > 0) {
            return null;
        }

        // Si es hoja (una orden), mostrar el botón
        return (
            <Button
                icon="pi pi-check"
                size="small"
                rounded
                severity={selectedQuote?.key === node.key ? 'success' : 'secondary'}
                onClick={() => setSelectedQuote(node)}
                className="w-6 h-6 flex items-center justify-center hover:scale-110 transition-transform duration-150"
            />
        );
    };


    const handleOrder = () => {
        if (!selectedQuote) return;
        console.log('Cotización seleccionada:', selectedQuote.data);
        // Aquí puedes abrir otro diálogo o crear la orden a partir de la cotización
        setShowQuotesDialog(false);
    };

    const footerContent = (
        <div className="flex justify-content-end gap-2">
            <Button label="Cancelar" icon="pi pi-times" text onClick={() => setShowQuotesDialog(false)} />
            <Button
                label="Ordenar"
                icon="pi pi-shopping-cart"
                disabled={!selectedQuote}
                onClick={handleOrder}
            />
        </div>
    );

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
                    onHide={() => setShowQuotesDialog(false)}
                >
                    <TreeTable
                        value={quoteTree}
                        paginator
                        rows={10}
                        rowsPerPageOptions={[5, 10, 25]}
                    >
                        <Column field="name" header="Diseñador" expander style={{ width: '25%' }} />
                        <Column field="cliente" header="Cliente" style={{ width: '25%' }} />
                        <Column field="total" header="Total" style={{ width: '20%' }} />
                        <Column field="estatus" header="Estatus" style={{ width: '20%' }} />
                        <Column
                            header=""
                            body={selectButtonTemplate}
                            style={{ width: '10%', textAlign: 'center' }}
                        />
                    </TreeTable>
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
                            <div className="flex justify-content-center mt-4">
                                <SelectButton
                                    value={selectedPayment}
                                    onChange={(e) => setSelectedPayment(e.value)}
                                    options={paymentOptions}
                                    optionLabel="label"
                                />
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
                    onHide={() => setShowAssignClientDialog(false)}
                    footer={() => (
                        <div>
                            <Button label="Cancelar" icon="pi pi-times" onClick={() => setShowAssignClientDialog(false)} className="p-button-text" />
                            <Button label="Seleccionar" icon="pi pi-check" onClick={handleAssignClient} autoFocus disabled={!selectedClient} />
                        </div>
                    )}
                >
                    <div className="p-fluid mb-2">
                        <InputText placeholder="Buscar cliente..." />
                    </div>

                    <DataTable value={dummyClients} paginator rows={5} selectionMode="single" selection={selectedClient} onSelectionChange={(e) => setSelectedClient(e.value)}>
                        <Column field="name" header="Nombre" sortable />
                        <Column field="email" header="Correo" sortable />
                        <Column field="phone" header="Teléfono" />
                        <Column field="rfc" header="RFC" sortable />
                        <Column field="cfdi" header="CFDI" />
                        <Column field="cp" header="C.P." />
                        <Column selectionMode="single" headerStyle={{ width: '3rem' }}></Column>

                    </DataTable>
                </Dialog>


                {/* --- MODAL: Cliente Nuevo --- */}
                <Dialog
                    header="Cliente nuevo"
                    visible={showAddNewClientDialog}
                    style={{ width: '40vw', minWidth: '450px' }}
                    modal
                    onHide={() => setShowAddNewClientDialog(false)}
                    footer={() => (
                        <div>
                            <Button label="Cancelar" icon="pi pi-times" onClick={() => setShowAddNewClientDialog(false)} className="p-button-text" />
                            <Button label="Guardar" icon="pi pi-save" onClick={handleSaveNewClient} autoFocus />
                        </div>
                    )}
                >
                    <div className="p-fluid grid gap-0">
                        <div className="field col-12 mb-0">
                            <label htmlFor="name">Nombre</label>
                            <InputText id="name" name="name" value={newClientData.name} onChange={handleNewClientChange} />
                        </div>
                        <div className="field col-12 mb-0">
                            <label htmlFor="email">Correo electrónico</label>
                            <InputText id="email" name="email" value={newClientData.email} onChange={handleNewClientChange} />
                        </div>
                        <div className="field col-12 mb-0">
                            <label htmlFor="phone">Teléfono</label>
                            <InputText id="phone" name="phone" value={newClientData.phone} onChange={handleNewClientChange} />
                        </div>
                        <div className="field col-12 md:col-6">
                            <label htmlFor="rfc">R.F.C.</label>
                            <InputText id="rfc" name="rfc" value={newClientData.rfc} onChange={handleNewClientChange} />
                        </div>
                        <div className="field col-12 md:col-6">
                            <label htmlFor="cfdi">Uso del C.F.D.I.</label>
                            <Dropdown
                                id="cfdi"
                                name="cfdi"
                                value={newClientData.cfdi}
                                options={cfdiOptions}
                                onChange={handleNewClientChange}
                                placeholder="Seleccione un uso"
                                className="w-full"
                            />
                        </div>
                        <div className="field col-12 mb-0">
                            <label htmlFor="cp">Código postal</label>
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

            </div>
        </>
    );
};

export default Counter;