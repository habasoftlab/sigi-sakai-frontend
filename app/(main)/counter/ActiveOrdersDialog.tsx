import React from 'react';
import { Dialog } from 'primereact/dialog';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Button } from 'primereact/button';
import { Tag } from 'primereact/tag';
import { Client } from "@/app/types/clients";

interface ActiveOrdersDialogProps {
    visible: boolean;
    onHide: () => void;
    orders: any[];
    clients: Client[];
    loading: boolean;
    totalRecords: number;
    lazyParams: { first: number, rows: number, page: number };
    onPage: (event: any) => void;
    expandedRows: any[];
    onRowToggle: (e: any) => void;
    onQuickPay: (rowData: any) => void;
}

export const ActiveOrdersDialog = (props: ActiveOrdersDialogProps) => {
    const {
        visible, onHide, orders, clients, loading,
        totalRecords, lazyParams, onPage,
        expandedRows, onRowToggle, onQuickPay
    } = props;

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

    return (
        <Dialog
            header="Lista de Órdenes en Curso"
            visible={visible}
            style={{ width: '80vw' }}
            modal
            onHide={onHide}
        >
            <DataTable
                value={orders}
                lazy={true}
                dataKey="idOrden"
                paginator={true}
                first={lazyParams.first}
                rows={lazyParams.rows}
                totalRecords={totalRecords}
                onPage={onPage}
                rowsPerPageOptions={[5, 10, 20]}
                loading={loading}
                emptyMessage="No hay órdenes activas por el momento."
                // Configuración de Agrupamiento
                rowGroupMode="subheader"
                groupRowsBy="nombreDisenador"
                sortMode="single"
                sortField="nombreDisenador"
                sortOrder={1}
                rowGroupHeaderTemplate={headerTemplate}
                expandableRowGroups
                expandedRows={expandedRows}
                onRowToggle={(e) => onRowToggle(e.data)}
            >
                <Column field="idOrden" header="Folio" style={{ width: '10%' }} className="font-bold" />
                <Column field="fechaCreacion" header="Fecha" body={(d) => new Date(d.fechaCreacion).toLocaleDateString()} style={{ width: '15%' }} />
                <Column
                    header="Cliente"
                    field="idCliente"
                    body={(d) => clients.find(c => c.id === d.idCliente)?.nombre || 'Público General'}
                />
                <Column
                    field="montoTotal"
                    header="Total"
                    body={(d) => `$${d.montoTotal.toFixed(2)}`}
                    className="text-right"
                />
                <Column
                    field="saldoPendiente"
                    header="Saldo"
                    className="text-right"
                    body={(d) => {
                        const saldo = d.saldoPendiente !== undefined ? d.saldoPendiente : (d.montoTotal - (d.montoPagado || 0));
                        return (
                            <span className={saldo > 0.5 ? 'text-red-500 font-bold' : 'text-green-500 font-bold'}>
                                ${saldo.toFixed(2)}
                            </span>
                        );
                    }}
                />
                <Column
                    header="Pagos"
                    style={{ textAlign: 'center', width: '15%' }}
                    body={(data) => {
                        const saldo = data.saldoPendiente !== undefined ? data.saldoPendiente : (data.montoTotal - (data.montoPagado || 0));
                        return saldo > 0.5 ?
                            <Button label="Abonar" icon="pi pi-dollar" severity="success" size="small" onClick={() => onQuickPay(data)} /> :
                            <Tag severity="success" value="Pagado" icon="pi pi-check" />;
                    }}
                />
            </DataTable>
        </Dialog>
    );
};