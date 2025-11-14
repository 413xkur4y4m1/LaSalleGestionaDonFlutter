
import { NextRequest, NextResponse } from 'next/server';
// La ruta correcta es @/ai/genkit, como lo indica el comentario.
import { ai } from '@/ai/genkit';

// --- ENDPOINT DE LA API DE GENKIT ---
export async function POST(req: NextRequest) {
  try {
    const { history, prompt } = await req.json();

    if (!prompt) {
      return NextResponse.json({ error: 'El prompt es requerido.' }, { status: 400 });
    }

    const llmResponse = await ai.generate({
      // ✅ CORRECCIÓN: Usamos el modelo definido en la configuración de genkit.
      // El error ocurría porque se pedía 'gemini-pro', que no estaba en la lista.
      model: 'googleai/gemini-1.5-flash', 
      prompt: `Eres un asistente de laboratorio llamado Gastrobot. Tu misión es ser amable, servicial y responder de forma clara y concisa. Historial del chat: ${JSON.stringify(history)}. Pregunta del usuario: ${prompt}`,
      config: {
        temperature: 0.5,
      },
    });

    // Retornamos la respuesta de texto generada
    return NextResponse.json({ response: llmResponse.text }, { status: 200 });

  } catch (error: any) {
    console.error("[Genkit API Error]", error);
    // Proveemos un mensaje de error más específico en la respuesta
    return NextResponse.json({ error: error.message || 'Error al comunicarse con el modelo de IA.' }, { status: 500 });
  }
}
