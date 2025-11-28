/* eslint-disable @next/next/no-img-element */
'use client';
import { Button } from 'primereact/button';
import { Chart } from 'primereact/chart';
import { Column } from 'primereact/column';
import { DataTable } from 'primereact/datatable';
import React, { useContext, useEffect, useState, useRef } from 'react';
import { LayoutContext } from '../../layout/context/layoutcontext';
import { ChartData, ChartOptions } from 'chart.js';
import Link from 'next/link';
import { Dialog } from 'primereact/dialog';
import { Dropdown } from 'primereact/dropdown';
import { Toast } from 'primereact/toast';
import { dummyOrders } from '../api/mockData';
import { useRouter } from 'next/navigation'; // <-- 1. IMPORTAR useRouter


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

// --- CATÁLOGO DE RAZONES DE CANCELACIÓN ---
const cancellationReasons = [
    { label: 'Desinterés por parte del cliente', value: 'desinteres' },
    { label: 'Cliente desistió del servicio', value: 'desistio' },
    { label: 'Precio no competitivo', value: 'precio' },
    { label: 'Tiempo de entrega tardío', value: 'tiempo' },
    { label: 'Sin pagos del cliente', value: 'sin_pagos' }
];

const Dashboard = () => {
    const [lineOptions, setLineOptions] = useState<ChartOptions>({});
    const { layoutConfig } = useContext(LayoutContext);
    const toast = useRef<Toast>(null);

    // Estado de productos para permitir borrado
    const [products, setProducts] = useState(dummyOrders);

    // --- ESTADOS PARA LA CANCELACIÓN ---
    const [cancelDialogVisible, setCancelDialogVisible] = useState(false);
    const [orderToCancel, setOrderToCancel] = useState<any>(null);
    const [selectedReason, setSelectedReason] = useState<any>(null);

    const router = useRouter(); // <-- 2. INICIALIZAR ROUTER


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
        return value?.toLocaleString('es-MX', {
            style: 'currency',
            currency: 'MXN'
        });
    };

    const confirmCancelOrder = (order: any) => {
        setOrderToCancel(order);
        setSelectedReason(null);
        setCancelDialogVisible(true);
    };

    const hideCancelDialog = () => {
        setCancelDialogVisible(false);
        setOrderToCancel(null);
        setSelectedReason(null);
    };

    const submitCancellation = () => {
        if (selectedReason) {
            // 1. Eliminar orden de la lista visual
            const _products = products.filter(val => val.id !== orderToCancel.id);
            setProducts(_products);

            // 2. Buscar la etiqueta legible de la razón seleccionada
            const reasonLabel = cancellationReasons.find(r => r.value === selectedReason)?.label;

            toast.current?.show({
                severity: 'info',
                summary: 'Orden Cancelada',
                detail: `La orden ${orderToCancel.id} ha sido cancelada. Razón: ${reasonLabel}`,
                life: 3000
            });

            hideCancelDialog();
        } else {
            toast.current?.show({
                severity: 'warn',
                summary: 'Atención',
                detail: 'Debes seleccionar una razón para cancelar.',
                life: 3000
            });
        }
    };

    const cancelDialogFooter = (
        <>
            <Button label="No, regresar" icon="pi pi-times" text onClick={hideCancelDialog} />
            <Button label="Sí, cancelar orden" icon="pi pi-check" severity="danger" onClick={submitCancellation} autoFocus />
        </>
    );

    return (
        <div className="grid">
            <Toast ref={toast} />

            <div className="col-24 lg:col-12 xl:col-6">
                <div className="card mb-0">
                    <div className="flex justify-content-between mb-3">
                        <div>
                            <span className="block text-500 font-medium mb-3">Cotizaciones</span>
                            <div className="text-900 font-medium text-xl">28441</div>
                        </div>
                        {/* ENLACE A LISTA DE COTIZACIONES */}
                        <Link href="/listquote">
                            <div
                                className="flex align-items-center justify-content-center bg-cyan-100 border-round cursor-pointer hover:bg-cyan-200 transition-duration-200"
                                style={{ width: '2.5rem', height: '2.5rem' }}
                            >
                                <i className="pi pi-file text-cyan-500 text-xl" />
                            </div>
                        </Link>
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
                        {/* ENLACE A LISTA DE ÓRDENES */}
                        <Link href="/listorder">
                            <div
                                className="flex align-items-center justify-content-center bg-blue-100 border-round cursor-pointer hover:bg-blue-200 transition-duration-200"
                                style={{ width: '2.5rem', height: '2.5rem' }}
                            >
                                <i className="pi pi-shopping-cart text-blue-500 text-xl" />
                            </div>
                        </Link>
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
                <div
                    className="card cursor-pointer hover:surface-hover transition-colors transition-duration-200"
                    onClick={() => router.push('/finance')}
                >
                    <div className="flex justify-content-between align-items-center mb-3">
                        <h5 className="m-0">Costos operativos</h5>
                        <i className="pi pi-external-link text-gray-400"></i>
                    </div>
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
                        <Column field="total" header="Total" sortable style={{ width: '20%' }} body={(data) => formatCurrency(data.total)} />
                        <Column field="cliente" header="Cliente" sortable style={{ width: '45%' }} />
                        <Column field="estatus" header="Estatus" sortable style={{ width: '45%' }} />
                        <Column
                            header=""
                            style={{ width: '50%' }}
                            body={(rowData) => (
                                <div className="flex gap-2">
                                    <Link href={`/timeline?id=${rowData.id}`} passHref legacyBehavior>
                                        <a className="p-button p-component p-button-text p-button-icon-only p-button-rounded p-button-info">
                                            <i className="pi pi-search"></i>
                                        </a>
                                    </Link>

                                    <Button
                                        icon="pi pi-times"
                                        className="p-button-text p-button-rounded p-button-danger"
                                        onClick={() => confirmCancelOrder(rowData)}
                                    />
                                </div>
                            )}
                        />
                    </DataTable>
                </div>
            </div>

            {/* --- MODAL DE CONFIRMACIÓN DE CANCELACIÓN --- */}
            <Dialog
                visible={cancelDialogVisible}
                style={{ width: '450px' }}
                header="Confirmar Cancelación"
                modal
                footer={cancelDialogFooter}
                onHide={hideCancelDialog}
            >
                <div className="flex flex-column align-items-center justify-content-center">
                    <i className="pi pi-exclamation-triangle mr-3" style={{ fontSize: '2rem', color: 'var(--red-500)' }} />
                    {orderToCancel && (
                        <div className="mt-3 text-center">
                            <span className="font-bold block mb-3">¿Estás seguro de que deseas cancelar la orden {orderToCancel.id}?</span>
                            <p className="mb-3">Esta acción no se puede deshacer.</p>

                            <div className="field w-full text-left">
                                <label htmlFor="reason" className="block font-bold mb-2">Razón de cancelación</label>
                                <Dropdown
                                    id="reason"
                                    value={selectedReason}
                                    options={cancellationReasons}
                                    onChange={(e) => setSelectedReason(e.value)}
                                    placeholder="Seleccione una razón"
                                    className="w-full"
                                    optionLabel="label"
                                    optionValue="value"
                                />
                            </div>
                        </div>
                    )}
                </div>
            </Dialog>
        </div>
    );
};

export default Dashboard;