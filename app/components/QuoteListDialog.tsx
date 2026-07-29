import React from 'react';
import { Dialog } from 'primereact/dialog';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Button } from 'primereact/button';
import { Client } from "@/app/types/clients";

interface QuoteListDialogProps {
    visible: boolean;
    onHide: () => void;
    quotes: any[];
    clients: Client[];
    loading: boolean;
    totalRecords: number;
    lazyParams: { first: number, rows: number, page: number };
    onPage: (event: any) => void;
    expandedRows: any[];
    onRowToggle: (e: any) => void;
    onRetake: (rowData: any) => void;
}

export const QuoteListDialog = (props: QuoteListDialogProps) => {
    const {
        visible, onHide, quotes, clients, loading,
        totalRecords, lazyParams, onPage,
        expandedRows, onRowToggle, onRetake
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
            header="Lista de Cotizaciones"
            visible={visible}
            style={{ width: '80vw', minWidth: '350px' }}
            modal
            onHide={onHide}
        >
            <DataTable
                value={quotes}
                lazy={true}
                dataKey="idOrden"
                paginator={true}
                first={lazyParams.first}
                rows={lazyParams.rows}
                totalRecords={totalRecords}
                onPage={onPage}
                rowsPerPageOptions={[5, 10, 20]}
                loading={loading}
                emptyMessage="No se encontraron cotizaciones."
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
                        return c ? c.nombre : 'Público General';
                    }}
                />
                <Column
                    field="montoTotal"
                    header="Total"
                    body={(d) => `$${d.montoTotal.toFixed(2)}`}
                    style={{ width: '20%' }}
                    className="text-right font-medium"
                />
                <Column
                    header="Acción"
                    style={{ width: '15%', textAlign: 'center' }}
                    body={(data) => (
                        <Button
                            label="Retomar"
                            icon="pi pi-arrow-right"
                            size="small"
                            severity="info"
                            onClick={() => onRetake(data)}
                            tooltip="Ver detalles y editar"
                        />
                    )}
                />
            </DataTable>
        </Dialog>
    );
};