/* eslint-disable @next/next/no-img-element */
'use client';
import React, { useState, useEffect } from 'react';
import { TreeTable } from 'primereact/treetable';
import { TreeNode } from 'primereact/treenode';
import { Column } from 'primereact/column';

const dummyOrders = [
    { id: 'ORD-001', cliente: 'Juan Pérez', total: 1250.00, estatus: 'En diseño', designer: 'Juan Pérez' },
    { id: 'ORD-002', cliente: 'Sofía Herrera', total: 980.50, estatus: 'En impresión', designer: 'Ana Torres' },
    { id: 'ORD-003', cliente: 'Carlos Ramírez', total: 1575.75, estatus: 'En diseño', designer: 'Carlos Ramírez' },
    { id: 'ORD-004', cliente: 'Luisa Gómez', total: 640.20, estatus: 'En impresión', designer: 'Luisa Gómez' },
    { id: 'ORD-005', cliente: 'Mario Sánchez', total: 2100.00, estatus: 'En diseño', designer: 'Mario Sánchez' },
    { id: 'ORD-006', cliente: 'Laura Fernández', total: 850.90, estatus: 'En impresión', designer: 'Sofía Herrera' },
    { id: 'ORD-007', cliente: 'Diego Martínez', total: 1325.40, estatus: 'En diseño', designer: 'Diego Martínez' },
    { id: 'ORD-008', cliente: 'Sofía Herrera', total: 1720.80, estatus: 'En impresión', designer: 'Sofía Herrera' }
];

const ListQuotePage = () => {
    const [quoteTree, setQuoteTree] = useState<TreeNode[]>([]);

    useEffect(() => {
        const transformToTree = (items: any[]) => {
            const groups = new Map<string, any[]>();

            items.forEach(item => {
                if (!groups.has(item.designer)) {
                    groups.set(item.designer, []);
                }
                groups.get(item.designer)?.push(item);
            });

            return Array.from(groups.entries()).map(([designerName, childrenItems], index) => ({
                key: `designer-${index}`,
                data: {
                    name: designerName,
                    cliente: '',
                    total: null,
                    estatus: ''
                },
                children: childrenItems.map(item => ({
                    key: item.id,
                    data: {
                        name: item.id,
                        cliente: item.cliente,
                        total: item.total,
                        estatus: item.estatus
                    }
                }))
            }));
        };

        setQuoteTree(transformToTree(dummyOrders));

    }, []);

    const treeTotalBodyTemplate = (node: TreeNode) => {
        if (node.data && node.data.total !== null) {
            return `$${node.data.total.toFixed(2)}`;
        }
        return '';
    };


    return (
        <div className="card">
            <div className="flex justify-content-between align-items-center">
                <h2>Lista de Ordenes</h2>
            </div>

            <TreeTable
                value={quoteTree}
                paginator
                rows={10}
                rowsPerPageOptions={[5, 10, 25]}
                className="mt-4"
            >
                <Column field="name" header="Diseñador / Clave" expander style={{ width: '30%' }} />
                <Column field="cliente" header="Cliente" style={{ width: '30%' }} />
                <Column field="total" header="Total" body={treeTotalBodyTemplate} style={{ width: '20%' }} />
                <Column field="estatus" header="Estatus" style={{ width: '20%' }} />
            </TreeTable>
        </div>
    );
};

export default ListQuotePage;