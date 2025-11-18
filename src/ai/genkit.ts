import { genkit, z } from 'genkit';
import { googleAI } from '@genkit-ai/google-genai';

// 1. --- Exportamos el objeto `ai` centralizado ---
export const ai = genkit({
  plugins: [googleAI()],
  model: 'googleai/gemini-1.5-flash',
});

// 2. --- Definimos y exportamos la interfaz del estudiante ---
export interface Student {
  id: string;
  name: string;
  email: string;
}

// 3. --- Definimos y exportamos la herramienta de préstamos ---
export const loanTool = ai.defineTool(
  {
    name: 'loanTool',
    description: 'Herramienta para gestionar préstamos de estudiantes',
    inputSchema: z.object({
      studentId: z.string().describe("El ID del estudiante"),
      action: z.enum(['checkStatus', 'registerReturn']).describe("La acción a realizar"),
      loanId: z.string().optional().describe("El ID del préstamo, si es necesario"),
    }),
    outputSchema: z.object({
      status: z.string(),
      message: z.string(),
    }),
  },
  async (input) => {
    console.log(`[loanTool]: Ejecutando acción '${input.action}' para el estudiante ${input.studentId}`);
    return {
      status: 'success',
      message: `Acción ${input.action} completada para el estudiante ${input.studentId}.`,
    };
  }
);

// 4. --- Definimos y exportamos el prompt para los adeudos ---
export const overduePrompt = ai.definePrompt(
  {
    name: 'overduePrompt',
    input: {
      schema: z.object({ 
        student: z.object({
          id: z.string(),
          name: z.string(),
          email: z.string(),
        }),
        material: z.string(), 
        quantity: z.number(),
      }),
    },
    output: {
      format: 'text',
    },
  },
  async (input) => {
    const { student, material, quantity } = input;
    return {
      messages: [
        {
          role: 'user',
          content: [
            {
              text: `Eres Gastrobot, un asistente de laboratorio amigable y proactivo.
    
OBJETIVO:
Contactar a un estudiante que no ha devuelto un material a tiempo para entender el motivo.

CONTEXTO:
- Estudiante: ${student.name} (ID: ${student.id})
- Material no devuelto: ${quantity} unidad(es) de ${material}

TAREA:
- Inicia la conversación de forma amigable.
- Menciona el material y la cantidad pendiente.
- Pregunta directamente por qué no ha sido devuelto.
- Termina ofreciendo ayuda para resolver el problema.

Genera un mensaje corto y directo (máximo 3-4 líneas).`,
            },
          ],
        },
      ],
    };
  }
);