import { NextRequest, NextResponse } from 'next/server';
import { handleOverdueLoans } from '@/lib/firestore-automation';

// To prevent Next.js from caching the response and to ensure this is treated as a dynamic function
export const dynamic = 'force-dynamic';

/**
 * API route to be called by a cron job.
 * This function triggers the logic to handle overdue loans.
 */
export async function GET(request: NextRequest) {
  // ✅ CORRECCIÓN: Protección con CRON_SECRET
  const authHeader = request.headers.get('Authorization');
  const cronSecret = process.env.CRON_SECRET;

  console.log('🔍 Debug Auth:', {
    receivedHeader: authHeader ? 'Presente' : 'Ausente',
    expectedSecret: cronSecret ? 'Configurado' : 'NO CONFIGURADO',
    match: authHeader === `Bearer ${cronSecret}`
  });

  if (!cronSecret) {
    console.error('❌ CRON_SECRET no está configurado en las variables de entorno');
    return NextResponse.json({ 
      error: "Error de configuración del servidor." 
    }, { status: 500 });
  }

  if (authHeader !== `Bearer ${cronSecret}`) {
    console.error('❌ Autorización fallida');
    return NextResponse.json({ 
      error: "No autorizado." 
    }, { status: 401 });
  }

  console.log("\n--- [CRON | handle-overdue-loans]: Iniciando proceso... ---");

  try {
    const result = await handleOverdueLoans();
    
    console.log(
      `--- [CRON | handle-overdue-loans]: Finalizado. ${result.processedLoans || 0} préstamos procesados. ---\n`
    );
    
    return NextResponse.json({ 
      message: 'Cron job executed successfully.', 
      ...result 
    });

  } catch (error: any) {
    // Log the detailed error on the server
    console.error('[CRON | handle-overdue-loans ERROR]:', error);
    
    // Send a generic error response to the client
    return NextResponse.json({ 
      error: 'Internal Server Error',
      message: error.message 
    }, { status: 500 });
  }
}