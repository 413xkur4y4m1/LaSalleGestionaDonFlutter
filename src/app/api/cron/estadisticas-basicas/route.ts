// app/api/cron/estadisticas-basicas/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/firebase';
import { collection, getDocs, doc, setDoc, getDoc, serverTimestamp } from 'firebase/firestore';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

interface EstudianteData {
  uid: string;
  nombre: string;
  grupo: string;
  prestamos: any[];
  adeudos: any[];
  completados: any[];
  pagados: any[];
}

async function recopilarDatos() {
  const estudiantesSnapshot = await getDocs(collection(db, 'Estudiantes'));
  const todosLosDatos: EstudianteData[] = [];

  for (const estudianteDoc of estudiantesSnapshot.docs) {
    const uid = estudianteDoc.id;
    const datosEstudiante = estudianteDoc.data();

    const prestamosSnap = await getDocs(collection(db, `Estudiantes/${uid}/Prestamos`));
    const adeudosSnap = await getDocs(collection(db, `Estudiantes/${uid}/Adeudos`));
    const completadosSnap = await getDocs(collection(db, `Estudiantes/${uid}/Completados`));
    const pagadosSnap = await getDocs(collection(db, `Estudiantes/${uid}/Pagados`));

    todosLosDatos.push({
      uid,
      nombre: datosEstudiante.nombre,
      grupo: datosEstudiante.grupo,
      prestamos: prestamosSnap.docs.map(d => d.data()),
      adeudos: adeudosSnap.docs.map(d => d.data()),
      completados: completadosSnap.docs.map(d => d.data()),
      pagados: pagadosSnap.docs.map(d => d.data()),
    });
  }

  return todosLosDatos;
}

function calcularEstadisticas(datos: EstudianteData[]) {
  const materialCount: Record<string, number> = {};
  const materialPerdido: Record<string, { count: number; tipo: string }> = {};
  const estudianteScore: Record<string, { nombre: string; grupo: string; completados: number; adeudos: number; score: number }> = {};

  datos.forEach(estudiante => {
    estudiante.prestamos.forEach(p => {
      materialCount[p.nombreMaterial] = (materialCount[p.nombreMaterial] || 0) + 1;
    });

    estudiante.adeudos.forEach(a => {
      if (!materialPerdido[a.nombreMaterial]) {
        materialPerdido[a.nombreMaterial] = { count: 0, tipo: a.tipo || 'desconocido' };
      }
      materialPerdido[a.nombreMaterial].count++;
    });

    const completados = estudiante.completados.length;
    const adeudos = estudiante.adeudos.length;
    const score = completados - (adeudos * 2);

    estudianteScore[estudiante.uid] = {
      nombre: estudiante.nombre,
      grupo: estudiante.grupo,
      completados,
      adeudos,
      score,
    };
  });

  const topMateriales = Object.entries(materialCount)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5)
    .map(([material, cantidad]) => ({ material, cantidad }));

  const topPerdidos = Object.entries(materialPerdido)
    .sort(([, a], [, b]) => b.count - a.count)
    .slice(0, 5)
    .map(([material, data]) => ({ material, cantidad: data.count, tipo: data.tipo }));

  const topEstudiantes = Object.values(estudianteScore)
    .sort((a, b) => b.score - a.score)
    .slice(0, 5);

  const peoresEstudiantes = Object.values(estudianteScore)
    .sort((a, b) => a.score - b.score)
    .slice(0, 5);

  return {
    topMateriales,
    topPerdidos,
    topEstudiantes,
    peoresEstudiantes,
    totalPrestamos: datos.reduce((sum, e) => sum + e.prestamos.length, 0),
    totalAdeudos: datos.reduce((sum, e) => sum + e.adeudos.length, 0),
    totalCompletados: datos.reduce((sum, e) => sum + e.completados.length, 0),
    totalEstudiantes: datos.length,
  };
}

function generarContextoGraficas(estadisticas: any) {
  return {
    resumen_ejecutivo: `Dashboard actualizado con ${estadisticas.totalEstudiantes} estudiantes activos. Se registran ${estadisticas.totalPrestamos} préstamos totales, de los cuales ${estadisticas.totalCompletados} han sido completados exitosamente y ${estadisticas.totalAdeudos} presentan adeudos pendientes.`,
    
    insights: [
      `El material más solicitado es "${estadisticas.topMateriales[0]?.material || 'N/A'}" con ${estadisticas.topMateriales[0]?.cantidad || 0} préstamos`,
      `Se identificaron ${estadisticas.topPerdidos.length} materiales con alta tasa de pérdida o daño`,
      `La tasa de cumplimiento general es del ${estadisticas.totalPrestamos > 0 ? ((estadisticas.totalCompletados / estadisticas.totalPrestamos) * 100).toFixed(1) : 0}%`
    ],
    
    predicciones: [
      'Los datos se actualizan cada 3 minutos para reflejar el estado actual del inventario',
      'El análisis detallado con IA se genera semanalmente para identificar tendencias a largo plazo'
    ],
    
    recomendaciones: [
      'Monitorear materiales con alta tasa de pérdida para implementar medidas preventivas',
      'Reconocer a los estudiantes con mejor historial de devoluciones',
      'Revisar los casos de adeudos pendientes y contactar a los estudiantes correspondientes'
    ],
    
    alertas: estadisticas.topPerdidos.slice(0, 3).map((item: any) => ({
      tipo: 'material_riesgo',
      mensaje: `"${item.material}" presenta ${item.cantidad} casos de ${item.tipo}`,
      prioridad: item.cantidad > 5 ? 'alta' : 'media'
    })),
    
    tendencias: [
      'Las gráficas muestran los 5 materiales principales en cada categoría',
      'El gráfico de pastel refleja la distribución actual de transacciones',
      'La curva de comportamiento estudiantil sigue una distribución normal esperada'
    ]
  };
}

export async function GET(req: NextRequest) {
  try {
    const authHeader = req.headers.get('authorization');
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log('🤖 [ESTADÍSTICAS BÁSICAS] Iniciando recopilación...');

    const todosLosDatos = await recopilarDatos();
    console.log(`📊 Datos recopilados de ${todosLosDatos.length} estudiantes`);

    const estadisticas = calcularEstadisticas(todosLosDatos);
    const contextoGraficas = generarContextoGraficas(estadisticas);

    // Obtener el análisis IA previo (si existe)
    const reporteRef = doc(db, 'Estadisticas', 'reporte_actual');
    const reporteSnap = await getDoc(reporteRef);
    const analisisIAPrevio = reporteSnap.exists() ? reporteSnap.data().analisisIA : null;

    // Guardar estadísticas básicas + contexto + análisis IA previo
    await setDoc(reporteRef, {
      ...estadisticas,
      contextoGraficas, // Contexto simple para entender las gráficas
      analisisIA: analisisIAPrevio || contextoGraficas, // Usar IA previo o contexto básico
      ultimaActualizacion: serverTimestamp(),
      ultimaActualizacionIA: reporteSnap.exists() ? reporteSnap.data().ultimaActualizacionIA : null,
      version: Date.now(),
    });

    console.log('✅ Estadísticas básicas guardadas');

    return NextResponse.json({
      success: true,
      message: 'Estadísticas básicas generadas',
      timestamp: new Date().toISOString(),
    });

  } catch (error: any) {
    console.error('❌ Error:', error);
    return NextResponse.json({
      success: false,
      error: error.message,
    }, { status: 500 });
  }
}