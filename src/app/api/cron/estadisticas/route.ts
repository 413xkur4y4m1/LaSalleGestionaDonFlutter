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

async function recopilarDatos() {
  const estudiantesSnapshot = await getDocs(collection(db, 'Estudiantes'));
  const todosLosDatos: EstudianteData[] = [];

  for (const estudianteDoc of estudiantesSnapshot.docs) {
    const uid = estudianteDoc.id;
    const datosEstudiante = estudianteDoc.data();

    // Obtener subcolecciones
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
  // Material más solicitado
  const materialCount: Record<string, number> = {};
  const materialPerdido: Record<string, { count: number; tipo: string }> = {};
  const estudianteScore: Record<string, { nombre: string; grupo: string; completados: number; adeudos: number; score: number }> = {};

  datos.forEach(estudiante => {
    // Contar préstamos
    estudiante.prestamos.forEach(p => {
      materialCount[p.nombreMaterial] = (materialCount[p.nombreMaterial] || 0) + 1;
    });

    // Contar adeudos
    estudiante.adeudos.forEach(a => {
      if (!materialPerdido[a.nombreMaterial]) {
        materialPerdido[a.nombreMaterial] = { count: 0, tipo: a.tipo || 'desconocido' };
      }
      materialPerdido[a.nombreMaterial].count++;
    });

    // Score del estudiante
    const completados = estudiante.completados.length;
    const adeudos = estudiante.adeudos.length;
    const score = completados - (adeudos * 2); // Penalizar más los adeudos

    estudianteScore[estudiante.uid] = {
      nombre: estudiante.nombre,
      grupo: estudiante.grupo,
      completados,
      adeudos,
      score,
    };
  });

  // Top 5 materiales más solicitados
  const topMateriales = Object.entries(materialCount)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5)
    .map(([material, cantidad]) => ({ material, cantidad }));

  // Top 5 materiales más perdidos
  const topPerdidos = Object.entries(materialPerdido)
    .sort(([, a], [, b]) => b.count - a.count)
    .slice(0, 5)
    .map(([material, data]) => ({ material, cantidad: data.count, tipo: data.tipo }));

  // Top 5 mejores estudiantes
  const topEstudiantes = Object.values(estudianteScore)
    .sort((a, b) => b.score - a.score)
    .slice(0, 5);

  // Top 5 peores estudiantes
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

export async function GET(req: NextRequest) {
  try {
    // Verificar que sea el cron job
    const authHeader = req.headers.get('authorization');
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log('🤖 Iniciando análisis estadístico automático...');

    // 1. Recopilar datos
    const todosLosDatos = await recopilarDatos();
    console.log(`📊 Datos recopilados de ${todosLosDatos.length} estudiantes`);

    // 2. Calcular estadísticas
    const estadisticas = calcularEstadisticas(todosLosDatos);

    // 3. Generar análisis con IA
    console.log('🧠 Generando análisis con IA...');
    const analisisJSON = await generateStatisticalAnalysis({
      prestamos: todosLosDatos.flatMap(e => e.prestamos),
      adeudos: todosLosDatos.flatMap(e => e.adeudos),
      completados: todosLosDatos.flatMap(e => e.completados),
      pagados: todosLosDatos.flatMap(e => e.pagados),
    });

    // 4. Guardar en Firestore
    await setDoc(doc(db, 'Estadisticas', 'reporte_actual'), {
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