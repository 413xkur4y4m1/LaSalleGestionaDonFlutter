// /home/user/studio/src/app/api/qr-center/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { adminDb } from '@/lib/firebase-admin';
import { DocumentData, QueryDocumentSnapshot } from 'firebase-admin/firestore';

interface QRItem {
  id: string;
  codigo: string;
  tipo: 'activacion' | 'devolucion' | 'devolucion_adeudo' | 'pago';
  nombreMaterial: string;
  cantidad?: number;
  estado: string;
  fechaCreacion: string;
  fechaLimite?: string;
  monto?: number;
  qrToken?: string;
  grupo?: string;
}

export async function GET(req: NextRequest) {
  try {
    // ⭐ Obtener sesión sin authOptions (usa la configuración por defecto de NextAuth)
    const session = await getServerSession();
    
    if (!session?.user?.email) {
      return NextResponse.json(
        { message: 'No autorizado' },
        { status: 401 }
      );
    }

    // ⭐ Buscar estudiante por email (Azure AD)
    const estudiantesSnapshot = await adminDb
      .collection('Estudiantes')
      .where('correo', '==', session.user.email)
      .limit(1)
      .get();

    if (estudiantesSnapshot.empty) {
      return NextResponse.json(
        { message: 'Estudiante no encontrado' },
        { status: 404 }
      );
    }

    const studentDoc = estudiantesSnapshot.docs[0];
    const studentUid = studentDoc.id;
    const studentRef = adminDb.collection('Estudiantes').doc(studentUid);

    // Estructura de respuesta
    const qrCenter = {
      activacion: [] as QRItem[],
      devolucion: [] as QRItem[],
      devolucionAdeudo: [] as QRItem[],
      pago: [] as QRItem[]
    };

    // 1. QR DE ACTIVACIÓN (Préstamos pendientes de activar)
    const prestamosSnapshot = await studentRef
      .collection('Prestamos')
      .where('estado', '==', 'pendiente_activacion')
      .get();

    prestamosSnapshot.forEach((doc: QueryDocumentSnapshot<DocumentData>) => {
      const data = doc.data();
      qrCenter.activacion.push({
        id: doc.id,
        codigo: data.codigo || '',
        tipo: 'activacion',
        nombreMaterial: data.nombreMaterial || '',
        cantidad: data.cantidad || 0,
        estado: data.estado || '',
        fechaCreacion: data.fechaCreacion?.toDate?.()?.toISOString() || '',
        fechaLimite: data.fechaDevolucion?.toDate?.()?.toISOString(),
        qrToken: data.codigo, // El código mismo es el QR
        grupo: data.grupo || ''
      });
    });

    // 2. QR DE DEVOLUCIÓN (Préstamos activos)
    const prestamosActivosSnapshot = await studentRef
      .collection('Prestamos')
      .where('estado', '==', 'activo')
      .get();

    prestamosActivosSnapshot.forEach((doc: QueryDocumentSnapshot<DocumentData>) => {
      const data = doc.data();
      if (data.qrToken) {
        qrCenter.devolucion.push({
          id: doc.id,
          codigo: data.codigo || '',
          tipo: 'devolucion',
          nombreMaterial: data.nombreMaterial || '',
          cantidad: data.cantidad || 0,
          estado: data.estado || '',
          fechaCreacion: data.fechaInicio?.toDate?.()?.toISOString() || '',
          fechaLimite: data.fechaDevolucion?.toDate?.()?.toISOString(),
          qrToken: data.qrToken,
          grupo: data.grupo || ''
        });
      }
    });

    // 3. QR DE DEVOLUCIÓN DE ADEUDO (Adeudos con tokenDevolucion)
    const adeudosDevolucionSnapshot = await studentRef
      .collection('Adeudos')
      .where('estado', '==', 'pendiente')
      .get();

    adeudosDevolucionSnapshot.forEach((doc: QueryDocumentSnapshot<DocumentData>) => {
      const data = doc.data();
      if (data.tokenDevolucion && data.tipo === 'vencimiento') {
        qrCenter.devolucionAdeudo.push({
          id: doc.id,
          codigo: data.codigo || '',
          tipo: 'devolucion_adeudo',
          nombreMaterial: data.nombreMaterial || '',
          cantidad: data.cantidad || 0,
          estado: data.estado || '',
          fechaCreacion: data.fechaCreacion?.toDate?.()?.toISOString() || '',
          qrToken: data.tokenDevolucion,
          grupo: data.grupo || ''
        });
      }
    });

    // 4. QR DE PAGO PRESENCIAL (Adeudos con tokenPago)
    adeudosDevolucionSnapshot.forEach((doc: QueryDocumentSnapshot<DocumentData>) => {
      const data = doc.data();
      if (data.tokenPago) {
        const monto = data.precio_ajustado || data.precio_unitario || 0;
        qrCenter.pago.push({
          id: doc.id,
          codigo: data.codigo || '',
          tipo: 'pago',
          nombreMaterial: data.nombreMaterial || '',
          cantidad: data.cantidad || 0,
          estado: data.estado || '',
          fechaCreacion: data.fechaCreacion?.toDate?.()?.toISOString() || '',
          monto: monto,
          qrToken: data.tokenPago,
          grupo: data.grupo || ''
        });
      }
    });

    // Calcular totales
    const totales = {
      activacion: qrCenter.activacion.length,
      devolucion: qrCenter.devolucion.length,
      devolucionAdeudo: qrCenter.devolucionAdeudo.length,
      pago: qrCenter.pago.length,
      total: qrCenter.activacion.length + 
             qrCenter.devolucion.length + 
             qrCenter.devolucionAdeudo.length + 
             qrCenter.pago.length
    };

    return NextResponse.json({
      ...qrCenter,
      totales
    }, { status: 200 });

  } catch (error: any) {
    console.error('Error en /api/qr-center:', error);
    return NextResponse.json(
      { message: 'Error al obtener códigos QR', error: error.message },
      { status: 500 }
    );
  }
}