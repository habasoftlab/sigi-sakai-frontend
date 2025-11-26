export interface QuoteItem {
    id: string;
    descripcion: string;
    costo: number;
    cantidad: number;
    importe: number;
}

// --- NUEVA INTERFAZ MATERIAL ---
export interface Material {
    name: string;
    amount: string;
}

export interface Product {
    id: string;
    name: string;
    pricePerUnit: number | null;
    pricePerPackage: number | null;
    packageSize: number | null;
    productionTime: string;
    format: string;
    saleUnit: string;
    minOrder: number;
    volumeDiscount: number;
    materials?: Material[]; // <-- NUEVO CAMPO
}

export interface NewClient {
    name: string;
    email: string;
    phone: string;
    rfc: string;
    cfdi: string;
    regimenFiscal: string;
    cp: string;
}

// --- CATÁLOGO CON MATERIALES ---
export const allProducts: Product[] = [
    {
        id: 'PRD-001A',
        name: 'Tarjetas básicas (couché 300g, 1 cara)',
        pricePerUnit: 1.8, pricePerPackage: 180, packageSize: 100, productionTime: '2 días', format: '9x5 cm', saleUnit: 'Paquete (100)', minOrder: 100, volumeDiscount: 1000,
        materials: [
            { name: 'Papel Couché 300g', amount: 'Variable (según millar)' }
        ]
    },
    {
        id: 'PRD-001B',
        name: 'Tarjetas estándar (2 caras, laminado mate)',
        pricePerUnit: 2.2, pricePerPackage: 220, packageSize: 100, productionTime: '3 días', format: '9x5 cm', saleUnit: 'Paquete (100)', minOrder: 100, volumeDiscount: 1000,
        materials: [
            { name: 'Papel Couché 300g', amount: 'Variable' }
        ]
    },
    {
        id: 'PRD-014',
        name: 'Playeras sublimadas',
        pricePerUnit: 130, pricePerPackage: null, packageSize: null, productionTime: '4 días', format: 'S, M, L, XL', saleUnit: 'Unidad', minOrder: 1, volumeDiscount: 50,
        materials: [
            { name: 'Playera Poliéster', amount: '1 pieza' }
        ]
    },
    {
        id: 'PRD-015',
        name: 'Tazas sublimadas',
        pricePerUnit: 90, pricePerPackage: null, packageSize: null, productionTime: '3 días', format: '11 oz', saleUnit: 'Unidad', minOrder: 1, volumeDiscount: 50,
        materials: [
            { name: 'Taza Cerámica 11oz', amount: '1 pieza' }
        ]
    },
    // ... (se pueden añadir materiales al resto de productos si es necesario)
    { id: 'PRD-002A', name: 'Hojas membretadas básicas (bond 90g, B/N)', pricePerUnit: 1.5, pricePerPackage: 750, packageSize: 500, productionTime: '2 días', format: 'Carta', saleUnit: 'Paquete (500)', minOrder: 500, volumeDiscount: 2000 },
    { id: 'PRD-002B', name: 'Hojas membretadas color (bond 90g, full color)', pricePerUnit: 1.8, pricePerPackage: 900, packageSize: 500, productionTime: '3 días', format: 'Carta', saleUnit: 'Paquete (500)', minOrder: 500, volumeDiscount: 2000 },
    { id: 'PRD-002C', name: 'Hojas premium (opalina, watermark)', pricePerUnit: 2.0, pricePerPackage: 1000, packageSize: 500, productionTime: '4 días', format: 'Carta', saleUnit: 'Paquete (500)', minOrder: 500, volumeDiscount: 2000 },
    { id: 'PRD-003A', name: 'Sobres estándar (carta, sin ventana)', pricePerUnit: 2.0, pricePerPackage: 1000, packageSize: 500, productionTime: '3 días', format: 'Carta', saleUnit: 'Paquete (500)', minOrder: 500, volumeDiscount: 2000 },
    { id: 'PRD-003B', name: 'Sobres personalizados (oficio, con ventana)', pricePerUnit: 2.5, pricePerPackage: 1250, packageSize: 500, productionTime: '3 días', format: 'Oficio', saleUnit: 'Paquete (500)', minOrder: 500, volumeDiscount: 2000 },
    { id: 'PRD-003C', name: 'Sobres premium (full color, adhesivo siliconado)', pricePerUnit: 3.0, pricePerPackage: 1500, packageSize: 500, productionTime: '4 días', format: 'Oficio/Carta', saleUnit: 'Paquete (500)', minOrder: 500, volumeDiscount: 2000 },
    { id: 'PRD-004A', name: 'Folder estándar (sin solapas, impresión 1 cara)', pricePerUnit: 15, pricePerPackage: 1500, packageSize: 100, productionTime: '3 días', format: 'Carta', saleUnit: 'Paquete (100)', minOrder: 100, volumeDiscount: 1000 },
    { id: 'PRD-004B', name: 'Folder corporativo (con solapa y bolsillo)', pricePerUnit: 18, pricePerPackage: 1800, packageSize: 100, productionTime: '4 días', format: 'Carta', saleUnit: 'Paquete (100)', minOrder: 100, volumeDiscount: 1000 },
    { id: 'PRD-005A', name: 'Volantes económicos (couché 130g, 1 cara)', pricePerUnit: 0.8, pricePerPackage: 800, packageSize: 1000, productionTime: '2 días', format: 'Carta', saleUnit: 'Millar', minOrder: 1000, volumeDiscount: 5000 },
    { id: 'PRD-005B', name: 'Volantes estándar (couché 150g, 2 caras)', pricePerUnit: 0.9, pricePerPackage: 900, packageSize: 1000, productionTime: '3 días', format: 'Carta', saleUnit: 'Millar', minOrder: 1000, volumeDiscount: 5000 },
    { id: 'PRD-006A', name: 'Díptico estándar (couché 150g, doblado en U)', pricePerUnit: 1.5, pricePerPackage: 1500, packageSize: 1000, productionTime: '3 días', format: 'Carta', saleUnit: 'Millar', minOrder: 1000, volumeDiscount: 5000 },
    { id: 'PRD-006B', name: 'Tríptico estándar (couché 150g, doblado en Z)', pricePerUnit: 1.7, pricePerPackage: 1700, packageSize: 1000, productionTime: '4 días', format: 'Carta', saleUnit: 'Millar', minOrder: 1000, volumeDiscount: 5000 },
    { id: 'PRD-007A', name: 'Póster económico (bond, 1 cara)', pricePerUnit: 12, pricePerPackage: 1200, packageSize: 100, productionTime: '2 días', format: 'Tabloide', saleUnit: 'Paquete (100)', minOrder: 100, volumeDiscount: 500 },
    { id: 'PRD-007B', name: 'Póster estándar (couché 150g, color)', pricePerUnit: 14, pricePerPackage: 1400, packageSize: 100, productionTime: '3 días', format: 'Tabloide', saleUnit: 'Paquete (100)', minOrder: 100, volumeDiscount: 500 },
    { id: 'PRD-007C', name: 'Póster premium (couché 200g, laminado brillante)', pricePerUnit: 15, pricePerPackage: 1500, packageSize: 100, productionTime: '4 días', format: 'Tabloide', saleUnit: 'Paquete (100)', minOrder: 100, volumeDiscount: 500 },
    { id: 'PRD-008', name: 'Catálogos / Revistas (20 págs.)', pricePerUnit: 60, pricePerPackage: 3000, packageSize: 50, productionTime: '5 días', format: 'Carta', saleUnit: 'Lote (50)', minOrder: 50, volumeDiscount: 200 },
    { id: 'PRD-009', name: 'Lonas publicitarias', pricePerUnit: 120, pricePerPackage: null, packageSize: null, productionTime: '2 días', format: '1x1 m', saleUnit: 'Unidad', minOrder: 1, volumeDiscount: 10 },
    { id: 'PRD-009A', name: 'Lonas publicitarias grandes', pricePerUnit: null, pricePerPackage: 150, packageSize: null, productionTime: '6 días', format: 'Personalizado', saleUnit: 'm²', minOrder: 1, volumeDiscount: 10 },
    { id: 'PRD-010', name: 'Vinil adhesivo', pricePerUnit: null, pricePerPackage: 150, packageSize: null, productionTime: '2 días', format: 'Personalizado', saleUnit: 'm²', minOrder: 1, volumeDiscount: 10 },
    { id: 'PRD-011', name: 'Bolsas de papel impresas', pricePerUnit: 20, pricePerPackage: 2000, packageSize: 100, productionTime: '5 días', format: 'Personalizado', saleUnit: 'Paquete (100)', minOrder: 100, volumeDiscount: 500 },
    { id: 'PRD-012', name: 'Calendarios de escritorio', pricePerUnit: 20, pricePerPackage: 2000, packageSize: 100, productionTime: '5 días', format: '15x20 cm', saleUnit: 'Paquete (100)', minOrder: 100, volumeDiscount: 500 },
    { id: 'PRD-013', name: 'Calendarios de pared', pricePerUnit: 30, pricePerPackage: 3000, packageSize: 100, productionTime: '5 días', format: 'Carta/Tabloide', saleUnit: 'Paquete (100)', minOrder: 100, volumeDiscount: 500 },
    { id: 'PRD-016', name: 'Libros tapa blanda (200 págs.)', pricePerUnit: 200, pricePerPackage: 10000, packageSize: 50, productionTime: '7 días', format: 'Carta', saleUnit: 'Lote (50)', minOrder: 50, volumeDiscount: 200 },
    { id: 'PRD-017', name: 'Libros tapa dura (200 págs.)', pricePerUnit: 220, pricePerPackage: 11000, packageSize: 50, productionTime: '10 días', format: 'Carta', saleUnit: 'Lote (50)', minOrder: 50, volumeDiscount: 200 }
];

