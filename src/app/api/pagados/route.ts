// app/api/pagados/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/firestore-operations-server';
import { Timestamp } from 'firebase-admin/firestore';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
    try {
        const db = getDb();
        const { searchParams } = new URL(req.url);
        const studentUid = searchParams.get('studentUid');

        if (!studentUid) {
            return NextResponse.json({ 
                message: 'El ID del estudiante es requerido.' 
            }, { status: 400 });
        }

        console.log(`📊 Obteniendo pagos del estudiante: ${studentUid}`);

        // ✅ CORRECCIÓN: Usar .doc() para formar la ruta correcta
        const paidCollectionRef = db
            .collection('Estudiantes')
            .doc(studentUid)
            .collection('Pagados');

        // Ordenar por fecha de pago descendente
        const querySnapshot = await paidCollectionRef
            .orderBy('fechaPago', 'desc')
            .get();

        console.log(`✅ Encontrados ${querySnapshot.size} pagos`);

        const paidDebts = querySnapshot.docs.map(doc => {
            const data = doc.data();
            
            // Convertir timestamps de forma segura
            let fechaVencimiento = null;
            let fechaPago = null;

            try {
                if (data.fechaVencimiento) {
                    if (data.fechaVencimiento instanceof Timestamp) {
                        fechaVencimiento = data.fechaVencimiento.toDate().toISOString();
                    } else if (data.fechaVencimiento.toDate) {
                        fechaVencimiento = data.fechaVencimiento.toDate().toISOString();
                    }
                }
            } catch (e) {
                console.warn('Error convirtiendo fechaVencimiento:', e);
            }

            try {
                if (data.fechaPago) {
                    if (data.fechaPago instanceof Timestamp) {
                        fechaPago = data.fechaPago.toDate().toISOString();
                    } else if (data.fechaPago.toDate) {
                        fechaPago = data.fechaPago.toDate().toISOString();
                    }
                }
            } catch (e) {
                console.warn('Error convirtiendo fechaPago:', e);
            }

            return {
                id: doc.id,
                nombreMaterial: data.nombreMaterial || 'Material desconocido',
                precio_total: data.precio || data.precio_total || 0,
                fechaVencimiento: fechaVencimiento || new Date().toISOString(),
                fechaPago: fechaPago || new Date().toISOString(),
            };
        });

        return NextResponse.json(paidDebts, { status: 200 });

    } catch (error: any) {
        console.error("❌ Error al obtener los adeudos pagados:", error);
        return NextResponse.json({ 
            message: 'Error interno del servidor al obtener el historial de pagos.',
            error: error.message 
        }, { status: 500 });
    }
}