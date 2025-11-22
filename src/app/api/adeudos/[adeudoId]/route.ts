// /app/api/adeudos/[adeudoId]/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/firestore-operations-server';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ adeudoId: string }> }
) {
  try {
    const { adeudoId } = await params;
    const { searchParams } = new URL(request.url);
    const uid = searchParams.get('uid');

    if (!uid) {
      return NextResponse.json({
        success: false,
        message: 'UID requerido'
      }, { status: 400 });
    }

    const db = getDb();
    const adeudoDoc = await db
      .collection('Estudiantes')
      .doc(uid)
      .collection('Adeudos')
      .doc(adeudoId)
      .get();

    if (!adeudoDoc.exists) {
      return NextResponse.json({
        success: false,
        message: 'Adeudo no encontrado'
      }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      adeudo: adeudoDoc.data()
    });

  } catch (error: any) {
    console.error('[API | GET Adeudo]:', error);
    return NextResponse.json({
      success: false,
      message: 'Error al obtener el adeudo',
      error: error.message
    }, { status: 500 });
  }
}