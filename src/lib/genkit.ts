// lib/genkit.ts
import { genkit } from 'genkit';
import { googleAI } from '@genkit-ai/googleai';
import { z } from 'zod';

export const ai = genkit({
  plugins: [
    googleAI({
      apiKey: process.env.GEMINI_API_KEY, // ✅ Usar GEMINI_API_KEY
    }),
  ],
  model: 'googleai/gemini-2.0-flash-exp',
});

export const generateStatisticalAnalysis = ai.definePrompt(
  {
    name: 'statisticalAnalysis',
    input: {
      schema: z.object({
        prestamos: z.array(z.any()),
        adeudos: z.array(z.any()),
        completados: z.array(z.any()),
        pagados: z.array(z.any()),
      }),
    },
  },
  `
  Eres un analista de datos experto en gestión de inventarios educativos.
  
  Analiza los siguientes datos y genera un reporte estadístico detallado en español:
  
  **PRÉSTAMOS:**
  {{prestamos}}
  
  **ADEUDOS:**
  {{adeudos}}
  
  **COMPLETADOS:**
  {{completados}}
  
  **PAGADOS:**
  {{pagados}}
  
  Genera un análisis que incluya:
  1. **Insights principales**: 3-5 hallazgos clave sobre el comportamiento
  2. **Predicciones**: Qué materiales podrían tener problemas próximamente
  3. **Recomendaciones**: Acciones específicas para mejorar la gestión
  4. **Alertas**: Estudiantes o materiales que requieren atención inmediata
  5. **Tendencias**: Patrones temporales observados
  
  Formato JSON:
  {
    "resumen_ejecutivo": "string",
    "insights": ["string"],
    "predicciones": ["string"],
    "recomendaciones": ["string"],
    "alertas": [{"tipo": "string", "mensaje": "string", "prioridad": "alta|media|baja"}],
    "tendencias": ["string"]
  }
  `
);