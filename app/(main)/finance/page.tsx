'use client';
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Chart } from 'primereact/chart';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Button } from 'primereact/button';
import { Card } from 'primereact/card';
import { Dropdown } from 'primereact/dropdown';
import { Dialog } from 'primereact/dialog';
import { InputNumber } from 'primereact/inputnumber';
import { InputText } from 'primereact/inputtext';
import { Toast } from 'primereact/toast';
import { ChartOptions } from 'chart.js';
import Link from 'next/link';
import { DashboardService } from '@/app/service/dashboardService';
import { CatalogService } from '@/app/service/catalogService';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export interface Movimiento {
    id?: number;
    fecha: string;
    concepto: string;
    tipoMovimiento: string;
    monto: number;
    usuario: string;
}

const FinancePage = () => {
    // --- ESTADOS DE LA GRÁFICA ---
    const [chartData, setChartData] = useState<any>({});
    const [lineOptions, setLineOptions] = useState<ChartOptions>({});
    const [filtroTiempo, setFiltroTiempo] = useState<string>('mes');
    const [loadingChart, setLoadingChart] = useState(false);

    // --- ESTADOS PARA LA TABLA Y CAJA ---
    const [movements, setMovements] = useState<Movimiento[]>([]);
    const [loadingTable, setLoadingTable] = useState(false);
    const [tiposMovimiento, setTiposMovimiento] = useState<any[]>([]);

    // --- ESTADOS DEL FORMULARIO DE EGRESOS / AJUSTES ---
    const [showMovimientoDialog, setShowMovimientoDialog] = useState(false);
    const [movimientoConcepto, setMovimientoConcepto] = useState('');
    const [movimientoMonto, setMovimientoMonto] = useState<number | null>(null);
    const [movimientoTipo, setMovimientoTipo] = useState<number | null>(null);
    const [savingMovimiento, setSavingMovimiento] = useState(false);

    const toast = useRef<Toast>(null);

    const filterOptions = [
        { label: 'Hoy', value: 'hoy' },
        { label: 'Semana', value: 'semana' },
        { label: 'Mes', value: 'mes' },
        { label: 'Año', value: 'año' }
    ];

    const [totalesCaja, setTotalesCaja] = useState({
        totalIngresos: 0,
        entradaCaja: 0,
        totalEgresos: 0,
        balance: 0
    });

    const [showAjusteDialog, setShowAjusteDialog] = useState(false);
    const [ajusteConcepto, setAjusteConcepto] = useState('');
    const [ajusteMonto, setAjusteMonto] = useState<number | null>(null);
    const [ajusteTipo, setAjusteTipo] = useState<string | null>(null);
    const [savingAjuste, setSavingAjuste] = useState(false);

    const opcionesTipoAjuste = [
        { label: 'Entrada de dinero', value: 'ENTRADA' },
        { label: 'Salida de dinero', value: 'SALIDA' }
    ];

    useEffect(() => {
        const fetchGraficaFinanzas = async () => {
            setLoadingChart(true);
            try {
                const documentStyle = getComputedStyle(document.documentElement);
                const textColor = documentStyle.getPropertyValue('--text-color');
                const textColorSecondary = documentStyle.getPropertyValue('--text-color-secondary');
                const surfaceBorder = documentStyle.getPropertyValue('--surface-border');
                const greenColor = documentStyle.getPropertyValue('--green-500') || '#10b981';
                const redColor = documentStyle.getPropertyValue('--red-500') || '#ef4444';

                const [egresosResponse, ingresosResponse] = await Promise.all([
                    DashboardService.getEgresosGrafica(filtroTiempo),
                    DashboardService.getIngresosGrafica(filtroTiempo)
                ]);

                const egresosArray = egresosResponse.datosGrafica || [];
                const ingresosArray = ingresosResponse.datosGrafica || [];

                const labels = egresosArray.map((item: any) => item.label);
                const dataEgresos = egresosArray.map((item: any) => item.total);
                const dataIngresos = ingresosArray.map((item: any) => item.value);

                setChartData({
                    labels: labels,
                    datasets: [
                        {
                            label: 'Ingresos',
                            backgroundColor: greenColor,
                            borderColor: greenColor,
                            data: dataIngresos,
                            fill: false,
                            tension: 0.4
                        },
                        {
                            label: 'Egresos',
                            backgroundColor: redColor,
                            borderColor: redColor,
                            data: dataEgresos,
                            fill: false,
                            tension: 0.4
                        }
                    ]
                });

                setLineOptions({
                    maintainAspectRatio: false,
                    aspectRatio: 0.6,
                    plugins: {
                        legend: { labels: { color: textColor } }
                    },
                    scales: {
                        x: {
                            ticks: { color: textColorSecondary },
                            grid: { color: surfaceBorder }
                        },
                        y: {
                            ticks: { color: textColorSecondary },
                            grid: { color: surfaceBorder }
                        }
                    }
                });

            } catch (error) {
                console.error("Error al cargar gráfica de finanzas", error);
                toast.current?.show({ severity: 'error', summary: 'Error', detail: 'No se pudo cargar la gráfica', life: 3000 });
            } finally {
                setLoadingChart(false);
            }
        };

        fetchGraficaFinanzas();
    }, [filtroTiempo]);

    const fetchFlujoCaja = useCallback(async () => {
        setLoadingTable(true);
        try {
            const [totales, listaMovimientos] = await Promise.all([
                DashboardService.getTotalesCaja(),
                DashboardService.getFlujoCaja()
            ]);

            setTotalesCaja({
                totalIngresos: totales.totalIngresos || 0,
                entradaCaja: totales.entradaCaja || 0,
                totalEgresos: totales.totalEgresos || 0,
                balance: totales.balance || 0
            });

            setMovements(listaMovimientos);

        } catch (error) {
            console.error("Error al cargar la caja", error);
            toast.current?.show({ severity: 'error', summary: 'Error', detail: 'No se pudo cargar la información de caja', life: 3000 });
        } finally {
            setLoadingTable(false);
        }
    }, []);

    useEffect(() => {
        fetchFlujoCaja();

        const fetchTipos = async () => {
            try {
                const tipos = await CatalogService.getTiposMovimiento();
                const formateados = tipos
                    .filter((t: any) => !t.descripcion.toUpperCase().includes('INGRESO'))
                    .map((t: any) => ({
                        label: t.descripcion,
                        value: t.idTipo
                    }));

                setTiposMovimiento(formateados);
            } catch (error) {
                console.error("Error al cargar tipos de movimiento", error);
            }
        };
        fetchTipos();
    }, [fetchFlujoCaja]);

    const handleSaveMovimiento = async () => {
        if (!movimientoConcepto.trim() || !movimientoMonto || !movimientoTipo) {
            toast.current?.show({ severity: 'warn', summary: 'Datos Incompletos', detail: 'Por favor, llena todos los campos.', life: 3000 });
            return;
        }

        setSavingMovimiento(true);
        try {
            const userStr = localStorage.getItem('user');
            const userId = userStr ? JSON.parse(userStr).id || JSON.parse(userStr).idUsuario : null;

            if (!userId) {
                throw new Error("No se pudo identificar al usuario activo");
            }

            const payload = {
                concepto: movimientoConcepto,
                monto: movimientoMonto,
                idTipoMovimiento: movimientoTipo,
                idUsuarioRegistro: userId
            };

            await DashboardService.registrarEgreso(payload);

            toast.current?.show({ severity: 'success', summary: 'Éxito', detail: 'Movimiento registrado correctamente', life: 3000 });

            setMovimientoConcepto('');
            setMovimientoMonto(null);
            setMovimientoTipo(null);
            setShowMovimientoDialog(false);
            fetchFlujoCaja();

        } catch (error: any) {
            console.error("Error al registrar", error);
            toast.current?.show({ severity: 'error', summary: 'Error', detail: error.message || 'Error al registrar el movimiento', life: 3000 });
        } finally {
            setSavingMovimiento(true);
        }
    };

    const handleSaveAjuste = async () => {
        if (!ajusteConcepto.trim() || !ajusteMonto || !ajusteTipo) {
            toast.current?.show({ severity: 'warn', summary: 'Datos Incompletos', detail: 'Por favor, llena todos los campos.', life: 3000 });
            return;
        }

        setSavingAjuste(true);
        try {
            const userStr = localStorage.getItem('user');
            const userId = userStr ? JSON.parse(userStr).id || JSON.parse(userStr).idUsuario : null;

            if (!userId) throw new Error("No se pudo identificar al usuario activo");

            await DashboardService.registrarAjusteCaja({
                monto: ajusteMonto,
                concepto: ajusteConcepto,
                tipoAjuste: ajusteTipo,
                idUsuario: userId
            });

            toast.current?.show({ severity: 'success', summary: 'Éxito', detail: 'Ajuste de caja registrado', life: 3000 });

            setAjusteConcepto('');
            setAjusteMonto(null);
            setAjusteTipo(null);
            setShowAjusteDialog(false);

            fetchFlujoCaja();
        } catch (error: any) {
            toast.current?.show({ severity: 'error', summary: 'Error', detail: error.message || 'Error al registrar el ajuste', life: 3000 });
        } finally {
            setSavingAjuste(false);
        }
    };

    const formatCurrency = (value: number) => {
        return value.toLocaleString('es-MX', { style: 'currency', currency: 'MXN' });
    };

    const formatDate = (dateString: string) => {
        if (!dateString) return '';
        const date = new Date(dateString);
        return date.toLocaleDateString('es-MX', {
            day: '2-digit', month: '2-digit', year: 'numeric',
            hour: '2-digit', minute: '2-digit'
        });
    };

    const typeBodyTemplate = (rowData: Movimiento) => {
        const tipoStr = rowData.tipoMovimiento?.toUpperCase() || '';
        const isIngreso = tipoStr.includes('INGRESO');
        return (
            <span className={`customer-badge status-${isIngreso ? 'qualified' : 'unqualified'}`}>
                {rowData.tipoMovimiento}
            </span>
        );
    };

    const amountBodyTemplate = (rowData: Movimiento) => {
        const tipoStr = rowData.tipoMovimiento?.toUpperCase() || '';
        const isIngreso = tipoStr.includes('INGRESO');
        const color = isIngreso ? 'text-green-500' : 'text-red-500';
        const sign = isIngreso ? '+' : '-';
        return <span className={`font-bold ${color}`}>{sign} {formatCurrency(rowData.monto)}</span>;
    };

    // --- FUNCIÓN PARA GENERAR EL REPORTE PDF ---
    const exportarPDF = () => {
        const doc = new jsPDF();
        doc.setFontSize(18);
        doc.text('Reporte financiero', 14, 22);
        doc.setFontSize(11);
        doc.setTextColor(100);
        const labelFiltro = filterOptions.find(f => f.value === filtroTiempo)?.label || filtroTiempo;
        doc.text(`Período del reporte: ${labelFiltro}`, 14, 30);
        doc.text(`Fecha de generación: ${new Date().toLocaleDateString('es-MX', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })}`, 14, 36);

        doc.setFontSize(14);
        doc.setTextColor(0);
        doc.text('Resumen de caja', 14, 50);

        doc.setFontSize(11);
        doc.text(`Balance actual: ${formatCurrency(totalesCaja.balance)}`, 14, 58);
        doc.text(`Fondo base / Entradas: ${formatCurrency(totalesCaja.entradaCaja)}`, 14, 64);
        doc.text(`Total ingresos: ${formatCurrency(totalesCaja.totalIngresos)}`, 14, 70);
        doc.text(`Total egresos: ${formatCurrency(totalesCaja.totalEgresos)}`, 14, 76);

        doc.setFontSize(14);
        doc.text('Detalle de movimientos', 14, 95);

        const tableColumn = ["Fecha", "Concepto", "Tipo", "Monto"];
        const tableRows = movements.map(m => {
            const fechaStr = formatDate(m.fecha);
            const isIngreso = (m.tipoMovimiento || '').toUpperCase().includes('INGRESO');
            const signo = isIngreso ? '+' : '-';
            const montoStr = `${signo} ${formatCurrency(m.monto)}`;

            return [fechaStr, m.concepto, m.tipoMovimiento, montoStr];
        });

        autoTable(doc, {
            startY: 100,
            head: [tableColumn],
            body: tableRows,
            theme: 'striped',
            headStyles: { fillColor: [41, 128, 185] },
            styles: { fontSize: 10 },
            alternateRowStyles: { fillColor: [245, 245, 245] }
        });

        const fechaLegible = new Date().toLocaleDateString('es-MX').replace(/\//g, '-');
        doc.save(`Reporte_Financiero_${labelFiltro}_${fechaLegible}.pdf`);

        toast.current?.show({ severity: 'success', summary: 'Éxito', detail: 'Reporte descargado correctamente', life: 3000 });
    };

    return (
        <div className="grid">
            <Toast ref={toast} />
            <div className="col-12">
                <div className="flex justify-content-between align-items-center mb-4 bg-surface-0 dark:bg-surface-900 border-round p-3 shadow-1">
                    <div className="flex align-items-center gap-3">
                        <Link href="/" passHref legacyBehavior>
                            <Button icon="pi pi-arrow-left" rounded text aria-label="Volver" tooltip="Volver al Dashboard" />
                        </Link>
                        <h1 className="text-3xl font-bold m-0 text-700">Información financiera</h1>
                    </div>
                    <div className="flex gap-2 align-items-center">
                        <Dropdown
                            value={filtroTiempo}
                            options={filterOptions}
                            onChange={(e) => setFiltroTiempo(e.value)}
                            className="w-12rem"
                        />
                        <Button
                            label="Descargar reporte"
                            icon="pi pi-download"
                            className="p-button-outlined"
                            onClick={exportarPDF}
                        />
                    </div>
                </div>

                <Card title="Ingresos y egresos" className="mb-4 shadow-1 surface-card">
                    {loadingChart ? (
                        <div className="flex justify-content-center align-items-center" style={{ height: '350px' }}>
                            <i className="pi pi-spin pi-spinner text-4xl text-primary"></i>
                        </div>
                    ) : (
                        <div style={{ height: '350px' }}>
                            <Chart type="line" data={chartData} options={lineOptions} className="h-full w-full" />
                        </div>
                    )}
                </Card>

                {/* --- SECCIÓN DE CAJA CHICA --- */}
                <div className="grid">
                    {/* Tarjeta de Saldo Actual */}
                    <div className="col-12 xl:col-4">
                        <Card className="shadow-1 h-full border-left-3 border-blue-500 surface-card flex flex-column justify-content-center align-items-center">
                            <div className="flex flex-column align-items-center justify-content-center text-center w-full">
                                <span className="text-xl text-500 mb-2 font-semibold">Balance en Caja</span>
                                {/* Utilizamos el balance que viene directamente del backend */}
                                <span className="text-4xl font-bold text-blue-500 mb-2">{formatCurrency(totalesCaja.balance)}</span>
                                <span className="text-sm text-500 mb-4">
                                    Base/Entradas: <span className="text-green-500">{formatCurrency(totalesCaja.entradaCaja)}</span>
                                </span>

                                <div className="flex flex-column gap-2 w-full px-3">
                                    <Button
                                        label="Ajuste de Caja"
                                        icon="pi pi-sort-alt"
                                        className="p-button-outlined text-blue-500 w-full"
                                        onClick={() => setShowAjusteDialog(true)}
                                    />
                                    <Button
                                        label="Registrar Egreso"
                                        icon="pi pi-minus-circle"
                                        className="p-button-danger p-button-outlined w-full"
                                        onClick={() => setShowMovimientoDialog(true)}
                                    />
                                </div>
                            </div>
                        </Card>
                    </div>

                    {/* --- DIALOG DE AJUSTE DE CAJA --- */}
                    <Dialog
                        header="Ajuste de Caja"
                        visible={showAjusteDialog}
                        style={{ width: '450px' }}
                        modal
                        onHide={() => setShowAjusteDialog(false)}
                        footer={
                            <div>
                                <Button label="Cancelar" icon="pi pi-times" onClick={() => setShowAjusteDialog(false)} className="p-button-text" disabled={savingAjuste} />
                                <Button label="Guardar Ajuste" icon="pi pi-check" onClick={handleSaveAjuste} autoFocus loading={savingAjuste} />
                            </div>
                        }
                    >
                        <div className="flex flex-column gap-4 mt-2">
                            <div className="field">
                                <label className="font-bold block mb-2">Tipo de Ajuste</label>
                                <Dropdown
                                    value={ajusteTipo}
                                    options={opcionesTipoAjuste}
                                    onChange={(e) => setAjusteTipo(e.value)}
                                    placeholder="¿Es entrada o salida?"
                                    className="w-full"
                                />
                            </div>

                            <div className="field">
                                <label className="font-bold block mb-2">Concepto / Motivo</label>
                                <InputText
                                    value={ajusteConcepto}
                                    onChange={(e) => setAjusteConcepto(e.target.value)}
                                    placeholder="Ej. Fondo de caja, Compra de garrafón..."
                                    className="w-full"
                                />
                            </div>

                            <div className="field">
                                <label className="font-bold block mb-2">Monto</label>
                                <InputNumber
                                    value={ajusteMonto}
                                    onValueChange={(e) => setAjusteMonto(e.value || null)}
                                    mode="currency"
                                    currency="MXN"
                                    locale="es-MX"
                                    className="w-full"
                                    placeholder="$0.00"
                                />
                            </div>
                        </div>
                    </Dialog>

                    {/* --- DIALOG DE REGISTRO DE EGRESO --- */}
                    <Dialog
                        header="Registrar Egreso"
                        visible={showMovimientoDialog}
                        style={{ width: '450px' }}
                        modal
                        onHide={() => setShowMovimientoDialog(false)}
                        footer={
                            <div>
                                <Button label="Cancelar" icon="pi pi-times" onClick={() => setShowMovimientoDialog(false)} className="p-button-text" disabled={savingMovimiento} />
                                <Button label="Guardar Egreso" icon="pi pi-check" onClick={handleSaveMovimiento} autoFocus loading={savingMovimiento} />
                            </div>
                        }
                    >
                        <div className="flex flex-column gap-4 mt-2">
                            <div className="field">
                                <label className="font-bold block mb-2">Tipo de Egreso</label>
                                <Dropdown
                                    value={movimientoTipo}
                                    options={tiposMovimiento}
                                    onChange={(e) => setMovimientoTipo(e.value)}
                                    placeholder="Selecciona el tipo"
                                    className="w-full"
                                />
                            </div>

                            <div className="field">
                                <label className="font-bold block mb-2">Concepto / Descripción</label>
                                <InputText
                                    value={movimientoConcepto}
                                    onChange={(e) => setMovimientoConcepto(e.target.value)}
                                    placeholder="Ej. Pago de luz, Compra de papel..."
                                    className="w-full"
                                />
                            </div>

                            <div className="field">
                                <label className="font-bold block mb-2">Monto</label>
                                <InputNumber
                                    value={movimientoMonto}
                                    onValueChange={(e) => setMovimientoMonto(e.value || null)}
                                    mode="currency"
                                    currency="MXN"
                                    locale="es-MX"
                                    className="w-full"
                                    placeholder="$0.00"
                                />
                            </div>
                        </div>
                    </Dialog>

                    {/* Tabla de Movimientos Recientes */}
                    <div className="col-12 xl:col-8">
                        <Card title="Movimientos recientes" className="shadow-1 h-full surface-card relative">
                            {/* Botón de refrescar sobre la tabla */}
                            <Button
                                icon="pi pi-refresh"
                                rounded text
                                className="absolute"
                                style={{ top: '1.5rem', right: '1.5rem' }}
                                onClick={fetchFlujoCaja}
                                tooltip="Recargar tabla"
                            />

                            <DataTable
                                value={movements}
                                loading={loadingTable}
                                paginator
                                rows={5}
                                responsiveLayout="scroll"
                                size="small"
                                emptyMessage="No hay movimientos registrados."
                            >
                                <Column field="fecha" header="Fecha" body={(rowData) => formatDate(rowData.fecha)} sortable style={{ width: '15%' }} />
                                <Column field="concepto" header="Concepto" style={{ width: '30%' }} />
                                <Column field="tipoMovimiento" header="Tipo" body={typeBodyTemplate} style={{ width: '25%' }} />
                                <Column field="monto" header="Monto" body={amountBodyTemplate} sortable style={{ width: '15%' }} className="text-right" />
                            </DataTable>
                        </Card>
                    </div>
                </div>

            </div>
        </div>
    );
};

export default FinancePage;