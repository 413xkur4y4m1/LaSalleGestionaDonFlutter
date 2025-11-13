
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/firebase-config';
import { collection, getDocs, query, where } from 'firebase/firestore';

// --- OBTENER ADEUDOS DE UN ESTUDIANTE ---
export async function GET(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url);
        const studentUid = searchParams.get('studentUid');

        if (!studentUid) {
            return NextResponse.json({ message: 'El ID del estudiante es requerido.' }, { status: 400 });
        }

        // Apuntamos a la subcolección de "Adeudos" del estudiante
        const debtsCollectionRef = collection(db, `Estudiantes/${studentUid}/Adeudos`);
        
        // No se necesita filtro de "estado" si todos los documentos en la colección son un adeudo pendiente.
        // Si hubiera diferentes tipos de adeudos, aquí se podría añadir un `where('estado', '==', 'pendiente')`
        const q = query(debtsCollectionRef); 
        
        const querySnapshot = await getDocs(q);

        const activeDebts = querySnapshot.docs.map(doc => {
            const data = doc.data();
            return {
                id: doc.id,
                ...data,
                // Aseguramos que cualquier timestamp se convierta a un formato serializable
                fechaReporte: data.fechaReporte?.toDate().toISOString(),
            };
        });

        return NextResponse.json(activeDebts, { status: 200 });

    } catch (error: any) {
        console.error("Error al obtener los adeudos:", error);
        return NextResponse.json({ message: 'Error interno del servidor al obtener adeudos.' }, { status: 500 });
    }
}
