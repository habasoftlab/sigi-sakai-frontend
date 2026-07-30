/* eslint-disable @next/next/no-img-element */
'use client';
import React, { useContext, useEffect, useState, useRef } from 'react';
import { Button } from 'primereact/button';
import { Chart } from 'primereact/chart';
import { LayoutContext } from '../../layout/context/layoutcontext';
import { ChartData, ChartOptions } from 'chart.js';
import Link from 'next/link';
import { Dialog } from 'primereact/dialog';
import { Dropdown } from 'primereact/dropdown';
import { Toast } from 'primereact/toast';
import { useRouter } from 'next/navigation';
import { TreeTable, TreeTablePageEvent } from 'primereact/treetable';
import { TreeNode } from 'primereact/treenode';
import { Column } from 'primereact/column';
import { Tag } from 'primereact/tag';

// --- SERVICIOS ---
import { OrderService } from '@/app/service/orderService';
import { UserService } from '@/app/service/userService';
import { ClientService } from '@/app/service/clientService';
import { DashboardService } from '../service/dashboardService';

const filterOptions = [
    { label: 'Hoy', value: 'hoy' },
    { label: 'Semana', value: 'semana' },
    { label: 'Mes', value: 'mes' },
    { label: 'Año', value: 'año' }
];

const lineDataEgr: ChartData = {
    labels: ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio'],
    datasets: [
        { label: 'Ingresos', data: [28, 48, 40, 19, 86, 27, 90], fill: false, backgroundColor: '#00bb1fff', borderColor: '#00bb1fff', tension: 0.4 },
        { label: 'Egresos', data: [65, 59, 80, 81, 56, 55, 40], fill: false, backgroundColor: '#ad0202ff', borderColor: '#ad0202ff', tension: 0.4 }
    ]
};

