// app/api/estadisticas/obtener/route.ts
import { NextResponse } from 'next/server';
import { db } from '@/lib/firebase';
import { doc, getDoc } from 'firebase/firestore';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET() {
  try {
    console.log('📊 Obteniendo estadísticas de Firestore...');
    
    const estadisticasDoc = await getDoc(doc(db, 'Estadisticas', 'reporte_actual'));

    if (!estadisticasDoc.exists()) {
      console.log('⚠️ No hay estadísticas disponibles aún');
      return NextResponse.json({
        topMateriales: [],
        topPerdidos: [],
        topEstudiantes: [],
        peoresEstudiantes: [],
        totalPrestamos: 0,
        totalAdeudos: 0,
        totalCompletados: 0,
        totalEstudiantes: 0,
        analisisIA: {
          resumen_ejecutivo: 'Aún no hay datos disponibles. El sistema generará estadísticas cada 3 minutos.',
          insights: [],
          predicciones: [],
          recomendaciones: [],
          alertas: [],
          tendencias: [],
        },
      });
    }

    const data = estadisticasDoc.data();
    console.log('✅ Estadísticas obtenidas correctamente');

    // Convertir timestamp a string de forma segura
    let ultimaActualizacionISO = null;
    if (data.ultimaActualizacion) {
      try {
        if (typeof data.ultimaActualizacion.toDate === 'function') {
          ultimaActualizacionISO = data.ultimaActualizacion.toDate().toISOString();
        } else if (data.ultimaActualizacion.seconds) {
          ultimaActualizacionISO = new Date(data.ultimaActualizacion.seconds * 1000).toISOString();
        }
      } catch (e) {
        console.warn('Error convirtiendo timestamp:', e);
      }
    }

    // Asegurar que todas las propiedades existan con valores por defecto
    return NextResponse.json({
      topMateriales: data.topMateriales || [],
      topPerdidos: data.topPerdidos || [],
      topEstudiantes: data.topEstudiantes || [],
      peoresEstudiantes: data.peoresEstudiantes || [],
      totalPrestamos: data.totalPrestamos || 0,
      totalAdeudos: data.totalAdeudos || 0,
      totalCompletados: data.totalCompletados || 0,
      totalEstudiantes: data.totalEstudiantes || 0,
      analisisIA: data.analisisIA || {
        resumen_ejecutivo: 'Análisis en proceso...',
        insights: [],
        predicciones: [],
        recomendaciones: [],
        alertas: [],
        tendencias: [],
      },
      ultimaActualizacion: ultimaActualizacionISO,
      version: data.version || Date.now(),
    });

  } catch (error: any) {
    console.error('❌ Error obteniendo estadísticas:', error);
    
    // Retornar datos vacíos en caso de error pero con estructura válida
    return NextResponse.json({
      topMateriales: [],
      topPerdidos: [],
      topEstudiantes: [],
      peoresEstudiantes: [],
      totalPrestamos: 0,
      totalAdeudos: 0,
      totalCompletados: 0,
      totalEstudiantes: 0,
      analisisIA: {
        resumen_ejecutivo: `Error al cargar estadísticas: ${error.message}`,
        insights: [],
        predicciones: [],
        recomendaciones: [],
        alertas: [],
        tendencias: [],
      },
      error: error.message,
    });
  }
}