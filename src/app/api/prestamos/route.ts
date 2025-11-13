
import { NextRequest, NextResponse } from 'next/server';
import { db, rtdb } from '@/lib/firebase-config';
import { doc, runTransaction, collection, serverTimestamp, getDocs, query, where } from 'firebase/firestore';
import { ref, get, update } from 'firebase/database';

// --- OBTENER PRÉSTAMOS ACTIVOS DE UN ESTUDIANTE ---
export async function GET(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url);
        const studentUid = searchParams.get('studentUid');

        if (!studentUid) {
            return NextResponse.json({ message: 'El ID del estudiante es requerido.' }, { status: 400 });
        }

        const loansCollectionRef = collection(db, `Estudiantes/${studentUid}/Prestamos`);
        
        // Creamos una consulta para filtrar solo los préstamos con estado "activo"
        const q = query(loansCollectionRef, where('estado', '==', 'activo'));
        
        const querySnapshot = await getDocs(q);

        const activeLoans = querySnapshot.docs.map(doc => {
            const data = doc.data();
            // Convertimos los Timestamps de Firestore a un formato estándar (ISO string) para que sean serializables en JSON
            return {
                id: doc.id,
                ...data,
                fechaInicio: data.fechaInicio?.toDate().toISOString(),
                fechaDevolucion: data.fechaDevolucion?.toDate().toISOString(),
            };
        });

        return NextResponse.json(activeLoans, { status: 200 });

    } catch (error: any) {
        console.error("Error al obtener los préstamos:", error);
        return NextResponse.json({ message: 'Error interno del servidor al obtener préstamos.' }, { status: 500 });
    }
}


// --- CREAR UN NUEVO PRÉSTAMO ---
const generateLoanCode = (grupo: string) => {
    const randomPart = Math.floor(1000 + Math.random() * 9000); // 4 dígitos
    return `PRST-${grupo}-${randomPart}`;
}

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const {
            studentUid,
            materialId,
            materialNombre,
            cantidad,
            fechaDevolucion,
            grupo = 'GPO'
        } = body;

        if (!studentUid || !materialId || !cantidad || !fechaDevolucion) {
            return NextResponse.json({ message: 'Faltan datos requeridos.' }, { status: 400 });
        }

        const loanCode = generateLoanCode(grupo);
        const newLoanRef = doc(collection(db, `Estudiantes/${studentUid}/Prestamos`));
        const materialRtdbRef = ref(rtdb, `materiales/${materialId}`);

        await runTransaction(db, async (firestoreTransaction) => {
            const materialSnapshot = await get(materialRtdbRef);
            if (!materialSnapshot.exists()) {
                throw new Error(`El material con ID ${materialId} no existe.`);
            }

            const currentStock = materialSnapshot.val().cantidad;
            if (currentStock < cantidad) {
                throw new Error(`Stock insuficiente para ${materialNombre}. Disponible: ${currentStock}`);
            }

            const newStock = currentStock - cantidad;

            firestoreTransaction.set(newLoanRef, {
                codigo: loanCode,
                nombreMaterial: materialNombre,
                cantidad: Number(cantidad),
                fechaInicio: serverTimestamp(),
                fechaDevolucion: new Date(fechaDevolucion),
                estado: 'activo',
                grupo: grupo
            });
            
            await update(ref(rtdb, 'materiales'), { 
                [`${materialId}/cantidad`]: newStock
            });
        });

        return NextResponse.json({ loanCode: loanCode }, { status: 201 });

    } catch (error: any) {
        console.error("Error en la transacción del préstamo:", error);
        return NextResponse.json({ message: error.message || 'Error interno del servidor.' }, { status: 500 });
    }
}
