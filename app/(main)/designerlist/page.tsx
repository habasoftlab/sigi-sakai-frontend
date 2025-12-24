/* eslint-disable @next/next/no-img-element */
'use client';
import React, { useState, useEffect, useRef } from 'react';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Card } from 'primereact/card';
import { Tag } from 'primereact/tag';
import { Toast } from 'primereact/toast';
import { useRouter } from 'next/navigation';

import { OrderService } from '@/app/service/orderService';
import { ClientService } from '@/app/service/clientService';
import { Button } from 'primereact/button';

const DesignerListPage = () => {
    const [orders, setOrders] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [totalRecords, setTotalRecords] = useState(0);
    const [lazyParams, setLazyParams] = useState({ first: 0, rows: 10, page: 0 });
    const [clientMap, setClientMap] = useState<Record<number, string>>({});
    const [currentUserId, setCurrentUserId] = useState<number | null>(null);
    const [userName, setUserName] = useState('');

    // Mapas de estatus para visualización
    const [statusMap, setStatusMap] = useState<Record<number, string>>({});

    const toast = useRef<Toast>(null);
    const router = useRouter();

    useEffect(() => {
        const initData = async () => {
            const userStr = localStorage.getItem('user');
            if (!userStr) {
                router.push('/auth/login');
                return;
            }
            const user = JSON.parse(userStr);
            setCurrentUserId(user.id || user.idUsuario);
            setUserName(user.nombre || 'Diseñador');
            try {
                const [clients, statuses] = await Promise.all([
                    ClientService.getAll(),
                    OrderService.getEstatusOperaciones()
                ]);
                const cMap: Record<number, string> = {};
                clients.forEach((c: any) => { if (c.id) cMap[c.id] = c.nombre; });
                setClientMap(cMap);
                const sMap: Record<number, string> = {};
                statuses.forEach((s: any) => { sMap[s.idEstatus] = s.descripcion; });
                setStatusMap(sMap);
            } catch (e) {
                console.error("Error cargando catálogos", e);
            }
        };

        initData();
    }, [router]);

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
            let listaObtenida = response.content || response || [];
            listaObtenida.sort((a: any, b: any) => {
                const aEsRechazado = a.idEstatusActual === 10;
                const bEsRechazado = b.idEstatusActual === 10;
                if (aEsRechazado && !bEsRechazado) return -1;
                if (!aEsRechazado && bEsRechazado) return 1;
                const fechaA = new Date(a.fechaEntregaFormal || a.fechaCreacion).getTime();
                const fechaB = new Date(b.fechaEntregaFormal || b.fechaCreacion).getTime();
                return fechaA - fechaB;
            });
            setOrders(listaObtenida);
            const total = (typeof response.totalElements === 'number')
                ? response.totalElements
                : listaObtenida.length;
            setTotalRecords(total);
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

    const clientBodyTemplate = (rowData: any) => {
        return rowData.clienteNombre || clientMap[rowData.idCliente] || `Cliente #${rowData.idCliente}`;
    };

    const statusBodyTemplate = (rowData: any) => {
        const estatusId = rowData.idEstatusActual;
        let severity: "danger" | "success" | "info" | "warning" | null = 'info';
        let icon = 'pi pi-cog';
        if (estatusId === 10) {
            severity = 'danger';
            icon = 'pi pi-exclamation-triangle';
        } else if (estatusId === 7) {
            severity = 'warning';
            icon = 'pi pi-palette';
        } else if (estatusId === 3 || estatusId === 4) {
            severity = 'info';
            icon = 'pi pi-clock';
        }

        return (
            <Tag
                value={statusMap[estatusId] || `Estatus ${estatusId}`}
                severity={severity}
                icon={icon}
                className="text-xs"
            />
        );
    };

    const actionBodyTemplate = (rowData: any) => {
        const isRechazado = rowData.idEstatusActual === 10;
        return (
            <Button
                icon={isRechazado ? "pi pi-replay" : "pi pi-pencil"}
                className="p-button-rounded p-button-icon-only"
                severity={isRechazado ? "danger" : "info"}
                rounded
                text
                tooltip={isRechazado ? "Corregir diseño" : "Trabajar orden"}
                tooltipOptions={{ position: 'top' }}
                onClick={() => router.push(`/designerdetail?id=${rowData.idOrden}`)}
            />
        );
    };

    return (
        <div className="grid">
            <Toast ref={toast} />
            <div className="col-12">
                <Card className="mb-4 shadow-2">
                    <div className="flex align-items-center justify-content-between">
                        <div>
                            <h1 className="m-0 text-3xl font-bold text-800">Hola, {userName}!</h1>
                            <div className="text-600">
                                <div className="text-600">Recuerda enviar tus diseños listos a la brevedad</div>
                                Tienes <span className="font-bold text-primary text-xl">{totalRecords}</span> órdenes en tu bandeja.
                                <ul className="text-sm mt-1 m-0 pl-3">
                                    <li>🔴 Prioridad: Correcciones (Rechazadas)</li>
                                    <li>🟡 Secundaria: Fecha de entrega más próxima</li>
                                </ul>
                            </div>
                        </div>
                        <div className="hidden md:flex align-items-center justify-content-center bg-blue-50 border-round p-4">
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
                        rowClassName={(data) => data.idEstatusActual === 10 ? 'bg-red-50' : ''}
                    >
                        <Column field="idOrden" header="Folio" style={{ width: '8%' }} className="font-bold" />
                        <Column
                            field="fechaEntregaFormal"
                            header="Entrega"
                            body={(d) => {
                                const fecha = d.fechaEntregaFormal || d.fechaCreacion;
                                return <span className="font-semibold text-700">{new Date(fecha).toLocaleDateString()}</span>;
                            }}
                            style={{ width: '12%' }}
                        />
                        <Column header="Cliente" body={clientBodyTemplate} style={{ width: '25%' }} />
                        <Column header="Estatus" body={statusBodyTemplate} style={{ width: '20%' }} />
                        <Column field="montoTotal" header="Valor" body={(data) => formatCurrency(data.montoTotal)} style={{ width: '10%' }} />
                        <Column header="Acción" body={actionBodyTemplate} style={{ width: '10%', textAlign: 'center' }} />
                    </DataTable>
                </div>
            </div>
        </div>
    );
};

export default DesignerListPage;