import React, { useState, useEffect } from 'react';
import { Dialog } from 'primereact/dialog';
import { Button } from 'primereact/button';
import { InputText } from 'primereact/inputtext';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { FilterMatchMode } from 'primereact/api';
import { Client } from "@//app/types/clients";

interface Props {
    visible: boolean;
    clients: Client[];
    onHide: () => void;
    onSelect: (client: Client) => void;
}

export const ClientSearchDialog = ({ visible, clients, onHide, onSelect }: Props) => {
    const [globalFilterValue, setGlobalFilterValue] = useState('');
    const [filters, setFilters] = useState({
        global: { value: null, matchMode: FilterMatchMode.CONTAINS }
    });
    const [selectedClient, setSelectedClient] = useState<Client | null>(null);
    useEffect(() => {
        if (visible) {
            setGlobalFilterValue('');
            setFilters({
                global: { value: null, matchMode: FilterMatchMode.CONTAINS }
            });
            setSelectedClient(null);
        }
    }, [visible]);

    const onGlobalFilterChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        let _filters = { ...filters };
        // @ts-ignore
        _filters['global'].value = value;
        setFilters(_filters);
        setGlobalFilterValue(value);
    };

    const confirmSelection = () => {
        if (selectedClient) {
            onSelect(selectedClient);
            onHide();
        }
    };

    return (
        <Dialog
            header="Asignar Cliente"
            visible={visible}
            style={{ width: '75vw', minWidth: '600px' }}
            modal
            onHide={onHide}
            footer={
                <div>
                    <Button label="Cancelar" icon="pi pi-times" onClick={onHide} className="p-button-text" />
                    <Button label="Seleccionar" icon="pi pi-check" onClick={confirmSelection} autoFocus disabled={!selectedClient} />
                </div>
            }
        >
            <div className="p-fluid mb-2">
                <span className="p-input-icon-left w-full">
                    <i className="pi pi-search" />
                    <InputText
                        value={globalFilterValue}
                        onChange={onGlobalFilterChange}
                        placeholder="Buscar por nombre, correo o RFC..."
                        autoFocus
                    />
                </span>
            </div>
            <DataTable
                value={clients}
                paginator
                rows={5}
                selectionMode="single"
                selection={selectedClient}
                onSelectionChange={(e) => setSelectedClient(e.value as Client)}
                filters={filters}
                globalFilterFields={['nombre', 'email', 'rfc']}
                emptyMessage="No se encontraron clientes."
                stripedRows
            >
                <Column field="nombre" header="Nombre" sortable />
                <Column field="email" header="Correo" sortable />
                <Column field="rfc" header="RFC" sortable />
                <Column selectionMode="single" headerStyle={{ width: '3rem' }}></Column>
            </DataTable>
        </Dialog>
    );
};