export const regimenFiscalOptions = [
    { label: '601 - General de Ley Personas Morales', value: '601' },
    { label: '603 - Personas Morales con Fines no Lucrativos', value: '603' },
    { label: '605 - Sueldos y Salarios e Ingresos Asimilados a Salarios', value: '605' },
    { label: '612 - Personas Físicas con Actividades Empresariales y Profesionales', value: '612' },
    { label: '616 - Sin obligaciones fiscales', value: '616' },
    { label: '626 - Régimen Simplificado de Confianza', value: '626' }
];

export const dummyClients = [
    { id: 'C001', name: 'Juan Pérez', email: 'juan@email.com', phone: '5512345678', rfc: 'PEPJ800101ABC', cfdi: 'G03', regimenFiscal: '612', cp: '06500' },
    { id: 'C002', name: 'Sofía Herrera', email: 'sofia@email.com', phone: '5587654321', rfc: 'HESF900202XYZ', cfdi: 'G01', regimenFiscal: '626', cp: '03100' },
    { id: 'C003', name: 'Carlos Ramírez', email: 'carlos@email.com', phone: '5555555555', rfc: '', cfdi: '', regimenFiscal: '', cp: '' },
    { id: 'C003', name: 'Isaias Juarez', email: 'isaias@email.com', phone: '2711906291', rfc: '', cfdi: '', regimenFiscal: '', cp: '' }
];

