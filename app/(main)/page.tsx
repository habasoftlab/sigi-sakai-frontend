/* eslint-disable @next/next/no-img-element */
'use client';
import { Button } from 'primereact/button';
import { Chart } from 'primereact/chart';
import { Column } from 'primereact/column';
import { DataTable } from 'primereact/datatable';
import React, { useContext, useEffect, useState } from 'react';
import { LayoutContext } from '../../layout/context/layoutcontext';
import { ChartData, ChartOptions } from 'chart.js';
import Link from 'next/link';

const lineDataIng: ChartData = {
    labels: ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio'],
    datasets: [
        {
            label: 'Cotizaciones',
            data: [28, 48, 40, 19, 86, 27, 90],
            fill: false,
            backgroundColor: '#0032bbff',
            borderColor: '#0032bbff',
            tension: 0.4
        }
    ]
};

const lineDataEgr: ChartData = {
    labels: ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio'],
    datasets: [
        {
            label: 'Ingresos',
            data: [28, 48, 40, 19, 86, 27, 90],
            fill: false,
            backgroundColor: '#00bb1fff',
            borderColor: '#00bb1fff',
            tension: 0.4
        },
        {
            label: 'Egresos',
            data: [65, 59, 80, 81, 56, 55, 40],
            fill: false,
            backgroundColor: '#ad0202ff',
            borderColor: '#ad0202ff',
            tension: 0.4
        }
    ]
};

const products = [
    {
        id: 'ORD-001',
        designer: 'María López',
        price: 2500,
        client: 'Carlos Mendoza',
    },
    {
        id: 'ORD-002',
        designer: 'Jorge Pérez',
        price: 3800,
        client: 'Ana García',
    },
    {
        id: 'ORD-003',
        designer: 'Lucía Hernández',
        price: 4200,
        client: 'Empresa Creativa SA',
    },
    {
        id: 'ORD-004',
        designer: 'Ismael Torres',
        price: 3100,
        client: 'Laura Ortiz',
    },
    {
        id: 'ORD-005',
        designer: 'Fernanda Ruiz',
        price: 2900,
        client: 'Estudio Blanco',
    },
];

