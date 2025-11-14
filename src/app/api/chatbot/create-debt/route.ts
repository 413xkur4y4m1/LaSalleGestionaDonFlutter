
import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/firestore-operations-server';
import * as admin from 'firebase-admin';

// --- Tipos de datos esperados en el cuerpo de la solicitud ---
interface CreateDebtRequestBody {
  studentUid: string;
  loanId: string;
  reason: 'broken' | 'lost' | 'not_returned';
  // Se incluyen los detalles del préstamo para no tener que buscarlos de nuevo
  loanDetails: {
    nombreMaterial: string;
    cantidad: number;
    precioUnitario: number;
    fechaInicio: string;
    fechaDevolucion: string;
  };
}

// --- API para crear un Adeudo a partir de un Préstamo Vencido ---
export async function POST(req: NextRequest) {
  try {
    const { studentUid, loanId, reason, loanDetails } = await req.json() as CreateDebtRequestBody;
    const db = getDb();

    // --- Validación de datos de entrada ---
    if (!studentUid || !loanId || !reason || !loanDetails) {
      return NextResponse.json({ message: 'Faltan datos requeridos para crear el adeudo.' }, { status: 400 });
    }

    const studentRef = db.collection('Estudiantes').doc(studentUid);
    const loanRef = studentRef.collection('Prestamos').doc(loanId);
    const debtRef = studentRef.collection('Adeudos').doc(loanId); // Usamos el mismo ID para evitar duplicados

    // --- Cálculo del precio ajustado ---
    let precioAjustado = loanDetails.precioUnitario * loanDetails.cantidad;
    let justificacion = "Devolución tardía.";

    if (reason === 'broken') {
      // Recargo del 20% por daño
      precioAjustado *= 1.20;
      justificacion = "Material dañado.";
    } else if (reason === 'lost') {
      // Recargo del 50% por pérdida
      precioAjustado *= 1.50;
      justificacion = "Material perdido.";
    }

    // --- Construcción del objeto de Adeudo ---
    const newDebt = {
      nombreMaterial: loanDetails.nombreMaterial,
      cantidad: loanDetails.cantidad,
      precioUnitario: loanDetails.precioUnitario,
      precioTotal: parseFloat(precioAjustado.toFixed(2)), // Redondeamos a 2 decimales
      fechaVencimiento: loanDetails.fechaDevolucion, // La fecha de vencimiento original del préstamo
      fechaCreacion: admin.firestore.FieldValue.serverTimestamp(),
      estado: 'pendiente', // Todos los nuevos adeudos inician como pendientes
      justificacion: justificacion,
      idPrestamoOriginal: loanId,
    };

    // --- Transacción de Firestore: Eliminar Préstamo y Crear Adeudo ---
    await db.runTransaction(async (transaction) => {
      // Verificamos que el préstamo aún exista antes de hacer nada
      const loanDoc = await transaction.get(loanRef);
      if (!loanDoc.exists) {
        throw new Error("El préstamo ya no existe, es posible que ya se haya procesado.");
      }
      
      // Si existe, lo eliminamos y creamos el nuevo adeudo
      transaction.delete(loanRef);
      transaction.set(debtRef, newDebt);
    });

    // Devolvemos el nuevo adeudo creado para que el cliente lo pueda usar
    return NextResponse.json({ message: 'Adeudo creado exitosamente.', debt: { ...newDebt, id: debtRef.id, precioTotal: precioAjustado } }, { status: 201 });

  } catch (error: any) {
    console.error("[API Create-Debt ERROR]:", error);
    return NextResponse.json({ message: "Error interno del servidor al crear el adeudo.", error: error.message }, { status: 500 });
  }
}