// ... dummyQuotes ...
export const dummyQuotes = [
    {
        id: 'COT-001',
        cliente: 'Juan Pérez',
        total: 225.00,
        estatus: 'Activa',
        designer: 'Ana Torres',
        items: [
            { id: 'PRD-001A', descripcion: 'Tarjetas básicas (couché 300g, 1 cara)', costo: 1.50, cantidad: 150, importe: 225.00 }
        ]
    },
    {
        id: 'COT-002',
        cliente: 'Sofía Herrera',
        total: 450.00,
        estatus: 'Activa',
        designer: 'Ana Torres',
        items: [
            { id: 'PRD-001B', descripcion: 'Tarjetas estándar (2 caras, laminado mate)', costo: 2.25, cantidad: 200, importe: 450.00 }
        ]
    },
    {
        id: 'COT-003',
        cliente: 'Carlos Ramírez',
        total: 1575.75,
        estatus: 'Activa',
        designer: 'Carlos Ramírez',
        items: [
            { id: 'PRD-004B', descripcion: 'Folder corporativo (con solapa y bolsillo)', costo: 18.00, cantidad: 80, importe: 1440.00 },
            { id: 'PRD-001A', descripcion: 'Tarjetas básicas (adicional)', costo: 1.81, cantidad: 75, importe: 135.75 }
        ]
    },
    {
        id: 'COT-004',
        cliente: 'Luisa Gómez',
        total: 640.20,
        estatus: 'Activa',
        designer: 'Luisa Gómez',
        items: [
            { id: 'PRD-005A', descripcion: 'Volantes económicos (couché 130g)', costo: 0.80, cantidad: 800, importe: 640.00 },
            { id: 'PRD-ENV', descripcion: 'Servicio de envío local', costo: 0.20, cantidad: 1, importe: 0.20 }
        ]
    },
    {
        id: 'COT-005',
        cliente: 'Mario Sánchez',
        total: 2100.00,
        estatus: 'Activa',
        designer: 'Sofía Herrera',
        items: [
            { id: 'PRD-008', descripcion: 'Catálogos / Revistas (20 págs.)', costo: 60.00, cantidad: 35, importe: 2100.00 }
        ]
    },
    {
        id: 'COT-006',
        cliente: 'Laura Fernández',
        total: 850.90,
        estatus: 'Activa',
        designer: 'Sofía Herrera',
        items: [
            { id: 'PRD-014', descripcion: 'Playeras sublimadas', costo: 130.00, cantidad: 6, importe: 780.00 },
            { id: 'PRD-015', descripcion: 'Tazas personalizadas', costo: 70.90, cantidad: 1, importe: 70.90 }
        ]
    },
];

