// /app/api/formularios/[formId]/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/firestore-operations-server';

export async function GET(
  request: NextRequest,
  { params }: { params: { formId: string } }
) {
  try {
    const { formId } = params;
    const db = getDb();

    // Buscar en la colección global
    const formDoc = await db.collection('FormulariosGlobal').doc(formId).get();

    if (!formDoc.exists) {
      return NextResponse.json({
        success: false,
        message: 'Formulario no encontrado'
      }, { status: 404 });
    }

    const formulario = formDoc.data();

    return NextResponse.json({
      success: true,
      formulario: formulario
    });

  } catch (error: any) {
    console.error('[API | GET Formulario]:', error);
    return NextResponse.json({
      success: false,
      message: 'Error al obtener el formulario',
      error: error.message
    }, { status: 500 });
  }
}