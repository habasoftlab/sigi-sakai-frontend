'use client';
import React, { useState, useEffect, useRef } from 'react';
import { Chart } from 'primereact/chart';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Button } from 'primereact/button';
import { Card } from 'primereact/card';
import { Dropdown } from 'primereact/dropdown';
import { Dialog } from 'primereact/dialog'; // <-- Importar Dialog
import { InputNumber } from 'primereact/inputnumber'; // <-- Importar InputNumber
import { Toast } from 'primereact/toast'; // <-- Importar Toast
import { ChartOptions } from 'chart.js';
import { Movimiento, dummyMovimientos } from '@/app/api/mockData';
import Link from 'next/link';

const FinancePage = () => {
    // Usamos 'any' para evitar conflictos de tipado estricto iniciales de ChartJS
    const [chartData, setChartData] = useState<any>({});
    const [lineOptions, setLineOptions] = useState<ChartOptions>({});
    const [selectedMonth, setSelectedMonth] = useState<string | null>(null);

    // --- ESTADOS PARA LA CAJA Y APERTURA ---
    // Inicializamos el estado con los datos dummy para poder agregar nuevos movimientos dinámicamente
    const [movements, setMovements] = useState<Movimiento[]>(dummyMovimientos);
    const [showOpeningDialog, setShowOpeningDialog] = useState(false);
    const [openingAmount, setOpeningAmount] = useState<number>(0);
    const toast = useRef<Toast>(null);

    // Opciones para el dropdown de meses
    const months = [
        { label: 'Agosto', value: '08' },
        { label: 'Septiembre', value: '09' },
        { label: 'Octubre', value: '10' }
    ];

    // --- CONFIGURACIÓN DE LA GRÁFICA ---
    useEffect(() => {
        const documentStyle = getComputedStyle(document.documentElement);
        const textColor = documentStyle.getPropertyValue('--text-color');
        const textColorSecondary = documentStyle.getPropertyValue('--text-color-secondary');
        const surfaceBorder = documentStyle.getPropertyValue('--surface-border');

        // Colores del tema (se adaptan si cambias el tema)
        const greenColor = documentStyle.getPropertyValue('--green-500') || '#22c55e';
        const redColor = documentStyle.getPropertyValue('--red-500') || '#ef4444';

        const data = {
            labels: ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'],
            datasets: [
                {
                    label: 'Ingresos',
                    backgroundColor: greenColor,
                    borderColor: greenColor,
                    tension: 0.4,
                    data: [65, 59, 80, 81, 56, 55, 40, 70, 75, 82, 200, 150]
                },
                {
                    label: 'Egresos',
                    backgroundColor: redColor,
                    borderColor: redColor,
                    tension: 0.4,
                    data: [40, 30, 60, 50, 45, 25, 35, 60, 50, 70, 100, 80]
                }
            ]
        };

        const options = {
            maintainAspectRatio: false,
            aspectRatio: 0.6,
            plugins: {
                legend: {
                    labels: {
                        color: textColor
                    }
                }
            },
            scales: {
                x: {
                    ticks: {
                        color: textColorSecondary
                    },
                    grid: {
                        color: surfaceBorder
                    }
                },
                y: {
                    ticks: {
                        color: textColorSecondary
                    },
                    grid: {
                        color: surfaceBorder
                    }
                }
            }
        };

        setChartData(data);
        setLineOptions(options);
    }, []);

    // --- CÁLCULOS DE CAJA (Basados en el estado 'movements') ---

    // 1. Calcular Saldo Actual 
    const totalIngresos = movements
        .filter(m => m.tipo === 'INGRESO')
        .reduce((acc, curr) => acc + curr.monto, 0);

    const totalEgresos = movements
        .filter(m => m.tipo === 'EGRESO')
        .reduce((acc, curr) => acc + curr.monto, 0);

    // El saldo es Ingresos - Egresos. 
    // La "Base inicial" ahora se maneja como un movimiento de apertura si se agrega.
    const saldoActual = totalIngresos - totalEgresos; // + 5000 (opcional si quieres mantener base fija visual)

    // --- MANEJO DE APERTURA DE CAJA ---
    const handleOpenBox = () => {
        const newMovement: Movimiento = {
            id: movements.length + 1,
            tipo: 'INGRESO',
            concepto: 'Apertura de Caja / Saldo Inicial',
            monto: openingAmount,
            fecha: new Date().toLocaleString(),
            usuario: 'Admin', // En una app real, tomar del contexto de auth
        };

        // Actualizamos el estado de movimientos, lo que recalculará el saldo automáticamente
        setMovements([newMovement, ...movements]);

        toast.current?.show({ severity: 'success', summary: 'Caja Abierta', detail: `Saldo inicial registrado: $${openingAmount}`, life: 3000 });
        setShowOpeningDialog(false);
        setOpeningAmount(0);
    };

    // 2. Resumen Diario (Datos estáticos para el demo visual)
    const dailySummary = [
        { day: 'Lunes', caja: 5000, gastos: 1500, ingresos: 3200 },
        { day: 'Martes', caja: 6700, gastos: 800, ingresos: 4100 },
        { day: 'Miércoles', caja: 10000, gastos: 200, ingresos: 1500 },
        { day: 'Jueves', caja: 11300, gastos: 5000, ingresos: 2000 },
        { day: 'Viernes', caja: 8300, gastos: 1200, ingresos: 5600 },
    ];

    // --- HELPERS DE FORMATO ---
    const formatCurrency = (value: number) => {
        return value.toLocaleString('es-MX', { style: 'currency', currency: 'MXN' });
    };

    const typeBodyTemplate = (rowData: Movimiento) => {
        return (
            <span className={`customer-badge status-${rowData.tipo === 'INGRESO' ? 'qualified' : 'unqualified'}`}>
                {rowData.tipo}
            </span>
        );
    };

    const amountBodyTemplate = (rowData: Movimiento) => {
        const color = rowData.tipo === 'INGRESO' ? 'text-green-500' : 'text-red-500';
        const sign = rowData.tipo === 'INGRESO' ? '+' : '-';
        return <span className={`font-bold ${color}`}>{sign} {formatCurrency(rowData.monto)}</span>;
    };

    return (
        <div className="grid">
            <Toast ref={toast} />
            <div className="col-12">
                <div className="flex justify-content-between align-items-center mb-4">
                    <h1 className="text-3xl font-bold m-0">Información financiera</h1>
                    <div className="flex gap-2">
                        <Link href="/" passHref legacyBehavior>
                            <a className="p-button p-component p-button-text p-button-plain">
                                <i className="pi pi-arrow-left mr-2"></i>
                                <span className="font-bold">Volver</span>
                            </a>
                        </Link>
                        <Dropdown
                            value={selectedMonth}
                            options={months}
                            onChange={(e) => setSelectedMonth(e.value)}
                            placeholder="Mes"
                            className="w-12rem"
                        />
                        <Button label="Descargar reporte" icon="pi pi-download" className="p-button-outlined" />
                    </div>
                </div>

                <Card title="Ingresos y Egresos" className="mb-4 shadow-1 surface-card">
                    <Chart type="line" data={chartData} options={lineOptions} />
                </Card>

                {/* --- SECCIÓN DE CAJA CHICA --- */}
                <div className="grid">
                    {/* Tarjeta de Saldo Actual */}
                    <div className="col-12 md:col-4">
                        <Card className="shadow-1 h-full border-left-3 border-blue-500 surface-card">
                            <div className="flex flex-column align-items-center justify-content-center h-full">
                                <span className="text-xl text-500 mb-2 font-semibold">Caja Chica (Saldo)</span>
                                <span className="text-4xl font-bold text-blue-500">{formatCurrency(saldoActual)}</span>
                                <span className="text-sm text-500 mt-2">Base inicial: $5,000.00</span>

                                {/* BOTÓN DE APERTURA */}
                                <Button
                                    label="Apertura / Ajuste"
                                    icon="pi pi-wallet"
                                    className="p-button-text p-button-sm mt-3"
                                    onClick={() => setShowOpeningDialog(true)}
                                />
                            </div>
                        </Card>
                    </div>

                    {/* Tabla de Movimientos Recientes */}
                    <div className="col-12 md:col-8">
                        <Card title="Movimientos Recientes" className="shadow-1 h-full surface-card">
                            <DataTable
                                value={movements} // Usamos el estado 'movements'
                                paginator
                                rows={5}
                                responsiveLayout="scroll"
                                size="small"
                                emptyMessage="No hay movimientos registrados."
                            >
                                <Column field="fecha" header="Fecha" sortable style={{ width: '20%' }} />
                                <Column field="concepto" header="Concepto" style={{ width: '35%' }} />
                                <Column field="tipo" header="Tipo" body={typeBodyTemplate} style={{ width: '15%' }} />
                                <Column field="monto" header="Monto" body={amountBodyTemplate} sortable style={{ width: '20%' }} />
                                <Column field="usuario" header="Usuario" style={{ width: '10%' }} />
                            </DataTable>
                        </Card>
                    </div>
                </div>

                {/* --- TABLA DE RESUMEN DIARIO --- */}
                <Card className="mt-4 shadow-1 surface-card">
                    <h5 className="mb-3">Resumen Diario (Semana Actual)</h5>
                    <DataTable value={dailySummary} responsiveLayout="scroll" showGridlines>
                        <Column field="day" header="Día" className="font-bold" />
                        <Column field="caja" header="Caja Inicial" body={(d) => formatCurrency(d.caja)} />
                        <Column field="gastos" header="Gastos (Egresos)" body={(d) => <span className="text-red-500">{formatCurrency(d.gastos)}</span>} />
                        <Column field="ingresos" header="Ingresos" body={(d) => <span className="text-green-500">{formatCurrency(d.ingresos)}</span>} />
                        <Column header="Balance" body={(d) => <span className="font-bold">{formatCurrency(d.ingresos - d.gastos)}</span>} />
                    </DataTable>
                </Card>

                {/* --- DIALOGO DE APERTURA DE CAJA --- */}
                <Dialog
                    header="Apertura de Caja"
                    visible={showOpeningDialog}
                    style={{ width: '400px' }}
                    modal
                    onHide={() => setShowOpeningDialog(false)}
                    footer={
                        <div>
                            <Button label="Cancelar" icon="pi pi-times" onClick={() => setShowOpeningDialog(false)} className="p-button-text" />
                            <Button label="Guardar" icon="pi pi-check" onClick={handleOpenBox} autoFocus />
                        </div>
                    }
                >
                    <div className="flex flex-column gap-3">
                        <p className="m-0 text-600">
                            Ingresa el monto inicial para abrir la caja. Esto se registrará como un ingreso de apertura.
                        </p>
                        <div className="field">
                            <label htmlFor="amount" className="font-bold block mb-2">Monto Inicial</label>
                            <InputNumber
                                id="amount"
                                value={openingAmount}
                                onValueChange={(e) => setOpeningAmount(e.value || 0)}
                                mode="currency"
                                currency="MXN"
                                locale="es-MX"
                                className="w-full"
                                autoFocus
                            />
                        </div>
                    </div>
                </Dialog>

            </div>
        </div>
    );
};

export default FinancePage;