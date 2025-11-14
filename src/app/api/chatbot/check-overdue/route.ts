
import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/firestore-operations-server';
import * as admin from 'firebase-admin';

// Esta API no modifica datos, solo busca si un estudiante tiene un préstamo vencido activo.
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const studentUid = searchParams.get('studentUid');
  const db = getDb();
  
  if (!studentUid) {
    return NextResponse.json({ message: 'El ID del estudiante es requerido.' }, { status: 400 });
  }

  try {
    const loansRef = db.collection(`Estudiantes/${studentUid}/Prestamos`);
    // Buscamos préstamos activos cuya fecha de devolución ya pasó.
    const now = new Date();
    const q = loansRef.where('estado', '==', 'activo');
    const querySnapshot = await q.get();

    if (querySnapshot.empty) {
      // No hay préstamos activos, por lo tanto no hay vencidos.
      return NextResponse.json({ overdueLoan: null }, { status: 200 });
    }

    // Filtramos en el servidor porque Firestore no permite dos '!=' o '<' en campos diferentes.
    const overdueLoanDoc = querySnapshot.docs.find(doc => {
        const loanData = doc.data();
        // Convertimos la fecha de string a objeto Date para comparar
        const returnDate = new Date(loanData.fechaDevolucion);
        return returnDate < now;
    });

    if (!overdueLoanDoc) {
        // Hay préstamos activos pero ninguno está vencido.
        return NextResponse.json({ overdueLoan: null }, { status: 200 });
    }
    
    // Hay al menos un préstamo vencido. Devolvemos el primero que encontramos.
    const loanData = overdueLoanDoc.data();
    
    const overdueLoan = {
      id: overdueLoanDoc.id,
      ...loanData,
      // Nos aseguramos que las fechas se devuelvan como strings ISO para consistencia.
      fechaInicio: new Date(loanData.fechaInicio).toISOString(),
      fechaDevolucion: new Date(loanData.fechaDevolucion).toISOString(),
    };

    return NextResponse.json({ overdueLoan }, { status: 200 });

  } catch (error: any) {
    console.error("[API Check-Overdue ERROR]:", error);
    return NextResponse.json({ message: "Error interno del servidor.", error: error.message }, { status: 500 });
  }
}

