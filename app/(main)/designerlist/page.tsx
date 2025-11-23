/* eslint-disable @next/next/no-img-element */
'use client';
import React, { useState } from 'react';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Button } from 'primereact/button';
import { Card } from 'primereact/card';
import Link from 'next/link';
import { dummyOrders } from '@/app/api/mockData';

const DesignerPage = () => {
    const [orders, setOrders] = useState(dummyOrders);

    const formatCurrency = (value: number) => {
        return value.toLocaleString('es-MX', { style: 'currency', currency: 'MXN' });
    };

    const actionBodyTemplate = (rowData: any) => {
        return (
            <Link href={`/designerdetail?id=${rowData.id}`} passHref legacyBehavior>
                <a className="p-button p-component p-button-text p-button-rounded p-button-info p-button-icon-only">
                    <i className="pi pi-pencil" style={{ fontSize: '1.6rem' }}></i>
                </a>
            </Link>
        );
    };

    return (
        <div className="grid">
            <div className="col-12">
                <Card className="mb-4">
                    <div className="flex align-items-center justify-content-between mb-3">
                        <div>
                            <h1 className="m-0 text-6xl font-bold text-800">Bienvenido! Usuario</h1>
                            <p className="mt-2 text-600 text-lg">
                                Recuerda enviar los diseños a la brevedad una vez que los hayas terminado.
                            </p>
                        </div>
                        <div className="hidden md:flex align-items-center justify-content-center bg-blue-100 border-round" style={{ width: '4rem', height: '4rem' }}>
                            <i className="pi pi-palette text-blue-500 text-3xl" />
                        </div>
                    </div>
                </Card>

                <div className="card">
                    <DataTable
                        value={orders}
                        paginator
                        rows={10}
                        responsiveLayout="scroll"
                        emptyMessage="No tienes órdenes asignadas pendientes."
                    >
                        <Column field="id" header="Clave" sortable style={{ width: '30%' }} className="font-bold" />
                        <Column field="total" header="Precio" body={(data) => formatCurrency(data.total)} sortable style={{ width: '30%' }} />
                        <Column field="cliente" header="Cliente" sortable style={{ width: '15%' }} />
                        <Column header="" body={actionBodyTemplate} style={{ width: '15%', textAlign: 'center' }} />
                    </DataTable>
                </div>
            </div>
        </div>
    );
};

export default DesignerPage;