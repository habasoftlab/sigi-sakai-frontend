'use client';
import React, { useState, useRef } from 'react';
import { classNames } from 'primereact/utils';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Toast } from 'primereact/toast';
import { Button } from 'primereact/button';
import { Dialog } from 'primereact/dialog';
import { InputText } from 'primereact/inputtext';
import { Dropdown } from 'primereact/dropdown'; // <-- IMPORTAR DROPDOWN
import { FilterMatchMode } from 'primereact/api';
import Link from 'next/link';

// --- INTERFAZ DEL CLIENTE ---
interface Client {
    id: string | null;
    name: string;
    email: string;
    phone: string;
    rfc: string;
    cfdi: string;
    cp: string;
}

// --- DATOS INICIALES ---
const initialClients: Client[] = [
    { id: 'C001', name: 'Juan Pérez', email: 'juan.perez@email.com', phone: '5512345678', rfc: 'PEPJ800101ABC', cfdi: 'G03', cp: '06500' },
    { id: 'C002', name: 'Sofía Herrera', email: 'sofia.herrera@email.com', phone: '5587654321', rfc: 'HESF900202XYZ', cfdi: 'G01', cp: '03100' },
    { id: 'C003', name: 'Carlos Ramírez', email: 'carlos.ramirez@email.com', phone: '5555555555', rfc: 'RACJ750303LMN', cfdi: 'P01', cp: '11520' }
];

const cfdiOptions = [
    { label: 'Gastos en general', value: 'G01' },
    { label: 'Adquisición de mercancías', value: 'G02' },
    { label: 'Honorarios profesionales', value: 'G03' }
];

