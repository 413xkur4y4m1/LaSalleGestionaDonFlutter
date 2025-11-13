// lib/genkit.ts
import { genkit } from 'genkit';
import { enableFirebaseTelemetry } from '@genkit-ai/firebase';
import { googleAI } from '@genkit-ai/googleai';

// 🔹 Activa la telemetría de Firebase si usas Genkit con Firebase
enableFirebaseTelemetry();

export const ai = genkit({
  plugins: [
    googleAI({
      apiKey: process.env.GEMINI_API_KEY!,
      models: ['googleai/gemini-2.5-flash'], 
    }),
  ],
});
