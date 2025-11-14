
import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/firestore-operations-server';
// CORRECCIÓN: Importamos desde firestore-admin para compatibilidad en el servidor
import { Query, Timestamp } from 'firebase-admin/firestore';

// --- OBTENER ADEUDOS DE UN ESTUDIANTE ---
export async function GET(req: NextRequest) {
    try {
        const db = getDb(); // Esta función ya devuelve la instancia de Firestore de Admin
        const { searchParams } = new URL(req.url);
        const studentUid = searchParams.get('studentUid');

        if (!studentUid) {
            return NextResponse.json({ message: 'El ID del estudiante es requerido.' }, { status: 400 });
        }

        const debtsCollectionRef = db.collection(`Estudiantes/${studentUid}/Adeudos`);
        
        // Usamos la instancia de DB de admin para la consulta
        const q = debtsCollectionRef.where('estado', '==', 'pendiente'); 
        
        const querySnapshot = await q.get();

        const activeDebts = querySnapshot.docs.map(doc => {
            const data = doc.data();
            return {
                id: doc.id,
                ...data,
                // Aseguramos que el Timestamp de Admin se convierta a ISO string
                fechaVencimiento: (data.fechaVencimiento as Timestamp)?.toDate().toISOString(),
            };
        });

        return NextResponse.json(activeDebts, { status: 200 });

    } catch (error: any) {
        console.error("Error al obtener los adeudos:", error);
        return NextResponse.json({ message: 'Error interno del servidor al obtener adeudos.' }, { status: 500 });
    }
}
