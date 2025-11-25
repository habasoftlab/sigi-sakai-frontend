/* eslint-disable @next/next/no-img-element */
'use client';
import React, { useState, useEffect } from 'react';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Button } from 'primereact/button';
import { Card } from 'primereact/card';
import Link from 'next/link';
// Importar los datos desde el archivo centralizado
import { dummyOrders } from '@/app/api/mockData';

type WorkshopStatus = 'pending' | 'confirmed' | 'delayed';

interface ExtendedOrder {
    id: string;
    total: number;
    cliente: string;
    estatus: string;
    imageUrl?: string | null;
    workshopStatus: WorkshopStatus;
}

const WorkshopPage = () => {
    const [orders, setOrders] = useState<ExtendedOrder[]>([]);

    useEffect(() => {
        const enrichedOrders = dummyOrders.map((order, index) => {
            let status: WorkshopStatus = 'pending';
            if (index % 3 === 0) status = 'confirmed';
            else if (index % 3 === 1) status = 'delayed';

            return { ...order, workshopStatus: status };
        });
        setOrders(enrichedOrders);
    }, []);

    const formatCurrency = (value: number) => {
        return value.toLocaleString('es-MX', { style: 'currency', currency: 'MXN' });
    };

    // --- LÓGICA DE ESTADOS DE INSUMOS (Solo Iconos) ---
    const suppliesBodyTemplate = (rowData: ExtendedOrder) => {
        let icon = '';
        let colorClass = '';
        let tooltip = '';

        switch (rowData.workshopStatus) {
            case 'confirmed':
                icon = 'pi pi-check-square'; // Cajita verde marcada
                colorClass = 'text-green-500';
                tooltip = 'Insumos listos';
                break;
            case 'delayed':
                icon = 'pi pi-calendar-times'; // Calendario rojo
                colorClass = 'text-red-500';
                tooltip = 'Solicitud de insumos demorada';
                break;
            case 'pending':
            default:
                icon = 'pi pi-box'; // Cajita abierta azul
                colorClass = 'text-blue-500';
                tooltip = 'En espera de revisión';
                break;
        }

        return (
            <div className="flex align-items-center justify-content-center">
                <Link href={`/workshopsupplies?id=${rowData.id}`} passHref legacyBehavior>
                    <a className="p-button p-component p-button-text p-button-rounded p-button-plain no-underline hover:surface-100 border-circle w-3rem h-3rem flex align-items-center justify-content-center transition-colors transition-duration-200" title={tooltip}>
                        <i className={`${icon} ${colorClass}`} style={{ fontSize: '1.5rem' }}></i>
                    </a>
                </Link>
            </div>
        );
    };

    // --- LÓGICA DE VER DISEÑO (Lupa Clara/Oscura) ---
    const printDesignBodyTemplate = (rowData: ExtendedOrder) => {
        const designReady = !!rowData.imageUrl;
        const suppliesReady = rowData.workshopStatus === 'confirmed';

        // Regla: Solo habilitado si hay diseño Y los insumos ya fueron marcados como listos
        const canPrint = designReady && suppliesReady;

        let tooltip = "Listo para imprimir";
        // Lupa Oscura (Azul fuerte) vs Lupa Clara (Gris transparente)
        let iconClass = canPrint ? "text-yellow-600" : "text-500";

        if (!canPrint) {
            if (!designReady && !suppliesReady) tooltip = "Falta diseño e insumos";
            else if (!designReady) tooltip = "Diseño no listo";
            else if (!suppliesReady) tooltip = "Faltan insumos";
        }

        return (
            <div className="flex justify-content-center">
                <Button
                    icon={`pi pi-search ${iconClass}`}
                    className="p-button-rounded p-button-text hover:surface-100 border-circle w-3rem h-3rem"
                    tooltip={tooltip}
                    tooltipOptions={{ position: 'top' }}
                    disabled={!canPrint}
                    onClick={() => canPrint && window.open(rowData.imageUrl!, '_blank')}
                    style={{ fontSize: '1.5rem' }} // Icono grande
                />
            </div>
        );
    };

    return (
        <div className="grid">
            <div className="col-12">
                {/* Card SIN color de fondo forzado (bg-orange-50 eliminado) */}
                <Card className="mb-4 border-round-xl shadow-1">
                    <div className="flex align-items-center justify-content-between mb-3">
                        <div>
                            <h1 className="m-0 text-3xl font-bold text-900">Bienvenido! Jefe de Taller</h1>
                            <p className="mt-2 text-600 text-lg">
                                Recuerda informar a la contadora la falta de insumos a la brevedad.
                            </p>
                        </div>
                        {/* Mantenemos el icono con fondo sutil, suele verse bien en dark mode, o se puede quitar el bg */}
                        <div className="hidden md:flex align-items-center justify-content-center surface-100 border-round" style={{ width: '4rem', height: '4rem' }}>
                            <i className="pi pi-cog text-orange-500 text-3xl" />
                        </div>
                    </div>

                    {/* Leyenda de Estados (Tags reimplementados) */}
                    <div className="flex flex-wrap gap-3 mt-3">
                        <span className="px-3 py-1 border-round surface-100 bg-blue-100 text-blue-700 font-bold text-sm flex align-items-center">
                            <i className="pi pi-box mr-2 text-blue-500"></i>En espera de revisión
                        </span>
                        <span className="px-3 py-1 border-round surface-100 bg-green-100 text-green-700 font-bold text-sm flex align-items-center">
                            <i className="pi pi-check-square mr-2 text-green-500"></i>Insumos confirmados
                        </span>
                        <span className="px-3 py-1 border-round surface-100 bg-red-100 text-red-700 font-bold text-sm flex align-items-center">
                            <i className="pi pi-calendar-times mr-2 text-red-500"></i>Insumos demorados
                        </span>
                        <span className="px-3 py-1 border-round surface-100 bg-yellow-100 text-yellow-700 font-bold text-sm flex align-items-center">
                            <i className="pi pi-search mr-2 text-yellow-600"></i>Diseño listo e insumos confirmados
                        </span>
                        <span className="px-3 py-1 border-round surface-100 text-color-secondary font-bold text-sm flex align-items-center">
                            <i className="pi pi-search mr-2 text-400"></i>En espera de diseño
                        </span>
                    </div>
                </Card>

                <div className="card">
                    <DataTable
                        value={orders}
                        paginator
                        rows={10}
                        responsiveLayout="scroll"
                        emptyMessage="No hay órdenes pendientes en taller."
                        tableStyle={{ minWidth: '60rem' }}
                    >
                        <Column field="id" header="Clave" sortable style={{ width: '30%' }} className="font-bold" />
                        <Column field="total" header="Precio" body={(data) => formatCurrency(data.total)} sortable style={{ width: '20%' }} />
                        <Column field="cliente" header="Cliente" sortable style={{ width: '30%' }} />

                        {/* Columna de Insumos (Solo Iconos) */}
                        <Column
                            header="Revisión de insumos"
                            body={suppliesBodyTemplate}
                            style={{ width: '10%', textAlign: 'center' }}
                        />

                        {/* Columna de Diseño (Solo Lupa) */}
                        <Column
                            header="Ver diseño de impresión"
                            body={printDesignBodyTemplate}
                            style={{ width: '10%', textAlign: 'center' }}
                        />
                    </DataTable>
                </div>
            </div>
        </div>
    );
};

export default WorkshopPage;