// --- AGREGAMOS mainProductId A LAS ÓRDENES PARA SABER QUÉ PRODUCTO TIENEN ---
export const dummyOrders: any[] = [
    { id: 'ORD-001', cliente: 'Laura Fernández', total: 1250.00, estatus: 'En diseño', designer: 'Juan Pérez', imageUrl: 'https://primefaces.org/cdn/primereact/images/galleria/galleria10.jpg', mainProductId: 'PRD-014' },
    { id: 'ORD-002', cliente: 'Sofía Herrera', total: 980.50, estatus: 'En impresión', designer: 'Ana Torres', imageUrl: 'https://primefaces.org/cdn/primereact/images/galleria/galleria11.jpg', mainProductId: 'PRD-001A' },
    { id: 'ORD-003', cliente: 'Carlos Ramírez', total: 1575.75, estatus: 'En diseño', designer: 'Carlos Ramírez', imageUrl: null, mainProductId: 'PRD-001B' },
    { id: 'ORD-004', cliente: 'Luisa Gómez', total: 640.20, estatus: 'En impresión', designer: 'Luisa Gómez', imageUrl: null, mainProductId: 'PRD-005A' },
    { id: 'ORD-005', cliente: 'Mario Sánchez', total: 2100.00, estatus: 'En diseño', designer: 'Mario Sánchez', imageUrl: 'https://primefaces.org/cdn/primereact/images/galleria/galleria12.jpg', mainProductId: 'PRD-015' },
    { id: 'ORD-006', cliente: 'Laura Fernández', total: 850.90, estatus: 'En impresión', designer: 'Sofía Herrera', imageUrl: null, mainProductId: 'PRD-014' },
    { id: 'ORD-007', cliente: 'Diego Martínez', total: 1325.40, estatus: 'En diseño', designer: 'Diego Martínez', imageUrl: null, mainProductId: 'PRD-004A' },
    { id: 'ORD-008', cliente: 'Sofía Herrera', total: 1720.80, estatus: 'En impresión', designer: 'Sofía Herrera', imageUrl: null, mainProductId: 'PRD-001A' }
];

export const designers = [
    { label: 'Juan Pérez', value: 'JP' },
    { label: 'Ana Torres', value: 'AT' },
    { label: 'Diego Martínez', value: 'DM' }
];

export const cfdiOptions = [
    { label: 'Gastos en general', value: 'G01' },
    { label: 'Adquisición de mercancías', value: 'G02' },
    { label: 'Honorarios profesionales', value: 'G03' }
];