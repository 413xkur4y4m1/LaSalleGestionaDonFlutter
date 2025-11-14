
import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/firestore-operations-server';
import { Timestamp } from 'firebase-admin/firestore';

// Esta API se encarga de leer la subcolección 'Pagados' de un estudiante.
export async function GET(req: NextRequest) {
    try {
        const db = getDb();
        const { searchParams } = new URL(req.url);
        const studentUid = searchParams.get('studentUid');

        if (!studentUid) {
            return NextResponse.json({ message: 'El ID del estudiante es requerido.' }, { status: 400 });
        }

        const paidCollectionRef = db.collection(`Estudiantes/${studentUid}/Pagados`);
        // Ordenamos por fecha de pago para mostrar los más recientes primero
        const q = paidCollectionRef.orderBy('fechaPago', 'desc');
        const querySnapshot = await q.get();

        const paidDebts = querySnapshot.docs.map(doc => {
            const data = doc.data();
            return {
                id: doc.id,
                ...data,
                // Aseguramos que las fechas se conviertan a un formato estándar (ISO string)
                fechaVencimiento: (data.fechaVencimiento as Timestamp)?.toDate().toISOString(),
                fechaPago: (data.fechaPago as Timestamp)?.toDate().toISOString(),
            };
        });

        return NextResponse.json(paidDebts, { status: 200 });

    } catch (error: any) {
        console.error("Error al obtener los adeudos pagados:", error);
        return NextResponse.json({ message: 'Error interno del servidor al obtener el historial de pagos.' }, { status: 500 });
    }
}