const Dashboard = () => {
    const [lineOptions, setLineOptions] = useState<ChartOptions>({});
    const { layoutConfig } = useContext(LayoutContext);

    const applyLightTheme = () => {
        const lineOptions: ChartOptions = {
            plugins: {
                legend: {
                    labels: {
                        color: '#495057'
                    }
                }
            },
            scales: {
                x: {
                    ticks: {
                        color: '#495057'
                    },
                    grid: {
                        color: '#ebedef'
                    }
                },
                y: {
                    ticks: {
                        color: '#495057'
                    },
                    grid: {
                        color: '#ebedef'
                    }
                }
            }
        };

        setLineOptions(lineOptions);
    };

    const applyDarkTheme = () => {
        const lineOptions = {
            plugins: {
                legend: {
                    labels: {
                        color: '#ebedef'
                    }
                }
            },
            scales: {
                x: {
                    ticks: {
                        color: '#ebedef'
                    },
                    grid: {
                        color: 'rgba(160, 167, 181, .3)'
                    }
                },
                y: {
                    ticks: {
                        color: '#ebedef'
                    },
                    grid: {
                        color: 'rgba(160, 167, 181, .3)'
                    }
                }
            }
        };

        setLineOptions(lineOptions);
    };

    useEffect(() => {
        if (layoutConfig.colorScheme === 'light') {
            applyLightTheme();
        } else {
            applyDarkTheme();
        }
    }, [layoutConfig.colorScheme]);

    const formatCurrency = (value: number) => {
        return value?.toLocaleString('en-US', {
            style: 'currency',
            currency: 'USD'
        });
    };

    return (
        <div className="grid">

            <div className="col-24 lg:col-12 xl:col-6">
                <div className="card mb-0">
                    <div className="flex justify-content-between mb-3">
                        <div>
                            <span className="block text-500 font-medium mb-3">Cotizaciones</span>
                            <div className="text-900 font-medium text-xl">28441</div>
                        </div>
                        <div className="flex align-items-center justify-content-center bg-cyan-100 border-round" style={{ width: '2.5rem', height: '2.5rem' }}>
                            <i className="pi pi-file text-cyan-500 text-xl" />
                        </div>
                    </div>
                    <span className="text-green-500 font-medium">520 </span>
                    <span className="text-500">nuevas cotizaciones</span>
                </div>
            </div>

            <div className="col-24 lg:col-12 xl:col-6">
                <div className="card mb-0">
                    <div className="flex justify-content-between mb-3">
                        <div>
                            <span className="block text-500 font-medium mb-3">Ordenes</span>
                            <div className="text-900 font-medium text-xl">152</div>
                        </div>
                        <div className="flex align-items-center justify-content-center bg-blue-100 border-round" style={{ width: '2.5rem', height: '2.5rem' }}>
                            <i className="pi pi-shopping-cart text-blue-500 text-xl" />
                        </div>
                    </div>
                    <span className="text-green-500 font-medium">24+ nuevos </span>
                    <span className="text-500">desde la ultima visita</span>
                </div>
            </div>

            <div className="col-12 xl:col-6">
                <div className="card">
                    <h5>Cotizaciones mensuales</h5>
                    <Chart type="bar" data={lineDataIng} options={lineOptions} />
                </div>
            </div>

            <div className="col-12 xl:col-6">
                <div className="card">
                    <h5>Costos operativos</h5>
                    <Chart type="line" data={lineDataEgr} options={lineOptions} />
                </div>
            </div>

            <div className="col-36 lg:col-8 xl:col-12 flex justify-content-center">
                <div className="card mb-0 bg-red-600 text-center text-white rounded-2xl shadow-lg inline-flex items-center justify-center w-auto px-4 py-2">
                    <i className="pi pi-exclamation-triangle text-white text-2xl mr-2" />
                    <span className="text-lg font-semibold">3 Órdenes requieren atención</span>
                </div>
            </div>

            <div className="col-10 lg:col-6 xl:col-4">
                <div className="card mb-0 bg-blue-400 text-center text-white py-4 rounded-2xl shadow-lg">
                    <div>
                        <i className="pi pi-user text-white-500 text-4xl" />
                        <div className="font-bold text-4xl mb-2">50 Tazas</div>
                        <span className="text-lg opacity-90">Estudio Blanco</span>
                    </div>
                </div>
            </div>

            <div className="col-10 lg:col-6 xl:col-4">
                <div className="card mb-0 bg-green-400 text-center text-white py-4 rounded-2xl shadow-lg">
                    <div>
                        <i className="pi pi-user text-white-500 text-4xl" />
                        <div className="font-bold text-4xl mb-2">8 Lonas</div>
                        <span className="text-lg opacity-90">Carlos Mendoza</span>
                    </div>
                </div>
            </div>

            <div className="col-10 lg:col-6 xl:col-4">
                <div className="card mb-0 bg-purple-400 text-center text-white py-4 rounded-2xl shadow-lg">
                    <div>
                        <i className="pi pi-user text-white-500 text-4xl" />
                        <div className="font-bold text-4xl mb-2">150 Folletos</div>
                        <span className="text-lg opacity-90">Empresa Creativa</span>
                    </div>
                </div>
            </div>

            <div className="col-24 xl:col-12">
                <div className="card">
                    <h5>Ordenes</h5>
                    <DataTable value={products} rows={5} paginator responsiveLayout="scroll">
                        <Column field="id" header="Clave" sortable style={{ width: '30%' }} />
                        <Column field="designer" header="Diseñador" sortable style={{ width: '30%' }} />
                        <Column field="price" header="Precio" sortable style={{ width: '20%' }} body={(data) => formatCurrency(data.price)} />
                        <Column field="client" header="Cliente" sortable style={{ width: '45%' }} />
                        <Column
                            header="Detalle"
                            style={{ width: '50%' }}
                            body={(rowData) => ( // <-- 2. OBTENER EL rowData DE LA FILA
                                <>
                                    {/* 3. ENVOLVER EL BOTÓN EN UN LINK */}
                                    <Link href={`/timeline?id=${rowData.id}`} passHref legacyBehavior>
                                        {/* 4. Usar una <a> con clases de PrimeReact */}
                                        <a className="p-button p-component p-button-text p-button-icon-only">
                                            <i className="pi pi-search"></i>
                                        </a>
                                    </Link>
                                </>
                            )}
                        />
                    </DataTable>
                </div>
            </div>
        </div>
    );
};

export default Dashboard;