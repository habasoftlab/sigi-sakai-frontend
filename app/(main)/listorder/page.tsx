/* eslint-disable @next/next/no-img-element */
'use client';
import React, { useState, useEffect } from 'react';
import { TreeTable } from 'primereact/treetable';
import { TreeNode } from 'primereact/treenode';
import { Column } from 'primereact/column';
import { dummyOrders } from '@/app/api/mockData';

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