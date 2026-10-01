import React, { useState, useEffect } from 'react';
import { Dialog } from 'primereact/dialog';
import { InputText } from 'primereact/inputtext';
import { InputNumber, InputNumberValueChangeEvent } from 'primereact/inputnumber';
import { Button } from 'primereact/button';
import { classNames } from 'primereact/utils';
import { Producto } from '@/app/types/orders';
import { CatalogService } from '@/app/service/catalogService';

interface ProductFormDialogProps {
    visible: boolean;
    onHide: () => void;
    onSuccess: () => void;
    productToEdit: Producto | null;
}

const emptyProduct: Producto = {
    idProducto: 0,
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

export const ProductFormDialog = ({ visible, onHide, onSuccess, productToEdit }: ProductFormDialogProps) => {
    const [product, setProduct] = useState<Producto>(emptyProduct);
    const [submitted, setSubmitted] = useState(false);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (productToEdit) {
            setProduct({ ...productToEdit });
        } else {
            setProduct(emptyProduct);
        }
        setSubmitted(false);
    }, [productToEdit, visible]);

    const onInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>, name: keyof Producto) => {
        const val = (e.target && e.target.value) || '';
        setProduct((prev) => ({ ...prev, [name]: val }));
    };

    const onInputNumberChange = (e: InputNumberValueChangeEvent, name: keyof Producto) => {
        const val = e.value || 0;
        setProduct((prev) => ({ ...prev, [name]: val }));
    };

    const saveProduct = async () => {
        setSubmitted(true);

        // Validación básica
        if (!product.descripcion?.trim() || (product.precioUnitario ?? 0) <= 0) {
            return;
        }

        setLoading(true);
        try {
            if (product.idProducto) {
                await CatalogService.updateProducto(product.idProducto, product);
                console.log("Actualizando producto:", product);
            } else {
                await CatalogService.createProducto(product);
                console.log("Creando producto:", product);
            }
            onSuccess();
        } catch (error) {
            console.error("Error guardando el producto", error);
        } finally {
            setLoading(false);
        }
    };

    const productDialogFooter = (
        <div className="flex justify-content-end gap-2 pt-3">
            <Button label="Cancelar" icon="pi pi-times" outlined onClick={onHide} disabled={loading} />
            <Button label="Guardar" icon="pi pi-check" onClick={saveProduct} loading={loading} />
        </div>
    );

    return (
        <Dialog
            visible={visible}
            style={{ width: '600px' }}
            header={product.idProducto ? "Editar Producto" : "Nuevo Producto"}
            modal
            className="p-fluid"
            footer={productDialogFooter}
            onHide={onHide}
        >
            <div className="grid formgrid mt-2">
                
                <div className="field col-12 md:col-4">
                    <label htmlFor="nombre">Nombre (Opcional)</label>
                    <InputText
                        id="nombre"
                        value={product.nombre || ''}
                        onChange={(e) => onInputChange(e, 'nombre')}
                        placeholder="Ej. Tarjetas"
                    />
                </div>

                <div className="field col-12 md:col-8">
                    <label htmlFor="descripcion" className="font-bold">Descripción *</label>
                    <InputText
                        id="descripcion"
                        value={product.descripcion || ''}
                        onChange={(e) => onInputChange(e, 'descripcion')}
                        required
                        autoFocus
                        className={classNames({ 'p-invalid': submitted && !product.descripcion })}
                        placeholder="Ej. Tarjetas básicas (couché 300g, 1 cara)"
                    />
                    {submitted && !product.descripcion && <small className="p-error">La descripción es obligatoria.</small>}
                </div>

                <div className="field col-12 md:col-6">
                    <label htmlFor="formatoTamano">Formato / Tamaño</label>
                    <InputText
                        id="formatoTamano"
                        value={product.formatoTamano || ''}
                        onChange={(e) => onInputChange(e, 'formatoTamano')}
                        placeholder="Ej. 9x5 cm, Carta..."
                    />
                </div>

                <div className="field col-12 md:col-6">
                    <label htmlFor="unidadVenta">Unidad de Venta</label>
                    <InputText
                        id="unidadVenta"
                        value={product.unidadVenta || ''}
                        onChange={(e) => onInputChange(e, 'unidadVenta')}
                        placeholder="Ej. Paquete (100), Millar..."
                    />
                </div>

                <div className="col-12 border-top-1 surface-border my-2"></div>

                <div className="field col-12 md:col-6">
                    <label htmlFor="precioUnitario" className="font-bold">Precio Unitario *</label>
                    <InputNumber
                        id="precioUnitario"
                        // Protegemos el valor por si viene undefined de la BD
                        value={product.precioUnitario ?? 0} 
                        onValueChange={(e) => onInputNumberChange(e, 'precioUnitario')}
                        mode="currency"
                        currency="MXN"
                        locale="es-MX"
                        minFractionDigits={2}
                        className={classNames({ 'p-invalid': submitted && (product.precioUnitario ?? 0) <= 0 })}
                    />
                    {submitted && (product.precioUnitario ?? 0) <= 0 && <small className="p-error">El precio debe ser mayor a 0.</small>}
                </div>

                <div className="field col-12 md:col-6">
                    <label htmlFor="precioPaquete">Precio Paquete</label>
                    <InputNumber
                        id="precioPaquete"
                        value={product.precioPaquete ?? 0}
                        onValueChange={(e) => onInputNumberChange(e, 'precioPaquete')}
                        mode="currency"
                        currency="MXN"
                        locale="es-MX"
                        minFractionDigits={2}
                    />
                </div>

                <div className="col-12 border-top-1 surface-border my-2"></div>

                <div className="field col-12 md:col-4">
                    <label htmlFor="cantidadPaquete">Cant. por Paquete</label>
                    <InputNumber
                        id="cantidadPaquete"
                        value={product.cantidadPaquete ?? 0}
                        onValueChange={(e) => onInputNumberChange(e, 'cantidadPaquete')}
                        suffix=" pzas"
                    />
                </div>

                <div className="field col-12 md:col-4">
                    <label htmlFor="tirajeMinimo">Tiraje Mínimo</label>
                    <InputNumber
                        id="tirajeMinimo"
                        value={product.tirajeMinimo ?? 0}
                        onValueChange={(e) => onInputNumberChange(e, 'tirajeMinimo')}
                        suffix=" pzas"
                    />
                </div>

                <div className="field col-12 md:col-4">
                    <label htmlFor="tiempoProduccionDias">Días de Prod.</label>
                    <InputNumber
                        id="tiempoProduccionDias"
                        value={product.tiempoProduccionDias ?? 0}
                        onValueChange={(e) => onInputNumberChange(e, 'tiempoProduccionDias')}
                        suffix=" días"
                    />
                </div>

                <div className="field col-12">
                    <label htmlFor="volumenDescuentoCantidad">Volumen para Descuento</label>
                    <InputNumber
                        id="volumenDescuentoCantidad"
                        value={product.volumenDescuentoCantidad ?? 0}
                        onValueChange={(e) => onInputNumberChange(e, 'volumenDescuentoCantidad')}
                        suffix=" pzas"
                    />
                </div>

            </div>
        </Dialog>
    );
};