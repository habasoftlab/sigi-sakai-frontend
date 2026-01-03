/* eslint-disable @next/next/no-img-element */
'use client';
import React, { useState, useEffect, useRef } from 'react';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Button } from 'primereact/button';
import { Card } from 'primereact/card';
import { Toast } from 'primereact/toast';
import Link from 'next/link';

// Servicios
import { OrderService } from '@/app/service/orderService';
import { ClientService } from '@/app/service/clientService';

type WorkshopStatus = 'pending' | 'confirmed' | 'delayed';

interface ExtendedOrder {
    idOrden: number;
    montoTotal: number;
    clienteNombre: string;
    idCliente: number;
    idEstatusActual: number;
    rutaArchivo?: string | null;
    insumosVerificados: boolean;
    fechaEntregaFormal?: string;
    workshopStatus: WorkshopStatus;
    canPrint: boolean;
}

const WorkshopListPage = () => {
    const [orders, setOrders] = useState<ExtendedOrder[]>([]);
    const [loading, setLoading] = useState(true);
    const toast = useRef<Toast>(null);

    useEffect(() => {
        loadOrders();
    }, []);

    const loadOrders = async () => {
        setLoading(true);
        try {
            const [ordersResponse, clientsData] = await Promise.all([
                OrderService.getOrdenesActivas(0, 100),
                ClientService.getAll()
            ]);
            const rawOrders = ordersResponse.content || ordersResponse || [];

            const activeOrdersOnly = rawOrders.filter((order: any) => order.idEstatusActual !== 12);
            const clientMap = new Map<number, string>();
            clientsData.forEach((client) => {
                if (client.id) clientMap.set(client.id, client.nombre);
            });
            const processedOrders = activeOrdersOnly.map((order: any) => {
                const resolvedClientName = clientMap.get(order.idCliente) || `Cliente #${order.idCliente}`;

                let status: WorkshopStatus = 'pending';

                // --- LÓGICA DE ESTATUS ---
                // 1. Si ya tiene insumos verificados (TRUE), siempre es VERDE.
                if (order.insumosVerificados) {
                    status = 'confirmed';
                }
                // 2. Si es una orden nueva (Estatus 2) y no tiene insumos, es AZUL (Pendiente de revisar).
                else if (order.idEstatusActual === 2) {
                    status = 'pending';
                }
                // 3. Si ya avanzó (Estatus 4, 7, 8, 9) y NO tiene insumos, es ROJO (Retrasado/Faltante).
                else {
                    status = 'delayed';
                }

                const hasFile = order.rutaArchivo && order.rutaArchivo !== 'Pendiente';
                const isStatusReady = order.idEstatusActual === 9 || order.idEstatusActual === 5;
                const hasSuppliesVerified = order.insumosVerificados === true;
                const canPrint = hasFile && hasSuppliesVerified && isStatusReady;

                return {
                    ...order,
                    clienteNombre: resolvedClientName,
                    workshopStatus: status,
                    canPrint: canPrint
                };
            });

            setOrders(processedOrders);
        } catch (error) {
            console.error("Error cargando datos de taller", error);
            toast.current?.show({ severity: 'error', summary: 'Error', detail: 'No se pudo cargar la lista de trabajo.' });
        } finally {
            setLoading(false);
        }
    };

    const formatCurrency = (value: number) => {
        return value.toLocaleString('es-MX', { style: 'currency', currency: 'MXN' });
    };

    const suppliesBodyTemplate = (rowData: ExtendedOrder) => {
        let icon = '';
        let colorClass = '';
        let tooltip = '';

        switch (rowData.workshopStatus) {
            case 'confirmed':
                icon = 'pi pi-check-circle';
                colorClass = 'text-green-500 font-bold';
                tooltip = 'Insumos verificados y listos';
                break;
            case 'delayed':
                icon = 'pi pi-exclamation-triangle';
                colorClass = 'text-red-500';
                tooltip = 'Faltan insumos en espera de compras';
                break;
            case 'pending':
            default:
                icon = 'pi pi-box';
                colorClass = 'text-blue-500';
                tooltip = 'Pendiente de revisión (Clic para verificar)';
                break;
        }

        if (rowData.workshopStatus === 'confirmed') {
            return (
                <div className="flex align-items-center justify-content-center">
                    <div
                        className="p-2 border-circle surface-100 flex align-items-center justify-content-center"
                        style={{ width: '3rem', height: '3rem', cursor: 'default' }}
                        title={tooltip}
                    >
                        <i className={`${icon} ${colorClass}`} style={{ fontSize: '1.5rem' }}></i>
                    </div>
                </div>
            );
        }

        return (
            <div className="flex align-items-center justify-content-center">
                <Link href={`/workshopsupplies?id=${rowData.idOrden}`} passHref legacyBehavior>
                    <a className="p-button p-component p-button-text p-button-rounded p-button-plain no-underline hover:surface-200 border-circle w-3rem h-3rem flex align-items-center justify-content-center transition-colors transition-duration-200" title={tooltip}>
                        <i className={`${icon} ${colorClass}`} style={{ fontSize: '1.5rem' }}></i>
                    </a>
                </Link>
            </div>
        );
    };

    const printDesignBodyTemplate = (rowData: ExtendedOrder) => {
        const canPrint = rowData.canPrint;
        let tooltip = "Enviar a impresión";
        let iconClass = canPrint ? "text-yellow-600" : "text-300";

        if (!canPrint) {
            if (!rowData.rutaArchivo || rowData.rutaArchivo === 'Pendiente') tooltip = "Falta archivo de diseño";
            else if (!rowData.insumosVerificados) tooltip = "Faltan insumos";
            else if (rowData.idEstatusActual !== 9 && rowData.idEstatusActual !== 5) tooltip = "Diseño no aprobado por cliente aún";
        }

        return (
            <div className="flex justify-content-center">
                {canPrint ? (
                    <Link href={`/workshopprint?id=${rowData.idOrden}`} passHref legacyBehavior>
                        <a className="p-button p-component p-button-rounded p-button-text hover:surface-100 border-circle w-3rem h-3rem flex align-items-center justify-content-center transition-colors transition-duration-200" title={tooltip}>
                            <i className={`pi pi-print ${iconClass}`} style={{ fontSize: '1.5rem' }}></i>
                        </a>
                    </Link>
                ) : (
                    <Button
                        icon={`pi pi-print ${iconClass}`}
                        className="p-button-rounded p-button-text hover:surface-100 border-circle w-3rem h-3rem"
                        tooltip={tooltip}
                        tooltipOptions={{ position: 'top' }}
                        disabled={true}
                        style={{ fontSize: '1.5rem' }}
                    />
                )}
            </div>
        );
    };

    return (
        <div className="grid">
            <Toast ref={toast} />
            <div className="col-12">
                <Card className="mb-4 border-round-xl shadow-1">
                    <div className="flex align-items-center justify-content-between mb-3">
                        <div>
                            <h1 className="m-0 text-3xl font-bold text-900">Bienvenido, Jefe de Taller</h1>
                            <p className="mt-2 text-600 text-lg">
                                Gestiona la producción. Revisa insumos antes de iniciar impresión.
                            </p>
                        </div>
                        <div className="hidden md:flex align-items-center justify-content-center surface-100 border-round" style={{ width: '4rem', height: '4rem' }}>
                            <i className="pi pi-cog text-orange-500 text-3xl" />
                        </div>
                    </div>

                    <div className="flex flex-wrap gap-3 mt-3">
                        <span className="px-3 py-1 border-round surface-100 bg-blue-100 text-blue-700 font-bold text-sm flex align-items-center">
                            <i className="pi pi-box mr-2 text-blue-500"></i>Por revisar insumos
                        </span>
                        <span className="px-3 py-1 border-round surface-100 bg-green-100 text-green-700 font-bold text-sm flex align-items-center">
                            <i className="pi pi-check-circle mr-2 text-green-500"></i>Insumos listos
                        </span>
                        <span className="px-3 py-1 border-round surface-100 bg-red-100 text-red-700 font-bold text-sm flex align-items-center">
                            <i className="pi pi-calendar-times mr-2 text-red-500"></i>En espera de insumos
                        </span>
                        <span className="px-3 py-1 border-round surface-100 bg-yellow-100 text-yellow-700 font-bold text-sm flex align-items-center">
                            <i className="pi pi-print mr-2 text-yellow-600"></i>Listo para impresion
                        </span>
                    </div>
                </Card>

                <div className="card shadow-2">
                    <DataTable
                        value={orders}
                        paginator
                        rows={10}
                        loading={loading}
                        responsiveLayout="scroll"
                        emptyMessage="No hay órdenes pendientes en taller."
                        className="p-datatable-sm"
                    >
                        <Column field="idOrden" header="Folio" sortable style={{ width: '10%' }} className="font-bold" />
                        <Column
                            field="fechaEntregaFormal"
                            header="Entrega"
                            body={(d) => d.fechaEntregaFormal ? new Date(d.fechaEntregaFormal).toLocaleDateString() : 'Pendiente'}
                            sortable
                            style={{ width: '15%' }}
                        />
                        <Column field="clienteNombre" header="Cliente" sortable style={{ width: '35%' }} />
                        <Column field="montoTotal" header="Valor" body={(data) => formatCurrency(data.montoTotal)} sortable style={{ width: '15%' }} />

                        <Column
                            header="Insumos"
                            body={suppliesBodyTemplate}
                            style={{ width: '12%', textAlign: 'center' }}
                        />

                        <Column
                            header="Impresión"
                            body={printDesignBodyTemplate}
                            style={{ width: '13%', textAlign: 'center' }}
                        />
                    </DataTable>
                </div>
            </div>
        </div>
    );
};

export default WorkshopListPage;