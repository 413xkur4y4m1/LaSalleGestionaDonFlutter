// app/api/cron/estadisticas/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/firebase';
import { collection, getDocs, doc, setDoc, getDoc, serverTimestamp } from 'firebase/firestore';
import { generateStatisticalAnalysis } from '@/lib/genkit';

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

// --- Recopilar datos de Firestore ---
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

// --- Calcular estadísticas básicas ---
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

// --- Endpoint GET para cron ---
export async function GET(req: NextRequest) {
  try {
    const authHeader = req.headers.get('authorization');
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log('🤖 Iniciando análisis estadístico automático...');

    const todosLosDatos = await recopilarDatos();
    console.log(`📊 Datos recopilados de ${todosLosDatos.length} estudiantes`);

    const estadisticas = calcularEstadisticas(todosLosDatos);

    // --- Verificar si ha pasado 24h para análisis IA ---
    const reporteRef = doc(db, 'Estadisticas', 'reporte_actual');
    const reporteSnap = await getDoc(reporteRef);
    const ultimaActualizacion = reporteSnap.exists() ? (reporteSnap.data().ultimaActualizacion?.toDate?.() || 0) : 0;
    const ahora = Date.now();
    const DIAS_24 = 24 * 60 * 60 * 1000;

    let analisisJSON = reporteSnap.exists() ? reporteSnap.data().analisisIA || null : null;

    if (!analisisJSON || ahora - ultimaActualizacion > DIAS_24) {
      console.log('🧠 Generando análisis con IA (cada 24h)...');
      try {
        const analisisIA = await generateStatisticalAnalysis({
          prestamos: todosLosDatos.flatMap(e => e.prestamos),
          adeudos: todosLosDatos.flatMap(e => e.adeudos),
          completados: todosLosDatos.flatMap(e => e.completados),
          pagados: todosLosDatos.flatMap(e => e.pagados),
        });

        const analisisTexto = analisisIA.text;
        try {
          analisisJSON = JSON.parse(analisisTexto);
        } catch {
          analisisJSON = {
            resumen_ejecutivo: analisisTexto,
            insights: [],
            predicciones: [],
            recomendaciones: [],
            alertas: [],
            tendencias: [],
          };
        }
      } catch (error: any) {
        console.error('❌ Error generando análisis IA:', error);
        analisisJSON = {
          resumen_ejecutivo: 'Error generando análisis IA',
          insights: [],
          predicciones: [],
          recomendaciones: [],
          alertas: [],
          tendencias: [],
        };
      }
    }

    // --- Guardar en Firestore ---
    await setDoc(reporteRef, {
      ...estadisticas,
      analisisIA: analisisJSON,
      ultimaActualizacion: serverTimestamp(),
      version: Date.now(),
    });

    console.log('✅ Estadísticas guardadas exitosamente');

    return NextResponse.json({
      success: true,
      message: 'Estadísticas generadas correctamente',
      timestamp: new Date().toISOString(),
    });

  } catch (error: any) {
    console.error('❌ Error generando estadísticas:', error);
    return NextResponse.json({
      success: false,
      error: error.message,
    }, { status: 500 });
  }
}