const Dashboard = () => {
    const { layoutConfig } = useContext(LayoutContext);
    const toast = useRef<Toast>(null);
    const router = useRouter();
    const [isAuthorized, setIsAuthorized] = useState(false);


    // --- ESTADOS DE FINANZAS ---
    const [lineOptions, setLineOptions] = useState<ChartOptions>({});
    const [filtroTiempo, setFiltroTiempo] = useState('semana');
    const [graficaData, setGraficaData] = useState<any>({});
    const [loadingGrafica, setLoadingGrafica] = useState(false);
    const [graficaFinanzas, setGraficaFinanzas] = useState<any>({});
    const [loadingFinanzas, setLoadingFinanzas] = useState(false);
    const [resumenTarjetas, setResumenTarjetas] = useState({
        ingresos: 0,
        cotizaciones: 0,
        ordenes: 0
    });

    // --- ESTADOS DE LA TABLA DE ÓRDENES (TreeTable) ---
    const [orderTree, setOrderTree] = useState<TreeNode[]>([]);
    const [loadingTable, setLoadingTable] = useState(true);
    const [first, setFirst] = useState(0);
    const [rows, setRows] = useState(5); // Mostrar 5 por defecto en el dashboard
    const [totalRecords, setTotalRecords] = useState(0);

    // Mapas para visualización
    const [designerMap, setDesignerMap] = useState<Record<number, string>>({});
    const [clientMap, setClientMap] = useState<Record<number, string>>({});
    const [statusMap, setStatusMap] = useState<Record<number, string>>({});
    const [cancelReasons, setCancelReasons] = useState<any[]>([]);

    // --- ESTADOS PARA CANCELACIÓN Y ENTREGA ---
    const [showCancelDialog, setShowCancelDialog] = useState(false);
    const [selectedOrderToCancel, setSelectedOrderToCancel] = useState<number | null>(null);
    const [selectedReason, setSelectedReason] = useState<number | null>(null);
    const [isCancelling, setIsCancelling] = useState(false);

    const [showDeliveryDialog, setShowDeliveryDialog] = useState(false);
    const [selectedOrderToDeliver, setSelectedOrderToDeliver] = useState<number | null>(null);
    const [selectedOrderDebt, setSelectedOrderDebt] = useState<number>(0);
    const [isDelivering, setIsDelivering] = useState(false);

    useEffect(() => {
        let token = localStorage.getItem('token');
        if (!token) {
            const userStr = localStorage.getItem('user');
            token = userStr ? JSON.parse(userStr).token : null;
        }

        if (!token) {
            router.replace('/auth/login');
        } else {
            setIsAuthorized(true);
        }
    }, [router]);

    useEffect(() => {
        const fetchGraficas = async () => {
            setLoadingGrafica(true);
            setLoadingFinanzas(true);

            try {
                const [cotiData, ordData, egresosResponse, ingresosResponse] = await Promise.all([
                    DashboardService.getCotizacionesGrafica(filtroTiempo),
                    DashboardService.getOrdenesGrafica(filtroTiempo),
                    DashboardService.getEgresosGrafica(filtroTiempo),
                    DashboardService.getIngresosGrafica(filtroTiempo)
                ]);

                const labelsGrafica1 = cotiData.map((item: any) => item.label);
                const dataCotizaciones = cotiData.map((item: any) => item.totalCotizaciones);
                const dataOrdenes = ordData.map((item: any) => item.totalOrdenes);

                setGraficaData({
                    labels: labelsGrafica1,
                    datasets: [
                        { label: 'Cotizaciones', backgroundColor: '#6366f1', data: dataCotizaciones },
                        { label: 'Órdenes', backgroundColor: '#10b981', data: dataOrdenes }
                    ]
                });

                const egresosArray = egresosResponse.datosGrafica || [];
                const ingresosArray = ingresosResponse.datosGrafica || [];
                const labelsGrafica2 = egresosArray.map((item: any) => item.label);
                const dataEgresos = egresosArray.map((item: any) => item.total);
                const dataIngresos = ingresosArray.map((item: any) => item.value);

                setGraficaFinanzas({
                    labels: labelsGrafica2,
                    datasets: [
                        {
                            label: 'Ingresos',
                            backgroundColor: '#10b981',
                            borderColor: '#10b981',
                            data: dataIngresos,
                            fill: false,
                            tension: 0.4
                        },
                        {
                            label: 'Egresos',
                            backgroundColor: '#ef4444',
                            borderColor: '#ef4444',
                            data: dataEgresos,
                            fill: false,
                            tension: 0.4
                        }
                    ]
                });

                const ingresosTotales = ingresosResponse.montoPagado || 0;
                const cotizacionesTotales = cotiData.reduce((acc: number, curr: any) => acc + (curr.totalCotizaciones || 0), 0);
                const ordenesTotales = ordData.reduce((acc: number, curr: any) => acc + (curr.totalOrdenes || 0), 0);

                setResumenTarjetas({
                    ingresos: ingresosTotales,
                    cotizaciones: cotizacionesTotales,
                    ordenes: ordenesTotales
                });

            } catch (error) {
                console.error("Error al cargar las gráficas", error);
            } finally {
                setLoadingGrafica(false);
                setLoadingFinanzas(false);
            }
        };

        fetchGraficas();
    }, [filtroTiempo]);

    useEffect(() => {
        const applyTheme = () => {
            const isLight = layoutConfig.colorScheme === 'light';
            const color = isLight ? '#495057' : '#ebedef';
            const gridColor = isLight ? '#ebedef' : 'rgba(160, 167, 181, .3)';
            setLineOptions({
                plugins: { legend: { labels: { color } } },
                scales: {
                    x: { ticks: { color }, grid: { color: gridColor } },
                    y: { ticks: { color }, grid: { color: gridColor } }
                }
            });
        };
        applyTheme();
    }, [layoutConfig.colorScheme]);

    const formatCurrency = (value: number) => {
        return value?.toLocaleString('es-MX', { style: 'currency', currency: 'MXN' });
    };

    useEffect(() => {
        const initData = async () => {
            setLoadingTable(true);
            try {
                const [designers, clients, statuses, reasons] = await Promise.all([
                    UserService.getDesigners(),
                    ClientService.getAll(),
                    OrderService.getEstatusOperaciones(),
                    OrderService.getRazonesCancelacion()
                ]);
                const dMap: Record<number, string> = {};
                designers.forEach((d: any) => { dMap[d.idUsuario || d.id] = d.nombre; });
                setDesignerMap(dMap);

                const cMap: Record<number, string> = {};
                clients.forEach((c: any) => { if (c.id) cMap[c.id] = c.nombre; });
                setClientMap(cMap);

                const sMap: Record<number, string> = {};
                statuses.forEach((s: any) => { sMap[s.idEstatus] = s.descripcion; });
                setStatusMap(sMap);

                setCancelReasons(reasons);
                await loadOrdersLazy(0, rows, dMap, cMap, sMap);
            } catch (error) {
                console.error("Error inicializando catálogos:", error);
            } finally {
                setLoadingTable(false);
            }
        };
        initData();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);
    const loadOrdersLazy = async (pageIndex: number, pageSize: number, currentDMap = designerMap, currentCMap = clientMap, currentSMap = statusMap) => {
        setLoadingTable(true);
        try {
            const response = await OrderService.getOrdenesActivas(pageIndex, pageSize);
            const listaOrdenes = response.content || response;
            const totalEnBackend = response.page?.totalElements || response.totalElements || listaOrdenes.length;

            const treeData = transformToTree(listaOrdenes, currentDMap, currentCMap, currentSMap);
            setOrderTree(treeData);
            setTotalRecords(totalEnBackend);
        } catch (error) {
            console.error("Error cargando ordenes:", error);
        } finally {
            setLoadingTable(false);
        }
    };

    const transformToTree = (items: any[], dMap: any, cMap: any, sMap: any) => {
        const groups = new Map<string, any[]>();
        items.forEach(item => {
            let designerLabel = 'Sin Asignar / Mostrador';
            if (item.idUsuarioDisenador) designerLabel = dMap[item.idUsuarioDisenador] || `Diseñador ID: ${item.idUsuarioDisenador}`;
            if (!groups.has(designerLabel)) groups.set(designerLabel, []);
            groups.get(designerLabel)?.push(item);
        });

        return Array.from(groups.entries()).map(([designerName, childrenItems], index) => {
            const totalDesigner = childrenItems.reduce((acc, curr) => acc + (curr.montoTotal || 0), 0);
            return {
                key: `group-${index}`,
                data: {
                    name: designerName, cliente: `${childrenItems.length} órdenes`, fecha: '', total: totalDesigner, estatus: 'GROUP', isGroup: true
                },
                children: childrenItems.map(item => {
                    let clientLabel = item.clienteNombre || (item.idCliente ? (cMap[item.idCliente] || `Cliente #${item.idCliente}`) : 'Público General');
                    const statusLabel = sMap[item.idEstatusActual] || `Estatus ${item.idEstatusActual}`;
                    const saldoCalculado = (item.montoTotal || 0) - (item.montoPagado || 0);

                    return {
                        key: item.idOrden.toString(),
                        data: {
                            idOrden: item.idOrden, name: `Orden #${item.idOrden}`, cliente: clientLabel, fecha: item.fechaCreacion,
                            total: item.montoTotal, saldo: saldoCalculado, idEstatus: item.idEstatusActual, estatusNombre: statusLabel, isGroup: false
                        }
                    };
                })
            };
        });
    };

    if (!isAuthorized) {
        return null;
    }


    const onPage = (event: TreeTablePageEvent) => {
        setFirst(event.first);
        setRows(event.rows);
        loadOrdersLazy(event.first / event.rows, event.rows);
    };

    const openCancelDialog = (idOrden: number) => {
        setSelectedOrderToCancel(idOrden);
        setSelectedReason(null);
        setShowCancelDialog(true);
    };

    const confirmCancellation = async () => {
        if (!selectedOrderToCancel || !selectedReason) {
            toast.current?.show({ severity: 'warn', summary: 'Atención', detail: 'Selecciona una razón de cancelación' });
            return;
        }
        const userStr = localStorage.getItem('user');
        const currentUserId = userStr ? JSON.parse(userStr).idUsuario : null;
        if (!currentUserId) return;

        setIsCancelling(true);
        try {
            await OrderService.cancelarOrden(selectedOrderToCancel, selectedReason, currentUserId);
            toast.current?.show({ severity: 'success', summary: 'Orden Cancelada', detail: 'La orden ha sido dada de baja.' });
            setShowCancelDialog(false);
            loadOrdersLazy(first / rows, rows);
        } catch (error: any) {
            toast.current?.show({ severity: 'error', summary: 'Error', detail: error.message || 'No se pudo cancelar la orden' });
        } finally {
            setIsCancelling(false);
        }
    };

    const openDeliveryDialog = (nodeData: any) => {
        setSelectedOrderToDeliver(nodeData.idOrden);
        setSelectedOrderDebt(nodeData.saldo || 0);
        setShowDeliveryDialog(true);
    };

    const confirmDelivery = async () => {
        if (!selectedOrderToDeliver) return;
        const userStr = localStorage.getItem('user');
        const currentUserId = userStr ? JSON.parse(userStr).idUsuario : null;
        if (!currentUserId) return;

        setIsDelivering(true);
        try {
            await OrderService.avanzarEstatus(selectedOrderToDeliver, { idUsuario: currentUserId, idEstatusDestino: 12, clienteAprobo: true });
            toast.current?.show({ severity: 'success', summary: 'Entregada', detail: 'Orden marcada como entregada.' });
            setShowDeliveryDialog(false);
            loadOrdersLazy(first / rows, rows);
        } catch (error: any) {
            toast.current?.show({ severity: 'error', summary: 'Error', detail: 'No se pudo registrar la entrega.' });
        } finally {
            setIsDelivering(false);
        }
    };

    const getStatusStyle = (statusId: number) => {
        switch (statusId) {
            case 1: return { bg: '#FFC107', color: '#000000', icon: 'pi pi-file' };
            case 2: return { bg: '#2196F3', color: '#ffffff', icon: 'pi pi-dollar' };
            case 3: case 4: case 7: return { bg: '#9C27B0', color: '#ffffff', icon: 'pi pi-palette' };
            case 8: return { bg: '#673AB7', color: '#ffffff', icon: 'pi pi-eye' };
            case 9: return { bg: '#4CAF50', color: '#ffffff', icon: 'pi pi-thumbs-up' };
            case 10: return { bg: '#F44336', color: '#ffffff', icon: 'pi pi-thumbs-down' };
            case 5: return { bg: '#FF9800', color: '#ffffff', icon: 'pi pi-print' };
            case 6: return { bg: '#009688', color: '#ffffff', icon: 'pi pi-box' };
            case 12: return { bg: '#607D8B', color: '#ffffff', icon: 'pi pi-check-circle' };
            case 11: return { bg: '#D32F2F', color: '#ffffff', icon: 'pi pi-times-circle' };
            default: return { bg: '#9E9E9E', color: '#ffffff', icon: 'pi pi-cog' };
        }
    };

    const statusBodyTemplate = (node: TreeNode) => {
        if (node.data.isGroup) return null;
        const style = getStatusStyle(node.data.idEstatus);
        return <Tag value={node.data.estatusNombre} icon={style.icon} style={{ backgroundColor: style.bg, color: style.color }} />;
    };

    const totalBodyTemplate = (node: TreeNode) => {
        if (node.data.isGroup) return <span className="font-bold text-lg">${(node.data.total || 0).toFixed(2)}</span>;
        const tieneAdeudo = node.data.saldo > 0.5;
        return (
            <div className="flex flex-column align-items-end">
                <span>${(node.data.total || 0).toFixed(2)}</span>
                {tieneAdeudo && <span className="text-xs text-red-500 font-bold">Resta: ${node.data.saldo.toFixed(2)}</span>}
            </div>
        );
    };

    const dateBodyTemplate = (node: TreeNode) => node.data.fecha ? new Date(node.data.fecha).toLocaleDateString('es-MX') : '';

    const actionTemplate = (node: TreeNode) => {
        if (node.data.isGroup) return null;

        const status = node.data.idEstatus;
        const isReadyForDelivery = status === 6;
        const isFinished = status === 12 || status === 11;

        return (
            <div className="flex gap-2 justify-content-center">
                <Link href={`/timeline?id=${node.data.idOrden}`} legacyBehavior>
                    <Button icon="pi pi-eye" rounded text severity="secondary" tooltip="Seguimiento" />
                </Link>

                {isReadyForDelivery && (
                    <Button icon="pi pi-check-circle" rounded text severity="success" tooltip="Entregar" onClick={() => openDeliveryDialog(node.data)} />
                )}

                {!isReadyForDelivery && !isFinished && (
                    <Button icon="pi pi-trash" rounded text severity="danger" tooltip="Cancelar" onClick={() => openCancelDialog(node.data.idOrden)} />
                )}
            </div>
        );
    };

    const hasPendingDebt = selectedOrderDebt > 0.5;

    return (
        <div className="grid">
            <Toast ref={toast} />

            {/* CONTROL DE PERIODO */}
            <div className="col-12 mb-3">
                <div className="flex justify-content-between align-items-center border-round ">
                    <h5 className="m-0 text-700">Resumen operativo</h5>
                    <div className="flex align-items-center">
                        <span className="mr-3 font-medium text-500 hidden sm:block">Período:</span>
                        <Dropdown
                            value={filtroTiempo}
                            options={filterOptions}
                            onChange={(e) => setFiltroTiempo(e.value)}
                            className="w-10rem"
                        />
                    </div>
                </div>
            </div>


            {/* TARJETAS SUPERIORES */}
            {/* Se agregó w-full y mx-0 para asegurar que abarque el 100% de la pantalla */}
            <div className="grid w-full mx-0 mb-3">

                {/* 1. TARJETA DE INGRESOS */}
                {/* Se agregaron explícitamente lg:col-4 y xl:col-4 */}
                <div className="col-12 md:col-4 lg:col-4 xl:col-4">
                    <div className="card mb-0 h-full w-full flex flex-column justify-content-between">
                        <div className="flex justify-content-between align-items-start mb-3">
                            {/* flex-1 y pr-3 evitan que el texto colisione con el icono */}
                            <div className="flex-1 pr-3">
                                <span className="block text-500 font-medium mb-2">Ingresos del periodo</span>
                                <div className="text-900 font-medium text-xl">
                                    {loadingFinanzas ? 'Cargando...' : formatCurrency(resumenTarjetas.ingresos)}
                                </div>
                            </div>
                            {/* flex-shrink-0 asegura que el icono nunca se encoja */}
                            <div className="flex align-items-center justify-content-center bg-green-100 border-round flex-shrink-0" style={{ width: '4rem', height: '4rem' }}>
                                <i className="pi pi-money-bill text-green-500 text-xl" />
                            </div>
                        </div>
                    </div>
                </div>

                {/* 2. TARJETA DE COTIZACIONES */}
                <div className="col-12 md:col-4 lg:col-4 xl:col-4">
                    <div className="card mb-0 h-full w-full flex flex-column justify-content-between">
                        <div className="flex justify-content-between align-items-start mb-3">
                            <div className="flex-1 pr-3">
                                <span className="block text-500 font-medium mb-2">Cotizaciones del periodo</span>
                                <div className="text-900 font-medium text-xl">
                                    {loadingGrafica ? 'Cargando...' : resumenTarjetas.cotizaciones}
                                </div>
                            </div>
                            <div className="flex align-items-center justify-content-center bg-purple-100 border-round flex-shrink-0" style={{ width: '4rem', height: '4rem' }}>
                                <i className="pi pi-calculator text-purple-500 text-xl" />
                            </div>
                        </div>
                    </div>
                </div>

                {/* 3. TARJETA DE ÓRDENES */}
                <div className="col-12 md:col-4 lg:col-4 xl:col-4">
                    <div className="card mb-0 h-full w-full flex flex-column justify-content-between">
                        <div className="flex justify-content-between align-items-start mb-3">
                            <div className="flex-1 pr-3">
                                <span className="block text-500 font-medium mb-2">Órdenes del periodo</span>
                                <div className="text-900 font-medium text-xl">
                                    {loadingGrafica ? 'Cargando...' : resumenTarjetas.ordenes}
                                </div>
                            </div>
                            <div className="flex align-items-center justify-content-center bg-blue-100 border-round flex-shrink-0" style={{ width: '4rem', height: '4rem' }}>
                                <i className="pi pi-shopping-cart text-blue-500 text-xl" />
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* GRÁFICAS */}
            <div className="col-12 xl:col-6 flex">
                <div className="card w-full h-full flex flex-column">
                    <div className="flex justify-content-between align-items-center mb-4">
                        <h5 className="m-0">Cotizaciones y órdenes</h5>
                    </div>
                    {loadingGrafica ? (
                        <div className="flex justify-content-center align-items-center flex-1" style={{ minHeight: '300px' }}>
                            <i className="pi pi-spin pi-spinner text-4xl text-primary"></i>
                        </div>
                    ) : (
                        <div className="flex-1 w-full">
                            <Chart type="bar" data={graficaData} options={lineOptions} className="h-full w-full" />
                        </div>
                    )}
                </div>
            </div>

            <div className="col-12 xl:col-6 flex">
                <div
                    className="card w-full h-full flex flex-column cursor-pointer hover:surface-hover transition-colors transition-duration-200"
                    onClick={() => router.push('/finance')}
                >
                    <div className="flex justify-content-between align-items-center mb-4">
                        <h5 className="m-0">Costos operativos</h5>
                        <i className="pi pi-external-link text-gray-400"></i>
                    </div>
                    {loadingFinanzas ? (
                        <div className="flex justify-content-center align-items-center flex-1" style={{ minHeight: '300px' }}>
                            <i className="pi pi-spin pi-spinner text-4xl text-primary"></i>
                        </div>
                    ) : (
                        <div className="flex-1 w-full">
                            <Chart type="line" data={graficaFinanzas} options={lineOptions} className="h-full w-full" />
                        </div>
                    )}
                </div>
            </div>

            {/* --- TABLA DE ÓRDENES DINÁMICA --- */}
            <div className="col-24 xl:col-12">
                <div className="card">
                    <div className="flex justify-content-between align-items-center mb-4">
                        <h5 className="m-0">Lista de órdenes</h5>
                        <Button icon="pi pi-refresh" rounded text onClick={() => loadOrdersLazy(first / rows, rows)} tooltip="Recargar" />
                    </div>

                    <TreeTable
                        value={orderTree}
                        className="p-treetable-sm"
                        loading={loadingTable}
                        emptyMessage="No hay órdenes activas."
                        lazy={true}
                        paginator={true}
                        first={first}
                        rows={rows}
                        totalRecords={totalRecords}
                        onPage={onPage}
                        rowsPerPageOptions={[5, 10, 20]}
                    >
                        <Column field="name" header="Referencia" expander style={{ width: '20%' }} />
                        <Column field="cliente" header="Cliente" style={{ width: '25%' }} />
                        <Column field="fecha" header="Fecha" body={dateBodyTemplate} style={{ width: '10%' }} />
                        <Column field="estatus" header="Estatus Actual" body={statusBodyTemplate} style={{ width: '25%' }} className="text-center" />
                        <Column field="total" header="Monto" body={totalBodyTemplate} style={{ width: '10%' }} className="text-right" />
                        <Column body={actionTemplate} style={{ width: '10%' }} header="Acciones" className="text-center" />
                    </TreeTable>
                </div>
            </div>

            {/* --- MODAL DE CANCELACIÓN --- */}
            <Dialog
                header={<div className="flex align-items-center gap-2 text-red-700"><i className="pi pi-ban text-xl" /><span className="font-bold">Confirmar Cancelación</span></div>}
                visible={showCancelDialog}
                style={{ width: '100%', maxWidth: '500px' }}
                modal
                onHide={() => setShowCancelDialog(false)}
                footer={
                    <div className="flex justify-content-end gap-2 pt-2">
                        <Button label="Volver" icon="pi pi-arrow-left" onClick={() => setShowCancelDialog(false)} className="p-button-text p-button-secondary" />
                        <Button label="Confirmar cancelación" icon="pi pi-trash" onClick={confirmCancellation} severity="danger" loading={isCancelling} disabled={!selectedReason} />
                    </div>
                }
            >
                <div className="flex flex-column gap-4 pt-2">
                    <div className="flex flex-column gap-2 p-3 border-1 border-red-200 bg-red-50 border-round">
                        <div className="flex align-items-center gap-2 text-red-800 font-bold"><i className="pi pi-exclamation-triangle" /><span>Acción irreversible</span></div>
                        <p className="m-0 text-sm text-red-700">La orden pasará a estar <strong>&quot;Cancelada&quot;</strong>. <strong>No hay reembolsos.</strong></p>
                    </div>
                    <div className="field">
                        <label htmlFor="razon" className="font-bold block mb-2 text-900">¿Cuál es el motivo de la cancelación?</label>
                        <Dropdown id="razon" value={selectedReason} onChange={(e) => setSelectedReason(e.value)} options={cancelReasons} optionLabel="descripcion" optionValue="idRazon" placeholder="Selecciona una razón" className="w-full" />
                    </div>
                </div>
            </Dialog>

            {/* --- MODAL DE ENTREGA --- */}
            <Dialog
                header={
                    <div className={`flex align-items-center gap-2 ${hasPendingDebt ? 'text-red-600' : 'text-green-700'}`}>
                        <i className={`pi ${hasPendingDebt ? 'pi-exclamation-circle' : 'pi-check-circle'} text-xl`} />
                        <span className="font-bold">{hasPendingDebt ? '¡Orden con Adeudo!' : 'Confirmar Entrega'}</span>
                    </div>
                }
                visible={showDeliveryDialog}
                style={{ width: '100%', maxWidth: '450px' }}
                modal
                onHide={() => setShowDeliveryDialog(false)}
                footer={
                    <div className="flex justify-content-end gap-2 pt-2">
                        <Button label={hasPendingDebt ? "Cerrar" : "Cancelar"} icon="pi pi-times" onClick={() => setShowDeliveryDialog(false)} className="p-button-text" />
                        {!hasPendingDebt && <Button label="Entregar Orden" icon="pi pi-check" onClick={confirmDelivery} severity="success" loading={isDelivering} />}
                        {hasPendingDebt && (
                            <Link href="/counter" passHref legacyBehavior>
                                <Button label="Ir a Caja" icon="pi pi-wallet" severity="warning" />
                            </Link>
                        )}
                    </div>
                }
            >
                {hasPendingDebt ? (
                    <div className="pt-2 text-center">
                        <div className="inline-flex align-items-center justify-content-center bg-red-100 border-circle mb-3" style={{ width: '64px', height: '64px' }}>
                            <i className="pi pi-wallet text-red-500 text-3xl"></i>
                        </div>
                        <h3 className="text-red-700 m-0 mb-2">Pago Pendiente</h3>
                        <p className="m-0 text-lg mb-3">Esta orden tiene un saldo pendiente de:<br /><strong className="text-2xl text-900">${selectedOrderDebt.toFixed(2)}</strong></p>
                        <p className="text-sm text-600">No es posible entregar la mercancía hasta que el saldo sea liquidado en su totalidad.</p>
                    </div>
                ) : (
                    <div className="pt-2">
                        <p className="m-0 text-lg">¿Confirmas que el cliente ha recibido sus productos satisfactoriamente?</p>
                        <small className="text-500 block mt-2">La orden pasará al estatus &quot;Entregada&quot; y se archivará como completada.</small>
                    </div>
                )}
            </Dialog>
        </div>
    );
};

export default Dashboard;