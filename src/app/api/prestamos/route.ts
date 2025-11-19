
// FORZANDO LA ACTUALIZACIÓN DE CACHÉ PARA INCLUIR LA DATABASE URL
import { NextRequest, NextResponse } from 'next/server';
import { getDb, getRtdb } from '@/lib/firestore-operations-server';
import { FieldValue } from 'firebase-admin/firestore';

// --- GET (No se modifica) ---
// ... (El código GET se mantiene igual que antes)

export async function GET(req: NextRequest) {
    try {
        const db = getDb();
        const { searchParams } = new URL(req.url);
        const studentUid = searchParams.get('studentUid');

        if (!studentUid) {
            return NextResponse.json({ message: 'El ID del estudiante es requerido.' }, { status: 400 });
        }

        // Esta consulta podría ajustarse para incluir 'pendiente' si se necesita en la UI del estudiante
        const loansCollectionRef = db.collection(`Estudiantes/${studentUid}/Prestamos`);
        const q = loansCollectionRef.where('estado', '==', 'activo');
        const querySnapshot = await q.get();

        const activeLoans = querySnapshot.docs.map(doc => {
            const data = doc.data();
            return {
                id: doc.id,
                ...data,
                fechaInicio: (data.fechaInicio)?.toDate().toISOString(),
                fechaDevolucion: (data.fechaDevolucion)?.toDate().toISOString(),
            };
        });

        return NextResponse.json(activeLoans, { status: 200 });

    } catch (error: any) {
        console.error("Error al obtener los préstamos:", error);
        return NextResponse.json({ message: 'Error interno del servidor al obtener préstamos.' }, { status: 500 });
    }
}


// --- POST (MODIFICADO PARA EL NUEVO FLUJO DE VALIDACIÓN) ---

const generateLoanCode = (grupo: string) => {
    const randomPart = Math.floor(10000 + Math.random() * 90000);
    return `PRST-${grupo.toUpperCase()}-${randomPart}`;
}

export async function POST(req: NextRequest) {
    const db = getDb();
    const rtdb = getRtdb();

    try {
        const body = await req.json();
        const { studentUid, materialId, materialNombre, cantidad, fechaDevolucion, grupo } = body;

        if (!studentUid || !materialId || !cantidad || !fechaDevolucion || !grupo) {
            return NextResponse.json({ message: 'Faltan datos requeridos.' }, { status: 400 });
        }
        
        // Se sigue consultando RTDB solo para obtener el precio del material.
        const materialRtdbRef = rtdb.ref(`materiales/${materialId}`);
        const materialSnapshot = await materialRtdbRef.once('value');
        if (!materialSnapshot.exists()) {
             return NextResponse.json({ message: `El material con ID ${materialId} no existe en el inventario.` }, { status: 404 });
        }
        const materialData = materialSnapshot.val();

        const loanCode = generateLoanCode(grupo);
        
        // Referencias a los dos documentos que crearemos
        const prestamoRef = db.collection(`Estudiantes/${studentUid}/Prestamos`).doc(loanCode);
        const qrRef = db.collection('qrs').doc(loanCode);

        // Transacción Atómica: O se crean ambos documentos, o no se crea ninguno.
        await db.runTransaction(async (transaction) => {
            
            // 1. Crear el documento del Préstamo con estado "pendiente"
            transaction.set(prestamoRef, {
                studentUid: studentUid,
                codigo: loanCode,
                nombreMaterial: materialNombre,
                cantidad: Number(cantidad),
                precio_unitario: materialData.precio || 0,
                precio_total: (materialData.precio || 0) * Number(cantidad),
                fechaSolicitud: FieldValue.serverTimestamp(), // Fecha de creación
                fechaDevolucion: new Date(fechaDevolucion),
                estado: 'pendiente', // <-- ESTADO INICIAL CORRECTO
                grupo: grupo
            });

            // 2. Crear el documento QR global para que el admin lo valide
            transaction.set(qrRef, {
                status: 'pendiente', // <-- ESTADO INICIAL CORRECTO
                operationId: loanCode,
                operationType: 'prestamos',
                studentUid: studentUid, // <-- CRÍTICO para encontrar el préstamo original
                createdAt: FieldValue.serverTimestamp(),
                validatedAt: null,
                validatedBy: null
            });
        });
        
        // LA LÓGICA DE INVENTARIO SE HA MOVIDO AL ENDPOINT DE ACTIVACIÓN

        console.log(`Solicitud de préstamo ${loanCode} y QR creado exitosamente. Esperando validación de admin.`);
        return NextResponse.json({ message: "Solicitud de préstamo creada. Muestra el QR al administrador.", loanCode: loanCode }, { status: 201 });

    } catch (error: any) {
        console.error("Error en la creación de la solicitud de préstamo:", error);
        return NextResponse.json({ message: error.message || 'Error interno del servidor.' }, { status: 500 });
    }
}
