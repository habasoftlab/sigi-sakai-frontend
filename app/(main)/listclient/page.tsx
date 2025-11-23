'use client';
import React, { useState, useRef } from 'react';
import { classNames } from 'primereact/utils';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Toast } from 'primereact/toast';
import { Button } from 'primereact/button';
import { Dialog } from 'primereact/dialog';
import { InputText } from 'primereact/inputtext';
import { Dropdown } from 'primereact/dropdown';
import { Divider } from 'primereact/divider';
import { FilterMatchMode } from 'primereact/api';
import Link from 'next/link';
import { cfdiOptions, dummyClients, regimenFiscalOptions } from '@/app/api/mockData';

interface Client {
    id: string | null;
    name: string;
    email: string;
    phone: string;
    rfc: string;
    cfdi: string;
    regimenFiscal: string; // --- NUEVO CAMPO
    cp: string;
}

const ListClientsPage = () => {
    const initializedClients = dummyClients.map(c => ({
        ...c,
        regimenFiscal: (c as any).regimenFiscal || ''
    }));

    const [clients, setClients] = useState<Client[]>(initializedClients);
    const [clientDialog, setClientDialog] = useState(false);
    const [deleteClientDialog, setDeleteClientDialog] = useState(false);
    const [client, setClient] = useState<Client>({ id: null, name: '', email: '', phone: '', rfc: '', cfdi: '', regimenFiscal: '', cp: '' });
    const [submitted, setSubmitted] = useState(false);

    const [filters, setFilters] = useState({
        global: { value: null, matchMode: FilterMatchMode.CONTAINS }
    });
    const [globalFilterValue, setGlobalFilterValue] = useState('');

    const toast = useRef<Toast>(null);

    const openNew = () => {
        setClient({ id: null, name: '', email: '', phone: '', rfc: '', cfdi: '', regimenFiscal: '', cp: '' });
        setSubmitted(false);
        setClientDialog(true);
    };

    const hideDialog = () => {
        setSubmitted(false);
        setClientDialog(false);
    };

    const hideDeleteClientDialog = () => {
        setDeleteClientDialog(false);
    };

    const saveClient = () => {
        setSubmitted(true);

        if (client.name.trim()) {
            let _clients = [...clients];
            let _client = { ...client };

            if (client.id) {
                const index = findIndexById(client.id);
                _clients[index] = _client;
                toast.current?.show({ severity: 'success', summary: 'Éxito', detail: 'Cliente actualizado', life: 3000 });
            } else {
                _client.id = createId();
                _clients.push(_client);
                toast.current?.show({ severity: 'success', summary: 'Éxito', detail: 'Cliente creado', life: 3000 });
            }

            setClients(_clients);
            setClientDialog(false);
            setClient({ id: null, name: '', email: '', phone: '', rfc: '', cfdi: '', regimenFiscal: '', cp: '' });
        }
    };

    const editClient = (client: Client) => {
        setClient({ ...client });
        setClientDialog(true);
    };

    const confirmDeleteClient = (client: Client) => {
        setClient(client);
        setDeleteClientDialog(true);
    };

    const deleteClient = () => {
        let _clients = clients.filter((val) => val.id !== client.id);
        setClients(_clients);
        setDeleteClientDialog(false);
        setClient({ id: null, name: '', email: '', phone: '', rfc: '', cfdi: '', regimenFiscal: '', cp: '' });
        toast.current?.show({ severity: 'success', summary: 'Éxito', detail: 'Cliente eliminado', life: 3000 });
    };

    const onGlobalFilterChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        let _filters = { ...filters };
        // @ts-ignore
        _filters['global'].value = value;
        setFilters(_filters);
        setGlobalFilterValue(value);
    };

    const findIndexById = (id: string) => {
        let index = -1;
        for (let i = 0; i < clients.length; i++) {
            if (clients[i].id === id) {
                index = i;
                break;
            }
        }
        return index;
    };

    const createId = () => {
        return 'C' + Math.floor(Math.random() * 10000).toString();
    };

    const onInputChange = (e: any, name: string) => {
        const val = (e.target && e.target.value) || e.value || '';
        let _client = { ...client };
        // @ts-ignore
        _client[name] = val;
        setClient(_client);
    };

    const header = (
        <div className="flex flex-column md:flex-row md:align-items-center justify-content-between gap-2">
            <span className="p-input-icon-left w-full md:w-auto">
                <i className="pi pi-search" />
                <InputText
                    value={globalFilterValue}
                    onChange={onGlobalFilterChange}
                    placeholder="Buscar cliente..."
                    className="w-full md:w-auto"
                />
            </span>
            <div className="flex gap-2">
                <Button label="Agregar cliente" icon="pi pi-plus" onClick={openNew} />
            </div>
        </div>
    );

    const actionBodyTemplate = (rowData: Client) => {
        return (
            <div className="flex gap-2">
                <Button icon="pi pi-pencil" rounded text severity="info" onClick={() => editClient(rowData)} />
                <Button icon="pi pi-trash" rounded text severity="danger" onClick={() => confirmDeleteClient(rowData)} />
            </div>
        );
    };

    const deleteClientDialogFooter = (
        <React.Fragment>
            <Button label="No" icon="pi pi-times" text onClick={hideDeleteClientDialog} />
            <Button label="Sí" icon="pi pi-check" text severity="danger" onClick={deleteClient} />
        </React.Fragment>
    );

    const clientDialogFooter = (
        <div className="pt-2">
            <Button label="Cancelar" icon="pi pi-times" text onClick={hideDialog} />
            <Button label="Guardar" icon="pi pi-check" text onClick={saveClient} />
        </div>
    );

    return (
        <div className="card">
            <Toast ref={toast} />

            <div className="flex justify-content-between align-items-center mb-4">
                <h2 className="m-0">Lista de Clientes</h2>
                <Link href="/counter" passHref legacyBehavior>
                    <a className="p-button p-component p-button-text p-button-plain">
                        <i className="pi pi-arrow-left mr-2"></i>
                        <span className="font-bold">Volver</span>
                    </a>
                </Link>
            </div>

            <DataTable
                value={clients}
                paginator
                rows={10}
                header={header}
                filters={filters}
                globalFilterFields={['name', 'email', 'phone', 'rfc', 'cfdi', 'regimenFiscal', 'cp']}
                emptyMessage="No se encontraron clientes."
                responsiveLayout="scroll"
                stripedRows
            >
                <Column field="name" header="Nombre" sortable style={{ minWidth: '12rem' }}></Column>
                <Column field="email" header="Correo" sortable style={{ minWidth: '12rem' }}></Column>
                <Column field="phone" header="Teléfono" sortable style={{ minWidth: '10rem' }}></Column>
                <Column field="rfc" header="R.F.C." sortable style={{ minWidth: '10rem' }}></Column>
                <Column field="regimenFiscal" header="Régimen" sortable style={{ minWidth: '12rem' }}></Column>
                <Column field="cfdi" header="C.F.D.I." sortable style={{ minWidth: '8rem' }}></Column>
                <Column field="cp" header="C.P." sortable style={{ minWidth: '6rem' }}></Column>
                <Column body={actionBodyTemplate} exportable={false} style={{ minWidth: '8rem' }}></Column>
            </DataTable>

            <Dialog
                visible={clientDialog}
                style={{ width: '50vw', minWidth: '500px' }}
                header="Detalles del Cliente"
                modal
                className="p-fluid"
                footer={clientDialogFooter}
                onHide={hideDialog}
            >
                <div className="p-fluid formgrid grid pt-2">
                    <div className="field col-12 mb-2">
                        <label htmlFor="name" className="font-bold block mb-1">Nombre / Razón Social*</label>
                        <InputText
                            id="name"
                            value={client.name}
                            onChange={(e) => onInputChange(e, 'name')}
                            required
                            autoFocus
                            className={classNames({ 'p-invalid': submitted && !client.name })}
                        />
                        {submitted && !client.name && <small className="p-error block">El nombre es obligatorio.</small>}
                    </div>
                    <div className="field col-12 md:col-6 mb-2">
                        <label htmlFor="email" className="font-bold block mb-1">Correo Electrónico</label>
                        <InputText
                            id="email"
                            value={client.email}
                            onChange={(e) => onInputChange(e, 'email')}
                        />
                    </div>
                    <div className="field col-12 md:col-6 mb-2">
                        <label htmlFor="phone" className="font-bold block mb-1">Teléfono</label>
                        <InputText
                            id="phone"
                            value={client.phone}
                            onChange={(e) => onInputChange(e, 'phone')}
                        />
                    </div>
                    <div className="col-12">
                        <Divider align="left" className="my-2">
                            <span className="p-tag p-tag-rounded text-xs">Datos Fiscales</span>
                        </Divider>
                    </div>
                    <div className="field col-12 md:col-4 mb-2">
                        <label htmlFor="rfc" className="font-bold block mb-1">R.F.C.</label>
                        <InputText
                            id="rfc"
                            value={client.rfc}
                            onChange={(e) => onInputChange(e, 'rfc')}
                        />
                    </div>
                    <div className="field col-12 md:col-8 mb-2">
                        <label htmlFor="regimenFiscal" className="font-bold block mb-1">Régimen Fiscal</label>
                        <Dropdown
                            id="regimenFiscal"
                            value={client.regimenFiscal}
                            options={regimenFiscalOptions}
                            onChange={(e) => onInputChange(e, 'regimenFiscal')}
                            placeholder="Seleccione régimen"
                            className="w-full"
                            filter
                        />
                    </div>
                    <div className="field col-12 md:col-8 mb-0">
                        <label htmlFor="cfdi" className="font-bold block mb-1">Uso del C.F.D.I.</label>
                        <Dropdown
                            id="cfdi"
                            value={client.cfdi}
                            options={cfdiOptions}
                            onChange={(e) => onInputChange(e, 'cfdi')}
                            placeholder="Seleccione uso"
                            className="w-full"
                        />
                    </div>
                    <div className="field col-12 md:col-4 mb-0">
                        <label htmlFor="cp" className="font-bold block mb-1">Código Postal</label>
                        <InputText
                            id="cp"
                            value={client.cp}
                            onChange={(e) => onInputChange(e, 'cp')}
                        />
                    </div>
                </div>
            </Dialog>

            <Dialog visible={deleteClientDialog} style={{ width: '32rem' }} breakpoints={{ '960px': '75vw', '641px': '90vw' }} header="Confirmar" modal footer={deleteClientDialogFooter} onHide={hideDeleteClientDialog}>
                <div className="confirmation-content">
                    <i className="pi pi-exclamation-triangle mr-3 text-yellow-500" style={{ fontSize: '2rem' }} />
                    {client && (
                        <span>
                            ¿Estás seguro de que quieres eliminar a <b>{client.name}</b>?
                        </span>
                    )}
                </div>
            </Dialog>
        </div>
    );
};

export default ListClientsPage;