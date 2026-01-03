/* eslint-disable @next/next/no-img-element */
'use client';
import React, { useState, useEffect, useRef } from 'react';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Card } from 'primereact/card';
import { Tag } from 'primereact/tag';
import { Toast } from 'primereact/toast';
import { useRouter } from 'next/navigation';
import { Button } from 'primereact/button';

import { OrderService } from '@/app/service/orderService';
import { ClientService } from '@/app/service/clientService';

const DesignerListPage = () => {
    const [orders, setOrders] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    
    const [clientMap, setClientMap] = useState<Record<number, string>>({});
    const [currentUserId, setCurrentUserId] = useState<number | null>(null);
    const [userName, setUserName] = useState('');
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
            loadOrders();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [currentUserId]);

    const loadOrders = async () => {
        setLoading(true);
        try {
            if (!currentUserId) return
            const response = await OrderService.getOrdenesPorDisenador(currentUserId, 0, 1000);
            
            let listaObtenida = response.content || response || [];

            listaObtenida.sort((a: any, b: any) => {
                const aEsRechazado = a.idEstatusActual === 10;
                const bEsRechazado = b.idEstatusActual === 10;

                // 1. Prioridad: Estatus 10 (Rechazado) va primero
                if (aEsRechazado && !bEsRechazado) return -1;
                if (!aEsRechazado && bEsRechazado) return 1;

                // 2. Prioridad: Fecha más antigua primero (FIFO)
                const fechaA = new Date(a.fechaEntregaFormal || a.fechaCreacion).getTime();
                const fechaB = new Date(b.fechaEntregaFormal || b.fechaCreacion).getTime();
                return fechaA - fechaB;
            });

            setOrders(listaObtenida);
        } catch (error) {
            console.error(error);
            toast.current?.show({ severity: 'error', summary: 'Error', detail: 'No se pudieron cargar tus órdenes.' });
        } finally {
            setLoading(false);
        }
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
                                Tienes <span className="font-bold text-primary text-xl">{orders.length}</span> órdenes en tu bandeja.
                                <ul className="text-sm mt-1 m-0 pl-3">
                                    <li>Prioridad: Correcciones (Rechazadas)</li>
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
                        paginator
                        rows={10}
                        rowsPerPageOptions={[5, 10, 20]}
                        loading={loading}
                        responsiveLayout="scroll"
                        emptyMessage="¡Todo limpio! No tienes órdenes pendientes por ahora."
                        className="p-datatable-sm"
                        rowClassName={(data) => data.idEstatusActual === 10 ? 'bg-red-50' : ''}
                    >
                        <Column field="idOrden" header="Folio" sortable style={{ width: '8%' }} className="font-bold" />
                        <Column
                            field="fechaEntregaFormal"
                            header="Entrega"
                            sortable
                            body={(d) => {
                                const fecha = d.fechaEntregaFormal || d.fechaCreacion;
                                return <span className="font-semibold text-700">{new Date(fecha).toLocaleDateString()}</span>;
                            }}
                            style={{ width: '12%' }}
                        />
                        <Column header="Cliente" body={clientBodyTemplate} style={{ width: '25%' }} />
                        <Column header="Estatus" body={statusBodyTemplate} sortable field="idEstatusActual" style={{ width: '20%' }} />
                        <Column field="montoTotal" header="Valor" body={(data) => formatCurrency(data.montoTotal)} sortable style={{ width: '10%' }} />
                        <Column header="Acción" body={actionBodyTemplate} style={{ width: '10%', textAlign: 'center' }} />
                    </DataTable>
                </div>
            </div>
        </div>
    );
};

export default DesignerListPage;