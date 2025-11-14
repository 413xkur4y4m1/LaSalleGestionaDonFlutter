
'use server';

import { revalidatePath } from 'next/cache';
import { getDb } from '@/lib/firestore-operations-server';

/**
 * Server Action para actualizar el grupo de un estudiante.
 * @param userId - El ID del usuario a actualizar.
 * @param newGroup - El nuevo grupo a asignar.
 * @returns Un objeto indicando el éxito o el fracaso de la operación.
 */
export async function updateStudentGroup(userId: string, newGroup: string) {
  if (!userId || !newGroup) {
    return { success: false, error: 'El ID de usuario y el grupo son requeridos.' };
  }

  try {
    console.log(`Intentando actualizar grupo para el usuario ${userId} a ${newGroup}`);
    const db = getDb();
    const studentRef = db.collection('Estudiantes').doc(userId);

    await studentRef.update({
      grupo: newGroup.toUpperCase(),
    });

    console.log(`Grupo actualizado con éxito para ${userId}`);
    
    // Invalida el caché de la ruta para forzar la recarga de datos de sesión en el cliente
    revalidatePath('/');

    return { success: true };
  } catch (error) {
    console.error('Error al actualizar el grupo:', error);
    // En un caso real, podrías querer registrar el error de forma más detallada.
    return { success: false, error: 'No se pudo actualizar el grupo en la base de datos.' };
  }
}
