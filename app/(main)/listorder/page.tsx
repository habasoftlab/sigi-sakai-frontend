/* eslint-disable @next/next/no-img-element */
'use client';
import React, { useState, useEffect, useRef } from 'react';
import { TreeTable, TreeTablePageEvent } from 'primereact/treetable';
import { TreeNode } from 'primereact/treenode';
import { Column } from 'primereact/column';
import Link from 'next/link';
import { Tag } from 'primereact/tag';
import { Button } from 'primereact/button';
import { Toast } from 'primereact/toast';
import { Dialog } from 'primereact/dialog';
import { Dropdown } from 'primereact/dropdown';

// Servicios
import { OrderService } from '@/app/service/orderService';
import { UserService } from '@/app/service/userService';
import { ClientService } from '@/app/service/clientService';

const ListOrderPage = () => {
    // Datos y Loading
    const [orderTree, setOrderTree] = useState<TreeNode[]>([]);
    const [loading, setLoading] = useState(true);

    // Paginación
    const [first, setFirst] = useState(0);
    const [rows, setRows] = useState(10);
    const [totalRecords, setTotalRecords] = useState(0);

    // Mapas para visualización
    const [designerMap, setDesignerMap] = useState<Record<number, string>>({});
    const [clientMap, setClientMap] = useState<Record<number, string>>({});
    const [statusMap, setStatusMap] = useState<Record<number, string>>({});

    // --- ESTADOS PARA CANCELACIÓN ---
    const [cancelReasons, setCancelReasons] = useState<any[]>([]);
    const [showCancelDialog, setShowCancelDialog] = useState(false);
    const [selectedOrderToCancel, setSelectedOrderToCancel] = useState<number | null>(null);
    const [selectedReason, setSelectedReason] = useState<number | null>(null);
    const [isCancelling, setIsCancelling] = useState(false);

    // --- NUEVO: ESTADOS PARA ENTREGA ---
    const [showDeliveryDialog, setShowDeliveryDialog] = useState(false);
    const [selectedOrderToDeliver, setSelectedOrderToDeliver] = useState<number | null>(null);
    const [isDelivering, setIsDelivering] = useState(false);

    const toast = useRef<Toast>(null);

    useEffect(() => {
        const initData = async () => {
            setLoading(true);
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
                console.error("Error inicializando:", error);
                toast.current?.show({ severity: 'error', summary: 'Error', detail: 'Fallo al cargar catálogos' });
            } finally {
                setLoading(false);
            }
        };
        initData();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const loadOrdersLazy = async (
        pageIndex: number,
        pageSize: number,
        currentDMap?: Record<number, string>,
        currentCMap?: Record<number, string>,
        currentSMap?: Record<number, string>
    ) => {
        setLoading(true);
        try {
            const response = await OrderService.getOrdenesActivas(pageIndex, pageSize);
            const listaOrdenes = response.content || response;
            const totalEnBackend = response.page?.totalElements
                || response.totalElements
                || listaOrdenes.length;

            const dMapToUse = currentDMap || designerMap;
            const cMapToUse = currentCMap || clientMap;
            const sMapToUse = currentSMap || statusMap;

            const treeData = transformToTree(listaOrdenes, dMapToUse, cMapToUse, sMapToUse);
            setOrderTree(treeData);
            setTotalRecords(totalEnBackend);
        } catch (error) {
            console.error("Error cargando ordenes:", error);
            toast.current?.show({ severity: 'error', summary: 'Error', detail: 'No se pudieron cargar las órdenes' });
        } finally {
            setLoading(false);
        }
    };

    // --- LÓGICA DE CANCELACIÓN ---
    const openCancelDialog = (idOrden: number) => {
        setSelectedOrderToCancel(idOrden);
        setSelectedReason(null);
        setShowCancelDialog(true);
    };

    const confirmCancellation = async () => {
        if (!selectedOrderToCancel || !selectedReason) {
            toast.current?.show({ severity: 'warn', summary: 'Atención', detail: 'Debes seleccionar una razón de cancelación' });
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

    // --- LÓGICA DE ENTREGA ---
    const openDeliveryDialog = (idOrden: number) => {
        setSelectedOrderToDeliver(idOrden);
        setShowDeliveryDialog(true);
    };

    const confirmDelivery = async () => {
        if (!selectedOrderToDeliver) return;

        const userStr = localStorage.getItem('user');
        const currentUserId = userStr ? JSON.parse(userStr).idUsuario : null;

        if (!currentUserId) return;

        setIsDelivering(true);
        try {
            await OrderService.avanzarEstatus(selectedOrderToDeliver, {
                idUsuario: currentUserId,
                idEstatusDestino: 12,
                clienteAprobo: true
            });
            
            toast.current?.show({ severity: 'success', summary: 'Entregada', detail: 'La orden se ha marcado como entregada correctamente.' });
            setShowDeliveryDialog(false);
            loadOrdersLazy(first / rows, rows);
        } catch (error: any) {
            console.error(error);
            toast.current?.show({ severity: 'error', summary: 'Error', detail: 'No se pudo registrar la entrega.' });
        } finally {
            setIsDelivering(false);
        }
    };

    const onPage = (event: TreeTablePageEvent) => {
        setFirst(event.first);
        setRows(event.rows);
        const newPage = event.first / event.rows;
        loadOrdersLazy(newPage, event.rows);
    };

    const transformToTree = (items: any[], dMap: any, cMap: any, sMap: any) => {
        const groups = new Map<string, any[]>();
        items.forEach(item => {
            let designerLabel = 'Sin Asignar / Mostrador';
            if (item.idUsuarioDisenador) {
                designerLabel = dMap[item.idUsuarioDisenador] || `Diseñador ID: ${item.idUsuarioDisenador}`;
            }
            if (!groups.has(designerLabel)) {
                groups.set(designerLabel, []);
            }
            groups.get(designerLabel)?.push(item);
        });

        return Array.from(groups.entries()).map(([designerName, childrenItems], index) => {
            const totalDesigner = childrenItems.reduce((acc, curr) => acc + (curr.montoTotal || 0), 0);
            return {
                key: `group-${index}`,
                data: {
                    name: designerName,
                    cliente: `${childrenItems.length} órdenes`,
                    fecha: '',
                    total: totalDesigner,
                    estatus: 'GROUP',
                    isGroup: true
                },
                children: childrenItems.map(item => {
                    let clientLabel = item.clienteNombre || (item.idCliente ? (cMap[item.idCliente] || `Cliente #${item.idCliente}`) : 'Público General');
                    const statusLabel = sMap[item.idEstatusActual] || `Estatus ${item.idEstatusActual}`;
                    return {
                        key: item.idOrden.toString(),
                        data: {
                            idOrden: item.idOrden,
                            name: `Orden #${item.idOrden}`,
                            cliente: clientLabel,
                            fecha: item.fechaCreacion,
                            total: item.montoTotal,
                            idEstatus: item.idEstatusActual,
                            estatusNombre: statusLabel,
                            isGroup: false
                        }
                    };
                })
            };
        });
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
        return (
            <Tag value={node.data.estatusNombre} icon={style.icon} style={{ backgroundColor: style.bg, color: style.color }} />
        );
    };

    const totalBodyTemplate = (node: TreeNode) => <span className={node.data.isGroup ? "font-bold text-lg" : ""}>${(node.data.total || 0).toFixed(2)}</span>;
    const dateBodyTemplate = (node: TreeNode) => node.data.fecha ? new Date(node.data.fecha).toLocaleDateString('es-MX') : '';

    // --- TEMPLATE DE ACCIONES ---
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

                {/* BOTÓN DE ENTREGA (Solo visible si está lista) */}
                {isReadyForDelivery && (
                    <Button
                        icon="pi pi-check-circle"
                        rounded
                        text
                        severity="success"
                        tooltip="Marcar como Entregada"
                        onClick={() => openDeliveryDialog(node.data.idOrden)}
                    />
                )}

                {/* BOTÓN DE CANCELAR (Solo si NO está lista para entrega y NO está finalizada) */}
                {!isReadyForDelivery && !isFinished && (
                    <Button
                        icon="pi pi-trash"
                        rounded
                        text
                        severity="danger"
                        tooltip="Cancelar Orden"
                        onClick={() => openCancelDialog(node.data.idOrden)}
                    />
                )}
            </div>
        );
    };

    return (
        <div className="card">
            <Toast ref={toast} />
            <div className="flex justify-content-between align-items-center mb-4">
                <div>
                    <h2 className="m-0">Lista de ordenes</h2>
                    <span className="text-gray-500 text-sm">Agrupadas por diseñador asignado</span>
                </div>
                <div className="flex gap-2">
                    <Button icon="pi pi-refresh" rounded text onClick={() => loadOrdersLazy(first / rows, rows)} tooltip="Recargar" />
                    <Link href="/counter" passHref legacyBehavior>
                        <a className="p-button p-component p-button-outlined p-button-secondary">
                            <i className="pi pi-arrow-left mr-2"></i>Volver
                        </a>
                    </Link>
                </div>
            </div>

            <TreeTable
                value={orderTree}
                className="p-treetable-sm"
                loading={loading}
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

            {/* --- VENTANA DE CANCELACIÓN --- */}
            <Dialog
                header={
                    <div className="flex align-items-center gap-2 text-red-700">
                        <i className="pi pi-ban text-xl" />
                        <span className="font-bold">Confirmar Cancelación</span>
                    </div>
                }
                visible={showCancelDialog}
                style={{ width: '100%', maxWidth: '500px' }}
                modal
                onHide={() => setShowCancelDialog(false)}
                focusOnShow={false}
                footer={
                    <div className="flex justify-content-end gap-2 pt-2">
                        <Button
                            label="Volver"
                            icon="pi pi-arrow-left"
                            onClick={() => setShowCancelDialog(false)}
                            className="p-button-text p-button-secondary"
                        />
                        <Button
                            label="Confirmar cancelación"
                            icon="pi pi-trash"
                            onClick={confirmCancellation}
                            severity="danger"
                            loading={isCancelling}
                            disabled={!selectedReason}
                        />
                    </div>
                }
            >
                <div className="flex flex-column gap-4 pt-2">
                    <div className="flex flex-column gap-2 p-3 border-1 border-red-200 bg-red-50 border-round">
                        <div className="flex align-items-center gap-2 text-red-800 font-bold">
                            <i className="pi pi-exclamation-triangle" />
                            <span>Acción irreversible</span>
                        </div>
                        <p className="m-0 text-sm text-red-700">
                            La orden pasará a estar <strong>"Cancelada"</strong>.
                            <strong> No hay reembolsos.</strong>
                        </p>
                    </div>

                    <div className="field">
                        <label htmlFor="razon" className="font-bold block mb-2 text-900">
                            ¿Cuál es el motivo de la cancelación?
                        </label>
                        <Dropdown
                            id="razon"
                            value={selectedReason}
                            onChange={(e) => setSelectedReason(e.value)}
                            options={cancelReasons}
                            optionLabel="descripcion"
                            optionValue="idRazon"
                            placeholder="Selecciona una razón"
                            className="w-full"
                            scrollHeight="300px"
                            showClear
                        />
                    </div>
                </div>
            </Dialog>

            {/* --- VENTANA DE ENTREGA (NUEVO) --- */}
            <Dialog
                header={
                    <div className="flex align-items-center gap-2 text-green-700">
                        <i className="pi pi-check-circle text-xl" />
                        <span className="font-bold">Confirmar Entrega</span>
                    </div>
                }
                visible={showDeliveryDialog}
                style={{ width: '100%', maxWidth: '450px' }}
                modal
                onHide={() => setShowDeliveryDialog(false)}
                footer={
                    <div className="flex justify-content-end gap-2 pt-2">
                        <Button
                            label="Cancelar"
                            icon="pi pi-times"
                            onClick={() => setShowDeliveryDialog(false)}
                            className="p-button-text"
                        />
                        <Button
                            label="Entregar Orden"
                            icon="pi pi-check"
                            onClick={confirmDelivery}
                            severity="success"
                            loading={isDelivering}
                        />
                    </div>
                }
            >
                <div className="pt-2">
                    <p className="m-0 text-lg">
                        ¿Confirmas que el cliente ha recibido sus productos satisfactoriamente?
                    </p>
                    <small className="text-500 block mt-2">
                        La orden pasará al estatus "Entregada" y se archivará como completada.
                    </small>
                </div>
            </Dialog>
        </div>
    );
};

export default ListOrderPage;