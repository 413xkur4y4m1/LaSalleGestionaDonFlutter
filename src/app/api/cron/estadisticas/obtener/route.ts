// app/api/estadisticas/obtener/route.ts
import { NextResponse } from 'next/server';
import { db } from '@/lib/firebase';
import { doc, getDoc } from 'firebase/firestore';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const estadisticasDoc = await getDoc(doc(db, 'Estadisticas', 'reporte_actual'));

    if (!estadisticasDoc.exists()) {
      return NextResponse.json({
        error: 'No hay estadísticas disponibles. El cron job aún no ha generado datos.',
        topMateriales: [],
        topPerdidos: [],
        topEstudiantes: [],
        peoresEstudiantes: [],
        totalPrestamos: 0,
        totalAdeudos: 0,
        totalCompletados: 0,
        totalEstudiantes: 0,
        analisisIA: null,
      });
    }

    const data = estadisticasDoc.data();

    return NextResponse.json({
      ...data,
      ultimaActualizacion: data.ultimaActualizacion?.toDate?.()?.toISOString() || null,
    });

  } catch (error: any) {
    console.error('Error obteniendo estadísticas:', error);
    return NextResponse.json({
      error: error.message,
      topMateriales: [],
      topPerdidos: [],
      topEstudiantes: [],
      peoresEstudiantes: [],
      totalPrestamos: 0,
      totalAdeudos: 0,
      totalCompletados: 0,
      totalEstudiantes: 0,
      analisisIA: null,
    }, { status: 500 });
  }
}