const ListClientsPage = () => {
    const [clients, setClients] = useState<Client[]>(initialClients);
    const [clientDialog, setClientDialog] = useState(false);
    const [deleteClientDialog, setDeleteClientDialog] = useState(false);
    const [client, setClient] = useState<Client>({ id: null, name: '', email: '', phone: '', rfc: '', cfdi: '', cp: '' });
    const [submitted, setSubmitted] = useState(false);

    const [filters, setFilters] = useState({
        global: { value: null, matchMode: FilterMatchMode.CONTAINS }
    });
    const [globalFilterValue, setGlobalFilterValue] = useState('');

    const toast = useRef<Toast>(null);

    // --- FUNCIONES CRUD ---

    const openNew = () => {
        setClient({ id: null, name: '', email: '', phone: '', rfc: '', cfdi: '', cp: '' });
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
                // Actualizar existente
                const index = findIndexById(client.id);
                _clients[index] = _client;
                toast.current?.show({ severity: 'success', summary: 'Éxito', detail: 'Cliente actualizado', life: 3000 });
            } else {
                // Crear nuevo
                _client.id = createId();
                _clients.push(_client);
                toast.current?.show({ severity: 'success', summary: 'Éxito', detail: 'Cliente creado', life: 3000 });
            }

            setClients(_clients);
            setClientDialog(false);
            setClient({ id: null, name: '', email: '', phone: '', rfc: '', cfdi: '', cp: '' });
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
        setClient({ id: null, name: '', email: '', phone: '', rfc: '', cfdi: '', cp: '' });
        toast.current?.show({ severity: 'success', summary: 'Éxito', detail: 'Cliente eliminado', life: 3000 });
    };

    // --- FILTRADO ---
    const onGlobalFilterChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        let _filters = { ...filters };
        // @ts-ignore
        _filters['global'].value = value;
        setFilters(_filters);
        setGlobalFilterValue(value);
    };

    // --- UTILIDADES ---
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

    // --- MANEJO DE INPUTS (ACTUALIZADO PARA DROPDOWN) ---
    const onInputChange = (e: any, name: string) => {
        // Para Dropdown el valor viene en e.value, para InputText en e.target.value
        const val = (e.target && e.target.value) || e.value || '';
        let _client = { ...client };
        // @ts-ignore
        _client[name] = val;
        setClient(_client);
    };

    // --- RENDERIZADO ---

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
                <Link href="/cotizador" passHref legacyBehavior>
                    <a className="p-button p-component p-button-outlined p-button-secondary">
                        <i className="pi pi-arrow-left p-button-icon p-button-icon-left"></i>
                        <span className="p-button-label">Regresar</span>
                    </a>
                </Link>
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
        <React.Fragment>
            <Button label="Cancelar" icon="pi pi-times" text onClick={hideDialog} />
            <Button label="Guardar" icon="pi pi-check" text onClick={saveClient} />
        </React.Fragment>
    );

    return (
        <div className="card">
            <Toast ref={toast} />

            <h2 className="mb-4">Lista de clientes</h2>

            <DataTable
                value={clients}
                paginator
                rows={10}
                header={header}
                filters={filters}
                globalFilterFields={['name', 'email', 'phone', 'rfc', 'cfdi', 'cp']}
                emptyMessage="No se encontraron clientes."
                responsiveLayout="scroll"
            >
                <Column field="name" header="Nombre" sortable style={{ minWidth: '12rem' }}></Column>
                <Column field="email" header="Correo" sortable style={{ minWidth: '12rem' }}></Column>
                <Column field="phone" header="Teléfono" sortable style={{ minWidth: '10rem' }}></Column>
                <Column field="rfc" header="R.F.C." sortable style={{ minWidth: '10rem' }}></Column>
                <Column field="cfdi" header="C.F.D.I." sortable style={{ minWidth: '8rem' }}></Column>
                <Column field="cp" header="C.P." sortable style={{ minWidth: '6rem' }}></Column>
                <Column body={actionBodyTemplate} exportable={false} style={{ minWidth: '8rem' }}></Column>
            </DataTable>

            {/* --- DIALOGO: Agregar/Editar Cliente (ACTUALIZADO) --- */}
            <Dialog visible={clientDialog} style={{ width: '40vw', minWidth: '450px' }} header="Detalles del Cliente" modal className="p-fluid" footer={clientDialogFooter} onHide={hideDialog}>
                <div className="field">
                    <label htmlFor="name" className="font-bold">Nombre*</label>
                    <InputText id="name" value={client.name} onChange={(e) => onInputChange(e, 'name')} required autoFocus className={classNames({ 'p-invalid': submitted && !client.name })} />
                    {submitted && !client.name && <small className="p-error">El nombre es obligatorio.</small>}
                </div>
                <div className="field">
                    <label htmlFor="email" className="font-bold">Correo Electrónico*</label>
                    <InputText id="email" value={client.email} onChange={(e) => onInputChange(e, 'email')} required className={classNames({ 'p-invalid': submitted && !client.email })} />
                </div>
                <div className="field">
                    <label htmlFor="phone" className="font-bold">Teléfono*</label>
                    <InputText id="phone" value={client.phone} onChange={(e) => onInputChange(e, 'phone')} required />
                </div>

                <div className="formgrid grid">
                    <div className="field col-12 md:col-6">
                        <label htmlFor="rfc" className="font-bold">R.F.C.</label>
                        <InputText id="rfc" value={client.rfc} onChange={(e) => onInputChange(e, 'rfc')} />
                    </div>
                    <div className="field col-12 md:col-6">
                        <label htmlFor="cfdi" className="font-bold">Uso del C.F.D.I.</label>
                        {/* DROPDOWN PARA CFDI */}
                        <Dropdown
                            id="cfdi"
                            value={client.cfdi}
                            options={cfdiOptions}
                            onChange={(e) => onInputChange(e, 'cfdi')}
                            placeholder="Seleccione un uso"
                            className="w-full"
                        />
                    </div>
                </div>
                <div className="field">
                    <label htmlFor="cp" className="font-bold">Código Postal</label>
                    <InputText id="cp" value={client.cp} onChange={(e) => onInputChange(e, 'cp')} />
                </div>
            </Dialog>

            {/* --- DIALOGO: Eliminar Cliente --- */}
            <Dialog visible={deleteClientDialog} style={{ width: '32rem' }} breakpoints={{ '960px': '75vw', '641px': '90vw' }} header="Confirmar" modal footer={deleteClientDialogFooter} onHide={hideDeleteClientDialog}>
                <div className="confirmation-content">
                    <i className="pi pi-exclamation-triangle mr-3" style={{ fontSize: '2rem' }} />
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