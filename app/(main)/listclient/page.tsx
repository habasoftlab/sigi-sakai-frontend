'use client';
import React, { useState, useRef, useEffect } from 'react';
import { classNames } from 'primereact/utils';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Toast } from 'primereact/toast';
import { Button } from 'primereact/button';
import { Dialog } from 'primereact/dialog';
import { InputText } from 'primereact/inputtext';
import { InputTextarea } from 'primereact/inputtextarea';
import { Dropdown } from 'primereact/dropdown';
import { Divider } from 'primereact/divider';
import { FilterMatchMode } from 'primereact/api';
import Link from 'next/link';
import { ClientService } from "@/app/service/clientService";
import { CatalogService } from "@/app/service/catalogServices";
import { Client, ClientRequest } from "@/app/types/clients";

const initialClient: Client = {
    id: null,
    nombre: '',
    email: null,
    telefono: null,
    rfc: null,
    razonSocial: null,
    direccionFiscal: null,
    idUsoCfdi: null,
    idRegimenFiscal: null,
};

interface DropdownOption {
    label: string;
    value: number;
}

const ListClientsPage = () => {
    const [clients, setClients] = useState<Client[]>([]);
    const [clientDialog, setClientDialog] = useState(false);
    const [deleteClientDialog, setDeleteClientDialog] = useState(false);
    const [client, setClient] = useState<Client>(initialClient);
    const [submitted, setSubmitted] = useState(false);
    const [loading, setLoading] = useState(false);
    const [globalFilterValue, setGlobalFilterValue] = useState('');
    const [filters, setFilters] = useState({
        global: { value: null, matchMode: FilterMatchMode.CONTAINS }
    });
    const [regimenOptions, setRegimenOptions] = useState<DropdownOption[]>([]);
    const [cfdiOptions, setCfdiOptions] = useState<DropdownOption[]>([]);
    const toast = useRef<Toast>(null);

    useEffect(() => {
        loadClients();
        loadCatalogs();
    }, []);

    const loadClients = async () => {
        setLoading(true);
        try {
            const data = await ClientService.getAll();
            const normalized = data.map((c: any) => ({
                ...c,
                id: c.idCliente || c.id || null,

                nombre: c.nombre ?? '',
                razonSocial: c.razonSocial ?? c.nombre ?? '',
            }));
            setClients(normalized);
        } catch (err) {
            console.error(err);
            toast.current?.show({ severity: 'error', summary: 'Error', detail: 'No se pudieron cargar los clientes', life: 4000 });
        } finally {
            setLoading(false);
        }
    };

    const loadCatalogs = async () => {
        try {
            const [regimenesData, usosData] = await Promise.all([
                CatalogService.getRegimenesFiscales(),
                CatalogService.getUsosCfdi()
            ]);
            const regimenesFormateados = regimenesData.map(r => ({
                label: `${r.clave} - ${r.descripcion}`,
                value: r.idRegimen
            }));
            setRegimenOptions(regimenesFormateados);

            const usosFormateados = usosData.map(u => ({
                label: `${u.clave} - ${u.descripcion}`,
                value: u.idUsoCfdi
            }));
            setCfdiOptions(usosFormateados);

        } catch (error) {
            console.error("Error cargando catálogos", error);
        }
    };

    const openNew = () => {
        setClient({ ...initialClient });
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

    const saveClient = async () => {
        setSubmitted(true);

        if (!client.nombre || !client.nombre.trim()) {
            toast.current?.show({ severity: 'warn', summary: 'Atención', detail: 'El nombre es obligatorio', life: 3000 });
            return;
        }

        const payload: ClientRequest = {
            nombre: client.nombre,
            email: client.email || null,
            telefono: client.telefono || null,
            rfc: client.rfc || null,
            razonSocial: client.razonSocial || client.nombre,
            direccionFiscal: client.direccionFiscal || null,
            idUsoCfdi: client.idUsoCfdi || null,
            idRegimenFiscal: client.idRegimenFiscal || null,
        };

        try {
            if (client.id !== null) {
                await ClientService.update(client.id, payload);
                toast.current?.show({ severity: 'success', summary: 'Éxito', detail: 'Cliente actualizado', life: 3000 });
            } else {
                await ClientService.create(payload);
                toast.current?.show({ severity: 'success', summary: 'Éxito', detail: 'Cliente creado', life: 3000 });
            }

            await loadClients();
            setClientDialog(false);
            setClient({ ...initialClient });
        } catch (error) {
            console.error(error);
            toast.current?.show({ severity: 'error', summary: 'Error', detail: 'Ocurrió un error con el API', life: 3000 });
        }
    };

    const editClient = (c: Client) => {
        setClient({ ...c });
        setClientDialog(true);
    };

    const confirmDeleteClient = (c: Client) => {
        setClient(c);
        setDeleteClientDialog(true);
    };

    const deleteClient = async () => {
        if (!client.id) return;
        try {
            await ClientService.delete(client.id);
            const _clients = clients.filter((val) => val.id !== client.id);
            setClients(_clients);

            setDeleteClientDialog(false);
            setClient({ ...initialClient });
            toast.current?.show({ severity: 'success', summary: 'Eliminado', detail: 'Cliente eliminado', life: 3000 });
        } catch (error) {
            console.error(error);
            toast.current?.show({ severity: 'error', summary: 'Error', detail: 'No se pudo eliminar el cliente', life: 3000 });
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

    const onInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>, field: keyof Client) => {
        const val = (e.target && e.target.value) || '';
        setClient(prev => ({ ...prev, [field]: val }));
    };

    const onDropdownChange = (e: any, field: keyof Client) => {
        setClient(prev => ({ ...prev, [field]: e.value }));
    };

    const getRegimenLabel = (id: number | null) => {
        if (!id) return '';
        const found = regimenOptions.find(op => op.value === id);
        return found ? found.label : 'Cargando...';
    };

    const getCfdiLabel = (id: number | null) => {
        if (!id) return '';
        const found = cfdiOptions.find(op => op.value === id);
        return found ? found.label : 'Cargando...';
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

    const actionBodyTemplate = (rowData: Client) => (
        <div className="flex gap-2 justify-content-center">
            <Button icon="pi pi-pencil" rounded text severity="info" onClick={() => editClient(rowData)} />
            <Button icon="pi pi-trash" rounded text severity="danger" onClick={() => confirmDeleteClient(rowData)} />
        </div>
    );

    const clientDialogFooter = (
        <div className="pt-2">
            <Button label="Cancelar" icon="pi pi-times" text onClick={hideDialog} />
            <Button label="Guardar" icon="pi pi-check" text onClick={saveClient} />
        </div>
    );

    const deleteClientDialogFooter = (
        <>
            <Button label="No" icon="pi pi-times" text onClick={hideDeleteClientDialog} />
            <Button label="Sí" icon="pi pi-check" text severity="danger" onClick={deleteClient} />
        </>
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
                // CAMBIO 1: Reemplazamos 'cp' por 'direccionFiscal' en la búsqueda
                globalFilterFields={['nombre', 'email', 'telefono', 'rfc', 'direccionFiscal']}
                emptyMessage="No se encontraron clientes."
                responsiveLayout="scroll"
                stripedRows
                loading={loading}
                dataKey="id"
            >
                <Column field="nombre" header="Nombre" sortable style={{ minWidth: '12rem' }} />
                <Column field="email" header="Correo" sortable style={{ minWidth: '12rem' }} />
                <Column field="telefono" header="Teléfono" sortable style={{ minWidth: '10rem' }} />
                <Column field="rfc" header="R.F.C." sortable style={{ minWidth: '10rem' }} />
                <Column body={(row: Client) => getRegimenLabel(row.idRegimenFiscal)} header="Régimen Fiscal" sortable style={{ minWidth: '12rem' }} />
                <Column body={(row: Client) => getCfdiLabel(row.idUsoCfdi)} header="Uso del C.F.D.I." sortable style={{ minWidth: '8rem' }} />
                <Column field="direccionFiscal" header="Dirección Fiscal" sortable style={{ minWidth: '15rem' }} />
                <Column body={actionBodyTemplate} exportable={false} style={{ minWidth: '8rem', textAlign: 'center' }} />
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
                        <label htmlFor="nombre" className="font-bold block mb-1">Nombre / Razón Social*</label>
                        <InputText
                            id="nombre"
                            value={client.nombre}
                            onChange={(e) => onInputChange(e, 'nombre')}
                            required
                            autoFocus
                            className={classNames({ 'p-invalid': submitted && !client.nombre })}
                        />
                        {submitted && !client.nombre && <small className="p-error block">El nombre es obligatorio.</small>}
                    </div>

                    <div className="field col-12 md:col-6 mb-2">
                        <label htmlFor="email" className="font-bold block mb-1">Correo Electrónico</label>
                        <InputText id="email" value={client.email || ''} onChange={(e) => onInputChange(e, 'email')} />
                    </div>

                    <div className="field col-12 md:col-6 mb-2">
                        <label htmlFor="telefono" className="font-bold block mb-1">Teléfono</label>
                        <InputText id="telefono" value={client.telefono || ''} onChange={(e) => onInputChange(e, 'telefono')} />
                    </div>

                    <div className="col-12">
                        <Divider align="left" className="my-2">
                            <span className="p-tag p-tag-rounded text-xs">Datos Fiscales</span>
                        </Divider>
                    </div>

                    <div className="field col-12 mb-2">
                        <label htmlFor="rfc" className="font-bold block mb-1">R.F.C.</label>
                        <InputText id="rfc" value={client.rfc || ''} onChange={(e) => onInputChange(e, 'rfc')} />
                    </div>

                    <div className="field col-12 mb-2">
                        <label htmlFor="direccionFiscal" className="font-bold block mb-1">Dirección Fiscal</label>
                        <InputTextarea
                            id="direccionFiscal"
                            value={client.direccionFiscal || ''}
                            onChange={(e) => onInputChange(e, 'direccionFiscal')}
                            rows={2}
                            autoResize
                        />
                    </div>

                    <div className="field col-12 md:col-6 mb-2">
                        <label htmlFor="idRegimenFiscal" className="font-bold block mb-1">Régimen Fiscal</label>
                        <Dropdown
                            id="idRegimenFiscal"
                            value={client.idRegimenFiscal}
                            options={regimenOptions}
                            onChange={(e) => onDropdownChange(e, 'idRegimenFiscal')}
                            placeholder="Seleccione régimen"
                            className="w-full"
                        />
                    </div>

                    <div className="field col-12 md:col-6 mb-0">
                        <label htmlFor="idUsoCfdi" className="font-bold block mb-1">Uso del C.F.D.I.</label>
                        <Dropdown
                            id="idUsoCfdi"
                            value={client.idUsoCfdi}
                            options={cfdiOptions}
                            onChange={(e) => onDropdownChange(e, 'idUsoCfdi')}
                            placeholder="Seleccione uso"
                            className="w-full"
                        />
                    </div>
                </div>
            </Dialog>

            <Dialog visible={deleteClientDialog} style={{ width: '32rem' }} breakpoints={{ '960px': '75vw', '641px': '90vw' }} header="Confirmar" modal footer={deleteClientDialogFooter} onHide={hideDeleteClientDialog}>
                <div className="confirmation-content">
                    <i className="pi pi-exclamation-triangle mr-3 text-yellow-500" style={{ fontSize: '2rem' }} />
                    {client && (
                        <span>
                            ¿Estás seguro de que quieres eliminar a <b>{client.nombre}</b>?
                        </span>
                    )}
                </div>
            </Dialog>
        </div>
    );
};

export default ListClientsPage;