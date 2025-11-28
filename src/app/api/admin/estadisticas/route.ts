import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/firebase';
import { doc, getDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { generateStatisticalAnalysis } from '@/lib/genkit';

export const dynamic = 'force-dynamic';
export const maxDuration = 120;

export async function POST(req: NextRequest) {
  try {
    // TODO: Agregar verificación de admin cuando tengas auth
    // const session = await getServerSession(authOptions);
    // if (!session || session.user.role !== 'admin') {
    //   return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    // }

    console.log('🧠 [ANÁLISIS IA MANUAL] Iniciando generación...');

    // Obtener las estadísticas actuales
    const reporteRef = doc(db, 'Estadisticas', 'reporte_actual');
    const reporteSnap = await getDoc(reporteRef);

    if (!reporteSnap.exists()) {
      return NextResponse.json({
        success: false,
        message: 'No hay estadísticas disponibles para analizar',
      }, { status: 400 });
    }

    const datosActuales = reporteSnap.data();

    // Preparar datos optimizados para IA
    const datosParaIA = {
      prestamos: [],
      adeudos: [],
      completados: [],
      pagados: [],
      resumen: {
        totalPrestamos: datosActuales.totalPrestamos || 0,
        totalAdeudos: datosActuales.totalAdeudos || 0,
        totalCompletados: datosActuales.totalCompletados || 0,
        topMateriales: (datosActuales.topMateriales || []).slice(0, 5),
        topPerdidos: (datosActuales.topPerdidos || []).slice(0, 5),
        topEstudiantes: (datosActuales.topEstudiantes || []).slice(0, 5),
        peoresEstudiantes: (datosActuales.peoresEstudiantes || []).slice(0, 5),
      }
    };

    console.log('🤖 Generando análisis con IA...');
    
    const analisisIA = await generateStatisticalAnalysis(datosParaIA);
    const analisisTexto = analisisIA.text;
    
    let analisisJSON;
    try {
      analisisJSON = JSON.parse(analisisTexto);
      console.log('✅ Análisis IA generado en formato JSON');
    } catch {
      analisisJSON = {
        resumen_ejecutivo: analisisTexto,
        insights: ['Análisis generado correctamente'],
        predicciones: ['Se requiere más historial para predicciones precisas'],
        recomendaciones: ['Continuar monitoreando el sistema'],
        alertas: [],
        tendencias: ['Datos en análisis continuo'],
      };
      console.log('⚠️ Análisis IA en formato texto');
    }

    // Actualizar análisis IA
    await updateDoc(reporteRef, {
      analisisIA: analisisJSON,
      ultimaActualizacionIA: serverTimestamp(),
      datosUltimoAnalisis: {
        totalPrestamos: datosActuales.totalPrestamos,
        totalAdeudos: datosActuales.totalAdeudos,
        totalCompletados: datosActuales.totalCompletados,
      },
    });

    console.log('✅ Análisis IA generado y guardado exitosamente');

    return NextResponse.json({
      success: true,
      message: 'Análisis IA generado exitosamente',
      analisis: analisisJSON,
      timestamp: new Date().toISOString(),
    });

  } catch (error: any) {
    console.error('❌ Error generando análisis IA:', error);
    
    // Manejo específico de rate limit
    if (error.message?.includes('429') || error.status === 429) {
      return NextResponse.json({
        success: false,
        error: 'Límite de API alcanzado',
        message: 'Has alcanzado el límite de la API de Google. Por favor intenta de nuevo en unos minutos o considera usar una API key diferente.',
      }, { status: 429 });
    }

    return NextResponse.json({
      success: false,
      error: error.message || 'Error desconocido al generar análisis',
      message: 'Ocurrió un error al generar el análisis. Por favor intenta nuevamente.',
    }, { status: 500 });
  }
}
