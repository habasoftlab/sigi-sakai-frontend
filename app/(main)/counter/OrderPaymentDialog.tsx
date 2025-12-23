import React, { useState, useEffect } from 'react';
import { Dialog } from 'primereact/dialog';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Button } from 'primereact/button';
import { InputNumber } from 'primereact/inputnumber';
import { InputText } from 'primereact/inputtext';
import { Divider } from 'primereact/divider';
import { FileUpload } from 'primereact/fileupload';

interface OrderPaymentDialogProps {
    visible: boolean;
    onHide: () => void;
    orderId: number | null;
    items: any[];
    total: number;
    paidAmount: number;
    paymentConditions: any[];
    onConfirmPayment: (paymentData: PaymentData) => void;
    isSubmitting: boolean;
}

export interface PaymentData {
    amount: number;
    paymentType: 'unico' | 'anticipo' | 'plazos';
    notes: string;
    conditionId: number;
    file: File | null;
}

export const OrderPaymentDialog = (props: OrderPaymentDialogProps) => {
    const {
        visible, onHide, orderId, items, total, paidAmount,
        paymentConditions, onConfirmPayment, isSubmitting
    } = props;

    const [paymentType, setPaymentType] = useState<'unico' | 'anticipo' | 'plazos'>('unico');
    const [advanceAmount, setAdvanceAmount] = useState<number>(0);
    const [orderNotes, setOrderNotes] = useState('');
    const [selectedFile, setSelectedFile] = useState<File | null>(null);

    useEffect(() => {
        if (visible) {
            setPaymentType('unico');
            const saldo = total - paidAmount;
            setAdvanceAmount(saldo > 0 ? Number(saldo.toFixed(2)) : 0);
            setOrderNotes('');
            setSelectedFile(null);
        }
    }, [visible, total, paidAmount]);

    const handleQuickSet = (type: 'unico' | 'anticipo' | 'plazos') => {
        setPaymentType(type);
        const saldo = total - paidAmount;
        let monto = 0;

        if (type === 'unico') {
            monto = saldo;
        } else if (type === 'anticipo') {
            monto = total * 0.50;
        } else if (type === 'plazos') {
            const divisor = total >= 3000 ? 3 : 2;
            const letra = total / divisor;
            monto = letra > saldo ? saldo : letra;
        }
        setAdvanceAmount(Number(Math.max(0, monto).toFixed(2)));
    };

    const handleConfirmClick = () => {
        let conditionId = 1; // Default
        if (paymentType === 'unico') {
            conditionId = paymentConditions.find(c => c.numeroPlazos === 1)?.idCondicion || 1;
        } else if (paymentType === 'anticipo') {
            conditionId = paymentConditions.find(c => c.descripcion.includes('20%'))?.idCondicion
                || paymentConditions.find(c => c.numeroPlazos === 2)?.idCondicion || 1;
        } else {
            const plazos = total >= 3000 ? 3 : 2;
            conditionId = paymentConditions.find(c => c.numeroPlazos === plazos)?.idCondicion || 1;
        }
        onConfirmPayment({
            amount: advanceAmount,
            paymentType,
            notes: orderNotes,
            conditionId,
            file: selectedFile
        });
    };

    const saldoPendiente = total - paidAmount;
    const restanteFinal = Math.max(0, saldoPendiente - advanceAmount);

    return (
        <Dialog
            header={items.length > 0 ? `Resumen de la orden #${orderId || ''}` : `Abonar orden #${orderId || ''}`}
            visible={visible}
            style={{ width: '85vw', maxWidth: '1200px' }}
            modal
            onHide={onHide}
        >
            <div className="grid">
                {/* --- COLUMNA IZQUIERDA: DETALLES --- */}
                <div className="col-12 lg:col-8">
                    <div className="surface-card p-4 border-round shadow-1 h-full">
                        <h3 className="mb-4 text-700 text-xl font-bold flex align-items-center gap-2">
                            <i className="pi pi-list text-primary"></i>
                            Detalle de la Orden
                        </h3>

                        <DataTable
                            value={items}
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
                                <span className="text-xl text-600 mr-3">Total de la Orden:</span>
                                <span className="text-3xl font-bold text-primary">${total.toFixed(2)}</span>
                            </div>
                        </div>

                        <Divider />

                        <div className="mb-4">
                            <label className="font-bold block mb-2 text-700">
                                <i className="pi pi-cloud-upload mr-2"></i>
                                Archivos / Diseño
                            </label>
                            <FileUpload
                                mode="advanced"
                                name="demo[]"
                                accept="image/*,application/pdf"
                                maxFileSize={10000000}
                                chooseLabel="Seleccionar"
                                uploadLabel="Guardar"
                                cancelLabel="Cancelar"
                                customUpload
                                auto={false}
                                onSelect={(e) => {
                                    if (e.files && e.files.length > 0) setSelectedFile(e.files[0]);
                                }}
                                onRemove={() => setSelectedFile(null)}
                                onClear={() => setSelectedFile(null)}
                                emptyTemplate={<p className="m-0 p-3 text-center text-500">Arrastra archivos aquí.</p>}
                            />
                        </div>
                    </div>
                </div>

                {/* --- COLUMNA DERECHA: PAGOS --- */}
                <div className="col-12 lg:col-4">
                    <div className="surface-card p-4 border-round shadow-1 h-full flex flex-column">
                        <h3 className="mb-3 text-700 text-xl font-bold">Método de Pago</h3>

                        {/* Botones de Selección Rápida */}
                        <div className="flex flex-column gap-2 mb-4">
                            <Button
                                label="Pago Total (Liquidar)"
                                icon="pi pi-check-circle"
                                className={`p-button-sm text-left ${paymentType === 'unico' ? 'p-button-primary' : 'p-button-outlined p-button-secondary'}`}
                                onClick={() => handleQuickSet('unico')}
                            />
                            <Button
                                label="Anticipo (50%)"
                                icon="pi pi-wallet"
                                className={`p-button-sm text-left ${paymentType === 'anticipo' ? 'p-button-primary' : 'p-button-outlined p-button-secondary'}`}
                                onClick={() => handleQuickSet('anticipo')}
                            />
                            <Button
                                label={`Plazos (${total >= 3000 ? '3' : '2'} Pagos)`}
                                icon="pi pi-calendar"
                                className={`p-button-sm text-left ${paymentType === 'plazos' ? 'p-button-primary' : 'p-button-outlined p-button-secondary'}`}
                                onClick={() => handleQuickSet('plazos')}
                                disabled={total < 1000}
                            />
                        </div>

                        <Divider />

                        {/* Input de Monto */}
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
                                    max={saldoPendiente + 0.1}
                                    inputStyle={{ fontWeight: 'bold', fontSize: '1.2rem' }}
                                    className={advanceAmount > saldoPendiente ? 'p-invalid' : ''}
                                />
                            </div>

                            {/* Validaciones Visuales */}
                            <div className="mt-1">
                                {advanceAmount > (saldoPendiente + 0.1) && (
                                    <div className="text-red-500 text-xs font-bold animate-fade-in">
                                        <i className="pi pi-times-circle mr-1"></i>
                                        El monto excede el saldo pendiente (${saldoPendiente.toFixed(2)})
                                    </div>
                                )}
                                {paymentType === 'anticipo' && total > 0 && advanceAmount < (total * 0.20) && (
                                    <div className="text-orange-500 text-xs flex align-items-center gap-1">
                                        <i className="pi pi-info-circle"></i>
                                        <span>Sugerido 20% mín: ${(total * 0.20).toFixed(2)}</span>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Boleta de Saldos */}
                        <div className="surface-100 p-3 border-round mb-4 mt-2 text-sm">
                            <div className="flex justify-content-between mb-1">
                                <span className="text-600">Total Orden:</span>
                                <span className="font-semibold">${total.toFixed(2)}</span>
                            </div>
                            {paidAmount > 0 && (
                                <div className="flex justify-content-between mb-1">
                                    <span className="text-600">Abonado anteriormente:</span>
                                    <span className="font-semibold text-green-600">-${paidAmount.toFixed(2)}</span>
                                </div>
                            )}
                            <div className="flex justify-content-between mb-2 pt-2 border-top-1 border-300">
                                <span className="text-800 font-bold">Saldo Pendiente:</span>
                                <span className="font-bold text-900">${saldoPendiente.toFixed(2)}</span>
                            </div>
                            <div className="flex justify-content-between mb-2 align-items-center bg-white p-2 border-round">
                                <span className="text-primary font-bold">Abonar Hoy:</span>
                                <span className="font-bold text-primary text-lg">-${advanceAmount.toFixed(2)}</span>
                            </div>
                            <div className="border-top-1 surface-border my-2"></div>
                            <div className="flex justify-content-between align-items-center">
                                <span className="text-900 font-medium">Restante Final:</span>
                                <span className={`text-lg font-bold ${restanteFinal <= 0.1 ? 'text-green-500' : 'text-red-500'}`}>
                                    ${restanteFinal.toFixed(2)}
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
                            onClick={handleConfirmClick}
                            loading={isSubmitting}
                            disabled={!advanceAmount || advanceAmount <= 0 || advanceAmount > (saldoPendiente + 0.5)}
                        />
                    </div>
                </div>
            </div>
        </Dialog>
    );
};