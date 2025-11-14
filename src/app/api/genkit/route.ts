
import { NextRequest, NextResponse } from 'next/server';
// CORRECCIÓN FINAL: La ruta correcta es @/ai/genkit, no @/lib/genkit
import { ai } from '@/ai/genkit';

// --- ENDPOINT DE LA API DE GENKIT ---
export async function POST(req: NextRequest) {
  try {
    const { history, prompt } = await req.json();

    if (!prompt) {
      return NextResponse.json({ error: 'El prompt es requerido.' }, { status: 400 });
    }

    const llmResponse = await ai.generate({
      model: 'googleai/gemini-pro', // Cambiado a gemini-pro que es más común, puedes ajustarlo.
      prompt: `Eres un asistente de laboratorio llamado Gastrobot. Tu misión es ser amable, servicial y responder de forma clara y concisa. Historial del chat: ${JSON.stringify(history)}. Pregunta del usuario: ${prompt}`,
      config: {
        temperature: 0.5,
      },
    });

    // Retornamos la respuesta de texto generada
    return NextResponse.json({ response: llmResponse.text }, { status: 200 });

  } catch (error: any) {
    console.error('Error en la API de Genkit:', error);
    return NextResponse.json(
      { error: error.message || 'Error interno al procesar la solicitud de Genkit.' },
      { status: 500 }
    );
  }
}
