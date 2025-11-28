// app/api/cron/analisis-ia/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/firebase';
import { doc, getDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { generateStatisticalAnalysis } from '@/lib/genkit';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

export async function GET(req: NextRequest) {
  try {
    const authHeader = req.headers.get('authorization');
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log('🧠 [ANÁLISIS IA SEMANAL] Iniciando generación...');

    // Obtener las estadísticas actuales
    const reporteRef = doc(db, 'Estadisticas', 'reporte_actual');
    const reporteSnap = await getDoc(reporteRef);

    if (!reporteSnap.exists()) {
      console.log('⚠️ No hay estadísticas base disponibles');
      return NextResponse.json({
        success: false,
        message: 'Esperando estadísticas básicas',
      }, { status: 400 });
    }

    const datosActuales = reporteSnap.data();

    // Preparar datos para IA (tomar muestras para no exceder límites)
    const datosParaIA = {
      prestamos: [], // Podrías obtenerlos de una colección histórica
      adeudos: [],
      completados: [],
      pagados: [],
      // Usar las estadísticas agregadas
      resumen: {
        totalPrestamos: datosActuales.totalPrestamos,
        totalAdeudos: datosActuales.totalAdeudos,
        totalCompletados: datosActuales.totalCompletados,
        topMateriales: datosActuales.topMateriales,
        topPerdidos: datosActuales.topPerdidos,
        topEstudiantes: datosActuales.topEstudiantes,
        peoresEstudiantes: datosActuales.peoresEstudiantes,
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

    // Actualizar solo el análisis IA
    await updateDoc(reporteRef, {
      analisisIA: analisisJSON,
      ultimaActualizacionIA: serverTimestamp(),
    });

    console.log('✅ Análisis IA semanal guardado');

    return NextResponse.json({
      success: true,
      message: 'Análisis IA semanal generado',
      timestamp: new Date().toISOString(),
    });

  } catch (error: any) {
    console.error('❌ Error generando análisis IA:', error);
    return NextResponse.json({
      success: false,
      error: error.message,
    }, { status: 500 });
  }
}