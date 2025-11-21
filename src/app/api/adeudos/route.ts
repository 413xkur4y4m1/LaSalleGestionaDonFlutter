import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/firestore-operations-server';
import { Timestamp } from 'firebase-admin/firestore';

// --- OBTENER ADEUDOS DE UN ESTUDIANTE ---
export async function GET(req: NextRequest) {
    try {
        const db = getDb();
        const { searchParams } = new URL(req.url);
        const studentUid = searchParams.get('studentUid');

        if (!studentUid) {
            return NextResponse.json({ 
                message: 'El ID del estudiante es requerido.' 
            }, { status: 400 });
        }

        console.log(`Obteniendo adeudos para estudiante: ${studentUid}`);

        const debtsCollectionRef = db.collection(`Estudiantes/${studentUid}/Adeudos`);
        const q = debtsCollectionRef.where('estado', '==', 'pendiente');
        
        const querySnapshot = await q.get();

        console.log(`Se encontraron ${querySnapshot.docs.length} adeudos pendientes`);

        const activeDebts = querySnapshot.docs.map(doc => {
            const data = doc.data();
            
            // Validación de datos antes de procesarlos
            const precioUnitario = typeof data.precio_unitario === 'number' 
                ? data.precio_unitario 
                : 0;
            
            const precioAjustado = typeof data.precio_ajustado === 'number' 
                ? data.precio_ajustado 
                : precioUnitario;
            
            const cantidad = typeof data.cantidad === 'number' 
                ? data.cantidad 
                : 1;

            return {
                id: doc.id,
                codigo: data.codigo || '',
                nombreMaterial: data.nombreMaterial || 'Sin nombre',
                cantidad: cantidad,
                precio_unitario: precioUnitario,
                precio_ajustado: precioAjustado,
                moneda: data.moneda || 'MXN',
                estado: data.estado || 'pendiente',
                tipo: data.tipo || 'vencimiento',
                fechaVencimiento: data.fechaVencimiento instanceof Timestamp
                    ? data.fechaVencimiento.toDate().toISOString()
                    : data.fechaVencimiento || null,
                grupo: data.grupo || '',
                prestamoOriginal: data.prestamoOriginal || null,
            };
        });

        return NextResponse.json(activeDebts, { status: 200 });

    } catch (error: any) {
        console.error("Error al obtener los adeudos:", error);
        return NextResponse.json({ 
            message: 'Error interno del servidor al obtener adeudos.',
            error: error.message 
        }, { status: 500 });
    }
}