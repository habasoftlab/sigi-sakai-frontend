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

    // Mapas para visualización rápida
    const [designerMap, setDesignerMap] = useState<Record<number, string>>({});
    const [clientMap, setClientMap] = useState<Record<number, string>>({});
    const [statusMap, setStatusMap] = useState<Record<number, string>>({});

    const toast = useRef<Toast>(null);

    useEffect(() => {
        const initData = async () => {
            setLoading(true);
            try {
                const [designers, clients, statuses] = await Promise.all([
                    UserService.getDesigners(),
                    ClientService.getAll(),
                    OrderService.getEstatusOperaciones()
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

                // Carga inicial de datos
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
            const totalEnBackend = response.totalElements || 0;
            const ordenesReales = listaOrdenes;

            const dMapToUse = currentDMap || designerMap;
            const cMapToUse = currentCMap || clientMap;
            const sMapToUse = currentSMap || statusMap;

            const treeData = transformToTree(ordenesReales, dMapToUse, cMapToUse, sMapToUse);

            setOrderTree(treeData);
            setTotalRecords(totalEnBackend);
        } catch (error) {
            console.error("Error cargando ordenes:", error);
            toast.current?.show({ severity: 'error', summary: 'Error', detail: 'No se pudieron cargar las órdenes' });
        } finally {
            setLoading(false);
        }
    };

    const onPage = (event: TreeTablePageEvent) => {
        setFirst(event.first);
        setRows(event.rows);
        const newPage = event.first / event.rows;
        loadOrdersLazy(newPage, event.rows);
    };

    const transformToTree = (
        items: any[],
        dMap: Record<number, string>,
        cMap: Record<number, string>,
        sMap: Record<number, string>
    ) => {
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

    const getSeverity = (statusId: number): "success" | "info" | "warning" | "danger" | null => {
        switch (statusId) {
            case 1: return 'warning';
            case 2: return 'info';
            case 3:
            case 4: return 'info';
            case 5: return 'warning';
            case 6: return 'success';
            case 7:
            case 8: return 'warning';
            case 9: return 'success';
            case 10: return 'danger';
            case 11: return 'danger';
            case 12: return null;
            default: return 'info';
        }
    };

    const statusBodyTemplate = (node: TreeNode) => {
        if (node.data.isGroup) return null;

        return (
            <Tag
                severity={getSeverity(node.data.idEstatus)}
                value={node.data.estatusNombre}
                icon="pi pi-cog"
                style={{ width: '100%', maxWidth: '200px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}
            />
        );
    };

    const totalBodyTemplate = (node: TreeNode) => <span className={node.data.isGroup ? "font-bold text-lg" : ""}>${(node.data.total || 0).toFixed(2)}</span>;

    const dateBodyTemplate = (node: TreeNode) => {
        if (node.data.isGroup || !node.data.fecha) return '';
        return new Date(node.data.fecha).toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric' });
    };

    const actionTemplate = (node: TreeNode) => {
        if (node.data.isGroup) return null;
        return (
            <Link href={`/timeline?id=${node.data.idOrden}`} legacyBehavior>
                <Button icon="pi pi-eye" rounded text severity="secondary" tooltip="Ver Detalles / Seguimiento" />
            </Link>
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
                emptyMessage="No hay órdenes activas en esta página."
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
    );
};

export default ListOrderPage;