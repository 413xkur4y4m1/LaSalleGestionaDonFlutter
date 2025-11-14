
'use client';

import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { LoaderCircle, ServerCrash, CheckCircle, Archive } from 'lucide-react';

// Tipo de dato para un Préstamo Completado
interface CompletedLoan {
  id: string;
  nombreMaterial: string;
  cantidad: number;
  fechaInicio: string;
  fechaDevolucion: string; // La fecha en que realmente se devolvió
}

// --- Componente de Tarjeta para un Préstamo Completado ---
const CompletedLoanCard: React.FC<{ loan: CompletedLoan }> = ({ loan }) => {
  const formatDate = (dateString: string) => new Date(dateString).toLocaleDateString('es-MX', { day: '2-digit', month: 'long', year: 'numeric' });

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 opacity-80 hover:opacity-100 transition-opacity duration-300">
      <div className="p-5">
        <div className="flex justify-between items-start">
            <div>
                <h3 className="font-semibold text-lg text-gray-700">{loan.nombreMaterial}</h3>
                <p className="text-sm text-gray-500">Cantidad: <span className='font-medium'>{loan.cantidad}</span></p>
            </div>
            <div className="text-right flex items-center gap-2 text-green-600">
                <CheckCircle size={20} />
                <span className="font-bold text-sm">Devuelto</span>
            </div>
        </div>
        <div className="mt-4 pt-4 border-t border-gray-100 flex justify-between text-sm">
            <div>
                <p className="font-semibold text-gray-600">Se prestó:</p>
                <p className="text-gray-500">{formatDate(loan.fechaInicio)}</p>
            </div>
            <div className="text-right">
                <p className="font-semibold text-gray-600">Se devolvió:</p>
                <p className="text-gray-500 font-medium">{formatDate(loan.fechaDevolucion)}</p>
            </div>
        </div>
      </div>
    </div>
  );
};

// --- Página Principal que muestra la lista de Préstamos Completados ---
const CompletadosPage = () => {
  const { data: session } = useSession();
  const [completedLoans, setCompletedLoans] = useState<CompletedLoan[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (session?.user?.id) {
      const fetchCompleted = async () => {
        try {
          setIsLoading(true);
          const response = await fetch(`/api/completados?studentUid=${session.user.id}`);
          if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || 'No se pudo cargar el historial.');
          }
          const data: CompletedLoan[] = await response.json();
          setCompletedLoans(data);
        } catch (err: any) {
          setError(err.message);
        } finally {
          setIsLoading(false);
        }
      };

      fetchCompleted();
    }
  }, [session]);

  return (
    <div className="p-4 sm:p-6 md:p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center gap-3 mb-6">
            <CheckCircle className="h-8 w-8 text-green-600"/>
            <h1 className="text-3xl font-bold text-gray-800">Historial de Préstamos</h1>
        </div>

        {isLoading && (
          <div className="flex justify-center items-center h-64">
            <LoaderCircle className="h-12 w-12 text-green-500 animate-spin" />
            <p className="ml-4 text-gray-600">Cargando tu historial...</p>
          </div>
        )}

        {!isLoading && error && (
          <div className="flex flex-col items-center justify-center h-64 bg-red-50 border border-red-200 rounded-lg p-6">
            <ServerCrash className="h-12 w-12 text-red-500"/>
            <p className="mt-4 text-red-700 font-semibold">Error al cargar los datos</p>
            <p className="text-red-600 text-sm">{error}</p>
          </div>
        )}

        {!isLoading && !error && completedLoans.length === 0 && (
          <div className="flex flex-col items-center justify-center h-64 bg-gray-50 border border-gray-200 rounded-lg p-6">
            <Archive className="h-12 w-12 text-gray-400"/>
            <p className="mt-4 text-gray-600 font-semibold">Aún no tienes préstamos completados</p>
            <p className="text-gray-500 text-sm">Los préstamos que devuelvas a tiempo aparecerán aquí.</p>
          </div>
        )}

        {!isLoading && !error && completedLoans.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {completedLoans.map(loan => <CompletedLoanCard key={loan.id} loan={loan} />)}
          </div>
        )}
      </div>
    </div>
  );
};

export default CompletadosPage;
