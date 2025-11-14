
'use client';

import { useSession } from 'next-auth/react';
import { useState, useEffect } from 'react';
import { updateStudentGroup } from '@/app/actions';

export default function GroupModal() {
  // Usamos 'update' por si en el futuro lo necesitamos, pero no es la solución principal ahora.
  const { data: session, status, update } = useSession(); 
  const [showModal, setShowModal] = useState(false);
  const [group, setGroup] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    // La lógica para mostrar el modal no cambia.
    if (status === 'authenticated' && session?.user && !session.user.grupo) {
      const timer = setTimeout(() => setShowModal(true), 1000);
      return () => clearTimeout(timer);
    } else {
      setShowModal(false);
    }
  }, [session, status]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!group.trim()) {
      setError('Por favor, ingresa tu grupo.');
      return;
    }
    if (!/^\d{3}[A-Z]?$/i.test(group)) {
        setError('El formato del grupo no es válido. Ejemplo: 101, 203M.');
        return;
    }

    setIsLoading(true);
    setError('');

    // Guardamos el grupo en la base de datos.
    const result = await updateStudentGroup(session!.user.id, group.trim());

    if (result.success) {
      // ✅ --- LA SOLUCIÓN DEFINITIVA Y SIMPLE ---
      // Forzamos una recarga completa de la página.
      // El backend de NextAuth (auth.ts) ahora es lo suficientemente inteligente
      // para leer el nuevo grupo de Firestore y crear una sesión correcta.
      // El modal ya no volverá a aparecer.
      console.log("Grupo guardado. Recargando la página para sincronizar la sesión...");
      window.location.reload();

    } else {
      setError(result.error || 'Ocurrió un error inesperado al guardar tu grupo.');
      setIsLoading(false);
    }
  };

  if (!showModal) {
    return null;
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-70 z-50 flex justify-center items-center">
      <div className="bg-white p-8 rounded-lg shadow-2xl max-w-sm w-full mx-4">
        <h2 className="text-2xl font-bold mb-4 text-gray-800">¡Un último paso!</h2>
        <p className="text-gray-600 mb-6">Detectamos que no tienes un grupo asignado. Por favor, ingrésalo para continuar.</p>
        
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label htmlFor="group" className="block text-sm font-medium text-gray-700 mb-2">Tu Grupo</label>
            <input
              id="group"
              type="text"
              value={group}
              onChange={(e) => setGroup(e.target.value.toUpperCase())}
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
              placeholder="Ej: 103, 201M"
              required
            />
          </div>

          {error && <p className="text-red-500 text-sm mb-4">{error}</p>}

          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-blue-600 text-white font-bold py-3 px-4 rounded-md hover:bg-blue-700 disabled:bg-gray-400 transition-colors duration-300"
          >
            {/* El botón se quedará en 'Guardando...' hasta que la página recargue */}
            {isLoading ? 'Guardando...' : 'Guardar y Continuar'}
          </button>
        </form>
      </div>
    </div>
  );
}
