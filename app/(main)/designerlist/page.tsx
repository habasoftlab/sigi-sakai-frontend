/* eslint-disable @next/next/no-img-element */
'use client';
import React, { useState, useEffect, useRef } from 'react';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Button } from 'primereact/button';
import { Card } from 'primereact/card';
import { Tag } from 'primereact/tag';
import { Toast } from 'primereact/toast';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

// Servicios
import { OrderService } from '@/app/service/orderService';
import { ClientService } from '@/app/service/clientService';

const DesignerListPage = () => {
    const [orders, setOrders] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [totalRecords, setTotalRecords] = useState(0);
    const [lazyParams, setLazyParams] = useState({ first: 0, rows: 10, page: 0 });
    const [clientMap, setClientMap] = useState<Record<number, string>>({});
    const [currentUserId, setCurrentUserId] = useState<number | null>(null);
    const [userName, setUserName] = useState('');

    const toast = useRef<Toast>(null);
    const router = useRouter();

    // 1. Carga Inicial: Usuario y Clientes
    useEffect(() => {
        const initData = async () => {
            // Obtener usuario del storage
            const userStr = localStorage.getItem('user');
            if (!userStr) {
                router.push('/auth/login');
                return;
            }
            const user = JSON.parse(userStr);
            setCurrentUserId(user.id || user.idUsuario); // Ajusta según tu objeto user
            setUserName(user.nombre || 'Diseñador');

            try {
                // Cargar mapa de clientes para mostrar nombres
                const clients = await ClientService.getAll();
                const map: Record<number, string> = {};
                clients.forEach((c: any) => {
                    if (c.id) map[c.id] = c.nombre;
                });
                setClientMap(map);
            } catch (e) {
                console.error("Error cargando clientes", e);
            }
        };

        initData();
    }, [router]);

    // 2. Cargar Órdenes cuando cambia la página o el ID del usuario
    useEffect(() => {
        if (currentUserId) {
            loadOrdersLazy(lazyParams.page, lazyParams.rows);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [lazyParams, currentUserId]);

    const loadOrdersLazy = async (page: number, rows: number) => {
        setLoading(true);
        try {
            if (!currentUserId) return;

            const response = await OrderService.getOrdenesPorDisenador(currentUserId, page, rows);
            
            setOrders(response.content || []);
            setTotalRecords(response.totalElements || 0);

        } catch (error) {
            console.error(error);
            toast.current?.show({ severity: 'error', summary: 'Error', detail: 'No se pudieron cargar tus órdenes.' });
        } finally {
            setLoading(false);
        }
    };

    const onPage = (event: any) => {
        setLazyParams(event);
    };

    const formatCurrency = (value: number) => {
        return value.toLocaleString('es-MX', { style: 'currency', currency: 'MXN' });
    };

    // Plantillas de Columnas
    const clientBodyTemplate = (rowData: any) => {
        // Prioridad: Nombre que venga en la orden > Buscado en mapa > ID
        return rowData.clienteNombre || clientMap[rowData.idCliente] || `Cliente #${rowData.idCliente}`;
    };

    const statusBodyTemplate = (rowData: any) => {
        // Mapeo simple de colores para el diseñador
        // 7: En proceso, 8: Revisión, 9: Aprobado, 10: Rechazado
        const statusId = rowData.idEstatusActual;
        let severity: "success" | "info" | "warning" | "danger" | null = "info";
        let label = "Asignada";

        if (statusId === 7) { severity = "info"; label = "En Proceso"; }
        else if (statusId === 8) { severity = "warning"; label = "En Revisión"; }
        else if (statusId === 9) { severity = "success"; label = "Aprobado"; }
        else if (statusId === 10) { severity = "danger"; label = "Rechazado"; }

        return <Tag value={label} severity={severity} />;
    };

    const actionBodyTemplate = (rowData: any) => {
        return (
            <Link href={`/designerdetail?id=${rowData.idOrden}`} passHref legacyBehavior>
                <a className="p-button p-component p-button-text p-button-rounded p-button-info p-button-icon-only" title="Trabajar orden">
                    <i className="pi pi-pencil" style={{ fontSize: '1.2rem' }}></i>
                </a>
            </Link>
        );
    };

    return (
        <div className="grid">
            <Toast ref={toast} />
            <div className="col-12">
                <Card className="mb-4 shadow-2">
                    <div className="flex align-items-center justify-content-between">
                        <div>
                            <h1 className="m-0 text-4xl font-bold text-800">Hola, {userName}!</h1>
                            <p className="mt-2 text-600 text-lg">
                                Tienes <span className="font-bold text-primary">{totalRecords}</span> órdenes pendientes o en proceso.
                            </p>
                        </div>
                        <div className="hidden md:flex align-items-center justify-content-center bg-blue-50 border-round p-3">
                            <i className="pi pi-palette text-blue-500 text-5xl" />
                        </div>
                    </div>
                </Card>

                <div className="card shadow-2">
                    <DataTable
                        value={orders}
                        lazy
                        paginator
                        first={lazyParams.first}
                        rows={lazyParams.rows}
                        totalRecords={totalRecords}
                        onPage={onPage}
                        rowsPerPageOptions={[5, 10, 20]}
                        loading={loading}
                        responsiveLayout="scroll"
                        emptyMessage="¡Todo limpio! No tienes órdenes pendientes por ahora."
                        className="p-datatable-sm"
                    >
                        <Column field="idOrden" header="Folio" style={{ width: '10%' }} className="font-bold" />
                        <Column field="fechaCreacion" header="Fecha Asignación" body={(d) => new Date(d.fechaCreacion).toLocaleDateString()} style={{ width: '15%' }} />
                        <Column header="Cliente" body={clientBodyTemplate} style={{ width: '25%' }} />
                        <Column header="Estatus" body={statusBodyTemplate} style={{ width: '15%' }} />
                        <Column field="montoTotal" header="Valor Orden" body={(data) => formatCurrency(data.montoTotal)} style={{ width: '15%' }} />
                        <Column header="Acción" body={actionBodyTemplate} style={{ width: '10%', textAlign: 'center' }} />
                    </DataTable>
                </div>
            </div>
        </div>
    );
};

export default DesignerListPage;