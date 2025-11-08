import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from "../auth/[...nextauth]/authOptions";
import { db } from '@/lib/firebase';
import { collection, getDocs } from 'firebase/firestore';

// NOTE: Genkit initialization (structure only, no real API key usage)
// User will add actual Genkit SDK calls

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { message, action } = await req.json();

    // Route based on action
    switch (action) {
      case 'send_message':
        return await handleMessage(message, session.user.id);

      case 'request_catalog':
        return await fetchMaterialCatalog();

      case 'create_loan':
        return await createLoanRequest(req.body, session.user.id);

      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }
  } catch (error) {
    console.error('Genkit API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// Handle general message (intent detection)
async function handleMessage(message: string, userId: string) {
  // TODO: Add Genkit intent detection
  // For now, simple keyword matching

  const lowerMessage = message.toLowerCase();

  if (lowerMessage.includes('préstamo') || lowerMessage.includes('pedir')) {
    return NextResponse.json({
      response: '¡Perfecto! Voy a mostrarte el catálogo de materiales disponibles.',
      nextAction: 'show_catalog'
    });
  }

  if (lowerMessage.includes('ayuda') || lowerMessage.includes('cómo')) {
    return NextResponse.json({
      response: 'Puedo ayudarte a:\n• Solicitar un préstamo de material\n• Consultar tus préstamos activos\n• Responder preguntas sobre el sistema\n\n¿Qué necesitas?',
      nextAction: null
    });
  }

  return NextResponse.json({
    response: 'Entiendo. ¿En qué más puedo ayudarte? Puedes pedirme un préstamo o hacer preguntas sobre el sistema.',
    nextAction: null
  });
}

// Fetch materials from Firestore
async function fetchMaterialCatalog() {
  const materialsRef = collection(db, 'materials');
  const snapshot = await getDocs(materialsRef);

  const materials = snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  }));

  return NextResponse.json({
    materials,
    message: 'Catálogo cargado exitosamente'
  });
}

// Create loan request
async function createLoanRequest(data: any, userId: string) {
  const { materialId, cantidad, fechaDevolucion } = data;

  // Generate loan code
  const codigo = `PRST-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;

  // TODO: Save to Firestore Estudiantes/{userId}/Prestamos
  // TODO: Update materials inventory
  // TODO: Send Outlook notification

  return NextResponse.json({
    success: true,
    codigo,
    message: 'Préstamo creado exitosamente'
  });
}