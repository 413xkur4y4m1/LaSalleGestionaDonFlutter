
import { NextResponse } from 'next/server';
import { handleOverdueLoans } from '@/lib/firestore-automation';

// To prevent Next.js from caching the response and to ensure this is treated as a dynamic function
export const dynamic = 'force-dynamic';

/**
 * API route to be called by a cron job.
 * This function triggers the logic to handle overdue loans.
 * 
 * NOTE: For production, it's highly recommended to protect this endpoint with a secret key.
 * You can do this by checking for a secret in the request headers or query parameters.
 */
export async function GET() {
  try {
    const result = await handleOverdueLoans();
    
    // The 'result' object is { processedLoans: number }
    // We spread it into the response.
    return NextResponse.json({ 
      message: 'Cron job executed successfully.', 
      ...result 
    });

  } catch (error) {
    // Log the detailed error on the server
    console.error('Error in cron job API route:', error);
    
    // Send a generic error response to the client
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
