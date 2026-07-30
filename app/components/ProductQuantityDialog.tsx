import React, { useState, useEffect } from 'react';
import { Dialog } from 'primereact/dialog';
import { Button } from 'primereact/button';
import { InputNumber } from 'primereact/inputnumber';
import { Producto } from "@/app/types/orders";

interface ProductQuantityDialogProps {
    visible: boolean;
    product: Producto | null;
    onHide: () => void;
    onConfirm: (product: Producto, quantity: number) => void;
}

export const ProductQuantityDialog = ({ visible, product, onHide, onConfirm }: ProductQuantityDialogProps) => {
    const [quantity, setQuantity] = useState<number>(1);

    useEffect(() => {
        if (visible && product) {
            setQuantity(product.tirajeMinimo ?? 1);
        }
    }, [visible, product]);

    const handleConfirm = () => {
        if (product) {
            onConfirm(product, quantity);
            onHide();
        }
    };

    if (!product) return null;
    const isM2 = product.unidadVenta.toLowerCase().includes('m²');
    const activePrice = product.precioUnitario;
    const subtotal = quantity * activePrice;
    const paquetesEquivalentes = product.cantidadPaquete
        ? (quantity / product.cantidadPaquete).toFixed(2)
        : null;

    return (
        <Dialog
            header={
                <div className="flex flex-column gap-1">
                    <span className="text-xl font-bold">{product.descripcion}</span>
                    <div className="flex align-items-center gap-2 text-sm font-normal text-500">
                        <i className="pi pi-tag"></i>
                        <span>Formato: <span className="text-900 font-semibold">{product.formatoTamano}</span></span>
                        <span>|</span>
                        <span>Venta: <span className="text-blue-600 font-semibold">{product.unidadVenta}</span></span>
                    </div>
                </div>
            }
            visible={visible}
            style={{ width: '30vw', minWidth: '400px' }}
            modal
            onHide={onHide}
            footer={
                <div className="flex justify-content-end gap-2">
                    <Button label="Cancelar" icon="pi pi-times" onClick={onHide} className="p-button-text" />
                    <Button label="Agregar a la Orden" icon="pi pi-check" onClick={handleConfirm} autoFocus />
                </div>
            }
        >
            <div className="flex flex-column gap-4 pt-3">
                {/* INPUT PRINCIPAL */}
                <div className="field p-fluid m-0">
                    <label htmlFor="cantidad" className="font-bold text-lg mb-2 block">
                        {isM2 ? 'Metros Cuadrados (m²):' : 'Cantidad total de piezas:'}
                    </label>

                    <InputNumber
                        id="cantidad"
                        value={quantity}
                        onValueChange={(e) => setQuantity(e.value ?? 1)}
                        showButtons
                        buttonLayout="horizontal"
                        step={isM2 ? 0.5 : 1}
                        mode="decimal"
                        minFractionDigits={isM2 ? 2 : 0}
                        maxFractionDigits={isM2 ? 2 : 0}
                        min={product.tirajeMinimo ?? 1}
                        decrementButtonClassName="p-button-secondary"
                        incrementButtonClassName="p-button-primary"
                        incrementButtonIcon="pi pi-plus"
                        decrementButtonIcon="pi pi-minus"
                        inputClassName="text-center text-xl font-bold"
                    />

                    <div className="flex justify-content-between mt-2">
                        <small className="text-500">
                            Mínimo requerido: {product.tirajeMinimo} {isM2 ? 'm²' : 'piezas'}
                        </small>

                        {/* INFORMACIÓN DE PAQUETES (Ayuda visual) */}
                        {product.cantidadPaquete && (
                            <small className="text-blue-600 font-semibold">
                                = {Number(paquetesEquivalentes)} {Number(paquetesEquivalentes) === 1 ? 'paquete' : 'paquetes'}
                            </small>
                        )}
                    </div>
                </div>

                {/* CÁLCULO DE TOTALES */}
                <div className="surface-100 p-3 border-round border-1 surface-border">
                    <div className="flex justify-content-between mb-2">
                        <span className="text-600">Precio Unitario:</span>
                        <span className="font-bold text-900">
                            ${product.precioUnitario.toFixed(2)}
                        </span>
                    </div>
                    {product.precioPaquete && (
                        <div className="flex justify-content-between mb-2 text-sm text-500">
                            <span>Ref. Precio Paquete ({product.cantidadPaquete} pzas):</span>
                            <span>${product.precioPaquete.toFixed(2)}</span>
                        </div>
                    )}

                    <div className="border-top-1 surface-border pt-2 mt-2 flex justify-content-between align-items-center">
                        <span className="text-xl font-semibold">Subtotal:</span>
                        <span className="text-xl font-bold text-green-700">
                            ${subtotal.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                        </span>
                    </div>
                </div>
            </div>
        </Dialog>
    );
};