
import { NextRequest, NextResponse } from 'next/server';
// ✅ 1. IMPORTAMOS LAS DOS HERRAMIENTAS CENTRALIZADAS DEL SERVIDOR
import { getDb, getRtdb } from '@/lib/firestore-operations-server';
import { FieldValue, Timestamp } from 'firebase-admin/firestore';

// --- GET (Sin cambios lógicos, solo usa el nuevo getDb) ---
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


// --- POST (Corregido y usando las nuevas herramientas del servidor) ---

const generateLoanCode = (grupo: string) => {
    const randomPart = Math.floor(10000 + Math.random() * 90000);
    return `PRST-${grupo.toUpperCase()}-${randomPart}`;
}

export async function POST(req: NextRequest) {
    // ✅ 2. OBTENEMOS AMBAS BASES DE DATOS DESDE NUESTRO CENTRO DE MANDO
    const db = getDb();
    const rtdb = getRtdb();

    try {
        const body = await req.json();
        const { studentUid, materialId, materialNombre, cantidad, fechaDevolucion, grupo } = body;

        if (!studentUid || !materialId || !cantidad || !fechaDevolucion || !grupo) {
            return NextResponse.json({ message: 'Faltan datos requeridos.' }, { status: 400 });
        }

        const loanCode = generateLoanCode(grupo);
        const newLoanRef = db.collection(`Estudiantes/${studentUid}/Prestamos`).doc(loanCode);
        
        // ✅ 3. LA SINTAXIS PARA LA RTDB DEL ADMIN SDK ES CORRECTA Y SEGURA
        const materialRtdbRef = rtdb.ref(`materiales/${materialId}`);

        const materialSnapshot = await materialRtdbRef.once('value');
        if (!materialSnapshot.exists()) {
            throw new Error(`El material con ID ${materialId} no existe en el inventario.`);
        }

        const materialData = materialSnapshot.val();
        const currentStock = materialData.cantidad;

        if (currentStock < cantidad) {
            throw new Error(`Stock insuficiente para ${materialNombre}. Disponible: ${currentStock}, Solicitado: ${cantidad}`);
        }

        // Transacción en Firestore
        await db.runTransaction(async (transaction) => {
            transaction.set(newLoanRef, {
                codigo: loanCode,
                nombreMaterial: materialNombre,
                cantidad: Number(cantidad),
                precio_unitario: materialData.precio || 0,
                precio_total: (materialData.precio || 0) * Number(cantidad),
                fechaInicio: FieldValue.serverTimestamp(),
                fechaDevolucion: new Date(fechaDevolucion),
                estado: 'activo',
                grupo: grupo
            });
        });

        // Actualización en RTDB (solo si la transacción de arriba tuvo éxito)
        const newStock = currentStock - cantidad;
        await materialRtdbRef.update({ 
            cantidad: newStock
        });

        console.log(`Préstamo ${loanCode} creado. Stock de ${materialId} actualizado a ${newStock}.`);
        return NextResponse.json({ loanCode: loanCode }, { status: 201 });

    } catch (error: any) {
        console.error("Error en la transacción del préstamo:", error);
        // El error ahora será más específico si viene de la transacción
        return NextResponse.json({ message: error.message || 'Error interno del servidor.' }, { status: 500 });
    }
}
