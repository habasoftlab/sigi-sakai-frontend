import React from 'react';
import { Dialog } from 'primereact/dialog';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Button } from 'primereact/button';
import { Dropdown } from 'primereact/dropdown';
import { Checkbox } from 'primereact/checkbox';
import { Divider } from 'primereact/divider';
import { Client } from "@/app/types/clients";

interface QuoteSummaryDialogProps {
    visible: boolean;
    onHide: () => void;
    items: any[];
    total: number;
    productionTime: number;
    assignedClient: Client | null;
    onAssignClient: () => void;
    onNewClient: () => void;
    designers: any[];
    selectedDesigner: number | null;
    onSelectDesigner: (id: number | null) => void;
    requiresBilling: boolean;
    onToggleBilling: (checked: boolean) => void;
    onConfirm: () => void;
}

export const QuoteSummaryDialog = (props: QuoteSummaryDialogProps) => {
    const {
        visible, onHide, items, total, productionTime,
        assignedClient, onAssignClient, onNewClient,
        designers, selectedDesigner, onSelectDesigner,
        requiresBilling, onToggleBilling, onConfirm
    } = props;

    return (
        <Dialog
            header="Confirmar Nueva Cotización"
            visible={visible}
            style={{ width: '60vw', minWidth: '500px' }}
            modal
            onHide={onHide}
        >
            <div className="grid">
                {/* COLUMNA IZQUIERDA: RESUMEN DE PRODUCTOS */}
                <div className="col-12 md:col-8">
                    <DataTable value={items} responsiveLayout="scroll" size="small" showGridlines stripedRows>
                        <Column
                            header="Descripción del producto"
                            body={(rowData) => (
                                <span className="font-semibold">
                                    {rowData.descripcion || rowData.nombre || "Producto"}
                                </span>
                            )}
                        ></Column>
                        <Column field="cantidad" header="Cantidad" body={(item) => `${item.cantidad} u`} className="text-center"></Column>
                        <Column field="importe" header="Importe" body={(item) => `$${item.importe.toFixed(2)}`} className="text-right font-bold"></Column>
                    </DataTable>

                    {/* Totales y Tiempos */}
                    <div className="flex flex-column align-items-end mt-4 gap-2">
                        <div className="text-xl font-bold text-900">
                            Total: <span className="text-primary text-2xl ml-2">${total.toFixed(2)}</span>
                        </div>
                        <div className="text-600 flex align-items-center gap-2 bg-yellow-50 p-2 border-round">
                            <i className="pi pi-clock text-orange-500"></i>
                            <span className="font-medium">Producción estimada: {productionTime} días hábiles</span>
                        </div>
                    </div>
                </div>

                {/* COLUMNA DERECHA: CONFIGURACIÓN DE LA ORDEN */}
                <div className="col-12 md:col-4 p-fluid flex flex-column gap-3">

                    {/* 1. Selector de Cliente */}
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
                                onClick={onAssignClient}
                                tooltip="Cambiar cliente"
                            />
                        </div>
                    ) : (
                        <div className="flex flex-column gap-2 border-1 border-dashed border-300 p-3 border-round surface-50">
                            <span className="text-center text-600 text-sm mb-1">Se requiere un cliente</span>
                            <Button label="Buscar Cliente" icon="pi pi-search" onClick={onAssignClient} severity="secondary" />
                            <Button label="Nuevo Cliente" icon="pi pi-user-plus" outlined onClick={onNewClient} />
                        </div>
                    )}

                    <Divider />

                    {/* 2. Selector de Diseñador */}
                    <span className="p-float-label mt-2">
                        <Dropdown
                            inputId="designer-select"
                            value={selectedDesigner}
                            onChange={(e) => onSelectDesigner(e.value)}
                            options={designers}
                            optionLabel="label"
                            optionValue="value"
                            placeholder="Seleccionar Diseñador"
                            showClear
                            className="w-full"
                        />
                        <label htmlFor="designer-select">Asignar a Diseñador</label>
                    </span>

                    {/* 3. Checkbox Facturación */}
                    <div className={`field-checkbox mt-2 p-3 border-round border-1 ${requiresBilling ? 'surface-100 border-primary' : 'surface-0 border-300'}`}>
                        <Checkbox
                            inputId="facturacion"
                            checked={requiresBilling}
                            onChange={(e) => onToggleBilling(e.checked ?? false)}
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
                        onClick={onConfirm}
                        disabled={!assignedClient}
                    />
                </div>
            </div>
        </Dialog>
    );
};