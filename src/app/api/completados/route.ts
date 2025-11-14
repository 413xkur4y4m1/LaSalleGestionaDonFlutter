
import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/firestore-operations-server';
import { Timestamp } from 'firebase-admin/firestore';

// Esta API se encarga de leer la subcolección 'Completados' de un estudiante.
export async function GET(req: NextRequest) {
    try {
        const db = getDb();
        const { searchParams } = new URL(req.url);
        const studentUid = searchParams.get('studentUid');

        if (!studentUid) {
            return NextResponse.json({ message: 'El ID del estudiante es requerido.' }, { status: 400 });
        }

        const completedCollectionRef = db.collection(`Estudiantes/${studentUid}/Completados`);
        // Ordenamos por fecha de devolución para mostrar los más recientes primero
        const q = completedCollectionRef.orderBy('fechaDevolucion', 'desc');
        const querySnapshot = await q.get();

        const completedLoans = querySnapshot.docs.map(doc => {
            const data = doc.data();
            return {
                id: doc.id,
                ...data,
                // Aseguramos que las fechas se conviertan a un formato estándar (ISO string)
                fechaInicio: (data.fechaInicio as Timestamp)?.toDate().toISOString(),
                fechaDevolucion: (data.fechaDevolucion as Timestamp)?.toDate().toISOString(),
            };
        });

        return NextResponse.json(completedLoans, { status: 200 });

    } catch (error: any) {
        console.error("Error al obtener los préstamos completados:", error);
        return NextResponse.json({ message: 'Error interno del servidor al obtener el historial de préstamos.' }, { status: 500 });
    }
}
