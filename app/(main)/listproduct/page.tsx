'use client';
import React, { useState, useRef, useEffect } from 'react';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Toast } from 'primereact/toast';
import { Button } from 'primereact/button';
import { Dialog } from 'primereact/dialog';
import { InputText } from 'primereact/inputtext';
import { FilterMatchMode } from 'primereact/api';
import { Tag } from 'primereact/tag';
import Link from 'next/link';

// Asegúrate de que la ruta coincida con donde guardaste el componente
import { ProductFormDialog } from "@/app/components/ProductFormDialog";
import { CatalogService } from "@/app/service/catalogService";
import { Producto } from "@/app/types/orders";

const initialProduct: Producto = {
    idProducto: null,
    nombre: '',
    descripcion: '',
    precioUnitario: 0,
    precioPaquete: 0,
    cantidadPaquete: 0,
    tiempoProduccionDias: 1,
    formatoTamano: '',
    unidadVenta: '',
    tirajeMinimo: 1,
    volumenDescuentoCantidad: 0
};

const ListProductsPage = () => {
    const [products, setProducts] = useState<Producto[]>([]);
    const [productDialog, setProductDialog] = useState(false);
    const [deleteProductDialog, setDeleteProductDialog] = useState(false);
    const [product, setProduct] = useState<Producto>(initialProduct);
    const [loading, setLoading] = useState(false);
    const [globalFilterValue, setGlobalFilterValue] = useState('');
    const [filters, setFilters] = useState({
        global: { value: null, matchMode: FilterMatchMode.CONTAINS }
    });

    const toast = useRef<Toast>(null);

    useEffect(() => {
        loadProducts();
    }, []);

    const loadProducts = async () => {
        setLoading(true);
        try {
            const data = await CatalogService.getProductos();
            setProducts(data);
        } catch (err) {
            toast.current?.show({ severity: 'error', summary: 'Error', detail: 'No se pudieron cargar los productos' });
        } finally {
            setLoading(false);
        }
    };

    const openNew = () => {
        setProduct({ ...initialProduct });
        setProductDialog(true);
    };

    const editProduct = (p: Producto) => {
        setProduct({ ...p });
        setProductDialog(true);
    };

    // --- MANEJO DEL DIALOG ---
    const hideDialog = () => {
        setProductDialog(false);
    };

    const handleProductSaved = () => {
        loadProducts(); // Recarga la tabla para ver el producto nuevo/editado
        setProductDialog(false);
        toast.current?.show({ severity: 'success', summary: 'Éxito', detail: 'Producto guardado correctamente' });
    };

    const confirmDeleteProduct = (p: Producto) => {
        setProduct(p);
        setDeleteProductDialog(true);
    };

    const deleteProduct = async () => {
        if (!product.idProducto) return;
        try {
            await CatalogService.deleteProducto(product.idProducto);
            setProducts(products.filter((val) => val.idProducto !== product.idProducto));
            setDeleteProductDialog(false);
            setProduct({ ...initialProduct });
            toast.current?.show({ severity: 'success', summary: 'Eliminado', detail: 'Producto eliminado correctamente' });
        } catch (error) {
            toast.current?.show({ severity: 'error', summary: 'Error', detail: 'No se pudo eliminar el producto' });
        }
    };

    const onGlobalFilterChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        let _filters = { ...filters };
        // @ts-ignore
        _filters['global'].value = value;
        setFilters(_filters);
        setGlobalFilterValue(value);
    };

    const formatCurrency = (value: number | null | undefined) => {
        if (value == null || isNaN(value)) {
            return '$0.00';
        }
        return value.toLocaleString('es-MX', { style: 'currency', currency: 'MXN' });
    };

    const header = (
        <div className="flex flex-column md:flex-row md:align-items-center justify-content-between gap-2">
            <span className="p-input-icon-left w-full md:w-auto">
                <i className="pi pi-search" />
                <InputText value={globalFilterValue} onChange={onGlobalFilterChange} placeholder="Buscar producto..." className="w-full md:w-auto" />
            </span>
            <Button label="Nuevo Producto" icon="pi pi-plus" severity="success" onClick={openNew} />
        </div>
    );

    const actionBodyTemplate = (rowData: Producto) => (
        <div className="flex gap-2 justify-content-center">
            <Button icon="pi pi-pencil" rounded text severity="info" onClick={() => editProduct(rowData)} />
            <Button icon="pi pi-trash" rounded text severity="danger" onClick={() => confirmDeleteProduct(rowData)} />
        </div>
    );

    const deleteProductDialogFooter = (
        <>
            <Button label="No" icon="pi pi-times" text onClick={() => setDeleteProductDialog(false)} />
            <Button label="Sí" icon="pi pi-check" text severity="danger" onClick={deleteProduct} />
        </>
    );

    return (
        <div className="card">
            <Toast ref={toast} />

            <div className="flex justify-content-between align-items-center mb-4">
                <h2 className="m-0">Lista de Productos</h2>
                <Link href="/counter" passHref legacyBehavior>
                    <a className="p-button p-component p-button-text p-button-plain">
                        <i className="pi pi-arrow-left mr-2"></i>
                        <span className="font-bold">Volver</span>
                    </a>
                </Link>
            </div>

            <DataTable
                value={products}
                paginator rows={10}
                header={header}
                filters={filters}
                globalFilterFields={['descripcion', 'formatoTamano', 'unidadVenta']}
                emptyMessage="No se encontraron productos."
                responsiveLayout="scroll"
                stripedRows
                loading={loading}
                dataKey="idProducto"
            >
                <Column field="descripcion" header="Descripción" sortable style={{ minWidth: '15rem' }} />
                {/* Se usa el nuevo formatCurrency protegido contra nulls */}
                <Column field="precioUnitario" header="P. Unitario" body={(p) => formatCurrency(p.precioUnitario)} sortable />
                <Column field="precioPaquete" header="P. Paquete" body={(p) => formatCurrency(p.precioPaquete)} sortable />
                <Column field="cantidadPaquete" header="Cant. Paq." sortable className="text-center" />
                <Column field="formatoTamano" header="Tamaño" sortable />
                <Column field="unidadVenta" header="Unidad" sortable />
                <Column
                    field="tiempoProduccionDias"
                    header="Entrega"
                    body={(p) => <Tag value={`${p.tiempoProduccionDias || 0} días`} severity="info" />}
                    sortable
                />
                <Column body={actionBodyTemplate} exportable={false} style={{ minWidth: '8rem', textAlign: 'center' }} />
            </DataTable>

            {/* --- INTEGRACIÓN DEL DIALOG REAL --- */}
            <ProductFormDialog
                visible={productDialog}
                onHide={hideDialog}
                onSuccess={handleProductSaved}
                productToEdit={product.idProducto ? product : null}
            />

            <Dialog
                visible={deleteProductDialog}
                style={{ width: '32rem' }}
                header="Confirmar Eliminación"
                modal
                footer={deleteProductDialogFooter}
                onHide={() => setDeleteProductDialog(false)}
            >
                <div className="flex align-items-center justify-content-center">
                    <i className="pi pi-exclamation-triangle mr-3 text-yellow-500" style={{ fontSize: '2rem' }} />
                    {product && (<span>¿Estás seguro de que quieres eliminar <b>{product.descripcion}</b>?</span>)}
                </div>
            </Dialog>
        </div>
    );
};

export default ListProductsPage;