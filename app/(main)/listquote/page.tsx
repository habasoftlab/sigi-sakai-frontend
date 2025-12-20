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

const ListQuotePage = () => {
    const [quoteTree, setQuoteTree] = useState<TreeNode[]>([]);
    const [loading, setLoading] = useState(true);

    // Paginación
    const [first, setFirst] = useState(0);
    const [rows, setRows] = useState(10);
    const [totalRecords, setTotalRecords] = useState(0);

    // Mapas para búsqueda rápida { id: "Nombre" }
    const [designerMap, setDesignerMap] = useState<Record<number, string>>({});
    const [clientMap, setClientMap] = useState<Record<number, string>>({});

    const toast = useRef<Toast>(null);

    useEffect(() => {
        const initData = async () => {
            setLoading(true);
            try {
                const [designers, clients] = await Promise.all([
                    UserService.getDesigners(),
                    ClientService.getAll()
                ]);
                const dMap: Record<number, string> = {};
                designers.forEach((d: any) => {
                    dMap[d.idUsuario || d.id] = d.nombre;
                });
                setDesignerMap(dMap);
                const cMap: Record<number, string> = {};
                clients.forEach((c: any) => {
                    if (c.id) cMap[c.id] = c.nombre;
                });
                setClientMap(cMap);

                await loadQuotesLazy(0, rows, dMap, cMap);

            } catch (error) {
                console.error("Error inicializando:", error);
                toast.current?.show({ severity: 'error', summary: 'Error', detail: 'Fallo al cargar catálogos iniciales' });
            } finally {
                setLoading(false);
            }
        };

        initData();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const loadQuotesLazy = async (
        pageIndex: number,
        pageSize: number,
        currentDMap?: Record<number, string>,
        currentCMap?: Record<number, string>
    ) => {
        setLoading(true);
        try {
            const response = await OrderService.getCotizacionesYCanceladas(pageIndex, pageSize);
            const listaOrdenes = response.content || response;
            const totalEnBackend = response.totalElements || 0;
            const cotizaciones = listaOrdenes;

            const dMapToUse = currentDMap || designerMap;
            const cMapToUse = currentCMap || clientMap;

            const treeData = transformToTree(cotizaciones, dMapToUse, cMapToUse);

            setQuoteTree(treeData);
            setTotalRecords(totalEnBackend);
        } catch (error) {
            console.error("Error cargando cotizaciones:", error);
            toast.current?.show({ severity: 'error', summary: 'Error', detail: 'No se pudieron cargar las cotizaciones' });
        } finally {
            setLoading(false);
        }
    };

    const onPage = (event: TreeTablePageEvent) => {
        setFirst(event.first);
        setRows(event.rows);
        const newPage = event.first / event.rows;
        loadQuotesLazy(newPage, event.rows);
    };

    const transformToTree = (
        items: any[],
        dMap: Record<number, string>,
        cMap: Record<number, string>
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
                    cliente: `${childrenItems.length} registros`,
                    fecha: '',
                    total: totalDesigner,
                    estatus: 'GROUP',
                    isGroup: true
                },
                children: childrenItems.map(item => {
                    let clientLabel = 'Público General';
                    if (item.clienteNombre) {
                        clientLabel = item.clienteNombre;
                    }
                    else if (item.idCliente) {
                        clientLabel = cMap[item.idCliente] || `Cliente #${item.idCliente}`;
                    }
                    const tipoDoc = item.idEstatusActual === 11 ? 'Cancelada' : 'Cotización';
                    return {
                        key: item.idOrden.toString(),
                        data: {
                            idOrden: item.idOrden,
                            name: `${tipoDoc} #${item.idOrden}`,
                            cliente: clientLabel,
                            fecha: item.fechaCreacion,
                            total: item.montoTotal,
                            estatus: item.idEstatusActual,
                            isGroup: false
                        }
                    };
                })
            };
        });
    };

    const totalBodyTemplate = (node: TreeNode) => <span className={node.data.isGroup ? "font-bold text-lg" : ""}>${(node.data.total || 0).toFixed(2)}</span>;

    const statusBodyTemplate = (node: TreeNode) => {
        if (node.data.isGroup) return null;

        switch (node.data.estatus) {
            case 11: // Cancelada
                return <Tag severity="danger" value="Cancelada" icon="pi pi-times" />;
            case 1: // Cotización Iniciada
                return <Tag severity="warning" value="Cotización" icon="pi pi-file" />;
            default:
                return <Tag severity="info" value="Registrado" icon="pi pi-info-circle" />;
        }
    };

    const dateBodyTemplate = (node: TreeNode) => {
        if (node.data.isGroup || !node.data.fecha) return '';
        return new Date(node.data.fecha).toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric' });
    };

    return (
        <div className="card">
            <Toast ref={toast} />
            <div className="flex justify-content-between align-items-center mb-4">
                <div>
                    <h2 className="m-0">Lista de cotizaciones</h2>
                    <span className="text-gray-500 text-sm">Agrupadas por diseñador asignado</span>
                </div>
                <div className="flex gap-2">
                    <Button icon="pi pi-refresh" rounded text onClick={() => loadQuotesLazy(first / rows, rows)} />
                    <Link href="/counter" passHref legacyBehavior>
                        <a className="p-button p-component p-button-outlined p-button-secondary">
                            <i className="pi pi-arrow-left mr-2"></i>Volver
                        </a>
                    </Link>
                </div>
            </div>

            <TreeTable
                value={quoteTree}
                className="p-treetable-sm"
                loading={loading}
                emptyMessage="No se encontraron cotizaciones en esta página."
                lazy={true}
                paginator={true}
                first={first}
                rows={rows}
                totalRecords={totalRecords}
                onPage={onPage}
                rowsPerPageOptions={[5, 10, 20]}
            >
                <Column field="name" header="Referencia" expander style={{ width: '30%' }} />
                <Column field="cliente" header="Cliente" style={{ width: '25%' }} />
                <Column field="fecha" header="Fecha" body={dateBodyTemplate} style={{ width: '15%' }} />
                <Column field="total" header="Monto Total" body={totalBodyTemplate} style={{ width: '15%' }} />
                <Column field="estatus" header="Estatus" body={statusBodyTemplate} style={{ width: '10%' }} className="text-center" />
            </TreeTable>
        </div>
    );
};

export default ListQuotePage;