// src/pages/api/chat.ts
import { z } from 'zod';
import { ai } from '../../../lib/genkit'; // instancia con el modelo por defecto
import { NextApiRequest, NextApiResponse } from 'next';
import * as admin from 'firebase-admin';
import { DocumentData } from 'firebase-admin/firestore';

// Inicialización lazy de Firebase Admin
function initializeFirebaseAdmin() {
  if (!admin.apps.length) {
    if (!process.env.FIREBASE_SERVICE_ACCOUNT_KEY) {
      throw new Error('FIREBASE_SERVICE_ACCOUNT_KEY is not set.');
    }
    const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY);
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
    });
  }
  return admin;
}

// Tool: préstamos activos
const getStudentLoans = ai.defineTool(
  {
    name: 'getStudentLoans',
    description: 'Obtiene la lista de préstamos de materiales activos para un estudiante.',
    inputSchema: z.object({ studentUid: z.string() }),
    outputSchema: z.array(
      z.object({
        nombreMaterial: z.string(),
        fechaDevolucion: z.string(),
      })
    ),
  },
  async ({ studentUid }: { studentUid: string }) => {
    const admin = initializeFirebaseAdmin();
    const db = admin.firestore();
    const loansSnapshot = await db
      .collection(`Estudiantes/${studentUid}/Prestamos`)
      .where('estado', '==', 'activo')
      .get();

    if (loansSnapshot.empty) return [];
    return loansSnapshot.docs.map((doc: DocumentData) => ({
      nombreMaterial: doc.data().nombreMaterial,
      fechaDevolucion: doc.data().fechaDevolucion
        .toDate()
        .toLocaleDateString('es-MX'),
    }));
  }
);

// Tool: adeudos pendientes
const getStudentDebts = ai.defineTool(
  {
    name: 'getStudentDebts',
    description: 'Obtiene la lista de adeudos pendientes de un estudiante.',
    inputSchema: z.object({ studentUid: z.string() }),
    outputSchema: z.array(
      z.object({
        nombreMaterial: z.string(),
        monto: z.number(),
        fechaVencimiento: z.string(),
      })
    ),
  },
  async ({ studentUid }: { studentUid: string }) => {
    const admin = initializeFirebaseAdmin();
    const db = admin.firestore();
    const debtsSnapshot = await db
      .collection(`Estudiantes/${studentUid}/Adeudos`)
      .where('estado', '==', 'pendiente')
      .get();

    if (debtsSnapshot.empty) return [];
    return debtsSnapshot.docs.map((doc: DocumentData) => ({
      nombreMaterial: doc.data().nombreMaterial,
      monto: doc.data().precio_ajustado,
      fechaVencimiento: doc.data().fechaVencimiento
        .toDate()
        .toLocaleDateString('es-MX'),
    }));
  }
);

// Flow principal
const studentChatFlow = ai.defineFlow(
  {
    name: 'studentChatFlow',
    inputSchema: z.object({
      studentUid: z.string(),
      history: z.array(z.any()),
    }),
    outputSchema: z.string(),
  },
  async (input: { studentUid: string; history: any[] }) => {
    const prompt = `
      Eres Don Flutter, el asistente virtual de la Universidad La Salle Nezahualcóyotl.
      El ID del estudiante actual es ${input.studentUid}.
      Usa este ID para consultar información con las herramientas disponibles.
      Sé amable y responde siempre en español.
      No reveles el studentUid en tus respuestas.
    `;

    // ✅ Llamada correcta con ai.generate()
    const response = await ai.generate({
      prompt,
    });

    // La propiedad .text es un getter asíncrono en esta versión
    return await response.text;
  }
);

// Handler de la API
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).end();

  try {
    const input = req.body;
    if (!input.studentUid || !input.history) {
      return res.status(400).json({ error: 'Missing studentUid or history' });
    }

    const output = await studentChatFlow.run(input);
    res.status(200).json({ response: output });
  } catch (error: any) {
    console.error('Error in /api/chat:', error);
    res.status(500).json({ error: error.message || 'An internal server error occurred.' });
  }
}
