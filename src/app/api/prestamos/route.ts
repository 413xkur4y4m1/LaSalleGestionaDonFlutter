
import { NextRequest, NextResponse } from 'next/server';
import { db, rtdb } from '@/lib/firebase-config';
import { doc, runTransaction, collection, serverTimestamp } from 'firebase/firestore';
import { ref, get, update, child } from 'firebase/database';

// Función para generar el código del préstamo
// En una implementación real, este número debería venir de un contador en Firestore para evitar colisiones.
const generateLoanCode = (grupo: string) => {
    const randomPart = Math.floor(10000 + Math.random() * 90000);
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
            grupo = 'GPO' // Grupo por defecto si no viene
        } = body;

        // --- Validación de Entrada ---
        if (!studentUid || !materialId || !cantidad || !fechaDevolucion) {
            return NextResponse.json({ message: 'Faltan datos requeridos.' }, { status: 400 });
        }

        const loanCode = generateLoanCode(grupo);
        const studentDocRef = doc(db, 'Estudiantes', studentUid);
        const newLoanRef = doc(collection(studentDocRef, 'Prestamos')); // Genera un ID automático
        const materialRtdbRef = ref(rtdb, `materiales/${materialId}`);

        // --- Transacción Atómica --- 
        // Esto asegura que o todo se completa, o nada cambia.
        await runTransaction(db, async (firestoreTransaction) => {
            // 1. Leer el stock actual de Realtime Database
            const materialSnapshot = await get(materialRtdbRef);
            if (!materialSnapshot.exists()) {
                throw new Error(`El material con ID ${materialId} no existe en Realtime DB.`);
            }

            const currentStock = materialSnapshot.val().cantidad;

            // 2. Validar si hay suficiente stock
            if (currentStock < cantidad) {
                throw new Error(`Stock insuficiente para ${materialNombre}. Disponible: ${currentStock}, Solicitado: ${cantidad}`);
            }

            const newStock = currentStock - cantidad;

            // 3. Preparar la escritura en Firestore
            firestoreTransaction.set(newLoanRef, {
                codigo: loanCode,
                nombreMaterial: materialNombre,
                cantidad: cantidad,
                fechaInicio: serverTimestamp(), // Fecha actual del servidor
                fechaDevolucion: new Date(fechaDevolucion),
                estado: 'activo', 
                grupo: grupo
            });
            
            // 4. Actualizar el stock en Realtime Database (esto ocurre fuera de la transacción de Firestore)
            // La transacción de Firestore nos da la confianza para proceder con la actualización de RTDB.
            await update(ref(rtdb, 'materiales'), { 
                [materialId + '/cantidad']: newStock
            });
        });

        // Si la transacción fue exitosa, devolvemos el código
        return NextResponse.json({ loanCode: loanCode }, { status: 201 });

    } catch (error: any) {
        console.error("Error en la transacción del préstamo:", error);
        // Devolvemos el mensaje de error específico (ej. "Stock insuficiente...")
        return NextResponse.json({ message: error.message || 'Error interno del servidor.' }, { status: 500 });
    }
}
