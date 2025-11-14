
import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/firestore-operations-server';
// CORRECCIÓN: Importamos todo desde firebase-admin para el servidor
import { FieldValue, Timestamp } from 'firebase-admin/firestore';
import { ref, get, update } from 'firebase/database'; // RTDB no cambia
import { rtdb } from '@/lib/firebase-config'; 

// --- OBTENER PRÉSTAMOS ACTIVOS DE UN ESTUDIANTE ---
export async function GET(req: NextRequest) {
    try {
        const db = getDb();
        const { searchParams } = new URL(req.url);
        const studentUid = searchParams.get('studentUid');

        if (!studentUid) {
            return NextResponse.json({ message: 'El ID del estudiante es requerido.' }, { status: 400 });
        }

        const loansCollectionRef = db.collection(`Estudiantes/${studentUid}/Prestamos`);
        const q = loansCollectionRef.where('estado', '==', 'activo');
        const querySnapshot = await q.get();

        const activeLoans = querySnapshot.docs.map(doc => {
            const data = doc.data();
            return {
                id: doc.id,
                ...data,
                fechaInicio: (data.fechaInicio as Timestamp)?.toDate().toISOString(),
                fechaDevolucion: (data.fechaDevolucion as Timestamp)?.toDate().toISOString(),
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
    const randomPart = Math.floor(1000 + Math.random() * 9000);
    return `PRST-${grupo.toUpperCase()}-${randomPart}`;
}

export async function POST(req: NextRequest) {
    const db = getDb();
    try {
        const body = await req.json();
        const { studentUid, materialId, materialNombre, cantidad, fechaDevolucion, grupo } = body;

        if (!studentUid || !materialId || !cantidad || !fechaDevolucion || !grupo) {
            return NextResponse.json({ message: 'Faltan datos requeridos (uid, material, cantidad, fecha, grupo).' }, { status: 400 });
        }

        const loanCode = generateLoanCode(grupo);
        const newLoanRef = db.collection(`Estudiantes/${studentUid}/Prestamos`).doc();
        const materialRtdbRef = ref(rtdb, `materiales/${materialId}`);

        await db.runTransaction(async (transaction) => {
            const materialSnapshot = await get(materialRtdbRef);
            if (!materialSnapshot.exists()) {
                throw new Error(`El material con ID ${materialId} no existe en el inventario.`);
            }

            const materialData = materialSnapshot.val();
            const currentStock = materialData.cantidad;
            if (currentStock < cantidad) {
                throw new Error(`Stock insuficiente para ${materialNombre}. Disponible: ${currentStock}`);
            }

            const newStock = currentStock - cantidad;

            transaction.set(newLoanRef, {
                codigo: loanCode,
                nombreMaterial: materialNombre,
                cantidad: Number(cantidad),
                precio_unitario: materialData.precio || 0,
                precio_total: (materialData.precio || 0) * Number(cantidad),
                fechaInicio: FieldValue.serverTimestamp(), // Usamos el timestamp del servidor de Admin
                fechaDevolucion: new Date(fechaDevolucion),
                estado: 'activo',
                grupo: grupo
            });
            
            // La actualización de RTDB es atómica y no necesita estar en la transacción de Firestore
            await update(materialRtdbRef, { 
                cantidad: newStock
            });
        });

        return NextResponse.json({ loanCode: loanCode }, { status: 201 });

    } catch (error: any) {
        console.error("Error en la transacción del préstamo:", error);
        return NextResponse.json({ message: error.message || 'Error interno del servidor.' }, { status: 500 });
    }
}
