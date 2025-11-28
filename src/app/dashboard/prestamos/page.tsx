
'use client';

import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { LoaderCircle, ServerCrash, Archive, FileText } from 'lucide-react';
import BackButton from '@/components/molecules/BackButton';

// Defino el tipo de dato para un préstamo, para que el código sea más seguro.
interface Loan {
  id: string;
  nombreMaterial: string;
  cantidad: number;
  fechaInicio: string;
  fechaDevolucion: string;
  codigo: string;
}

// --- Componente de Tarjeta para mostrar un Préstamo ---
const LoanCard: React.FC<{ loan: Loan }> = ({ loan }) => {
  const formatDate = (dateString: string) => new Date(dateString).toLocaleDateString('es-MX', { day: '2-digit', month: 'long', year: 'numeric' });

  return (
    <div className="bg-white rounded-lg shadow-md border border-gray-200 hover:shadow-lg transition-shadow duration-300 overflow-hidden">
      <div className="p-5">
        <div className="flex justify-between items-start">
            <div>
                <h3 className="font-bold text-lg text-gray-800">{loan.nombreMaterial}</h3>
                <p className="text-sm text-gray-500 font-mono">{loan.codigo}</p>
            </div>
            <div className="text-right">
                <p className="text-sm text-gray-600">Cantidad</p>
                <p className="font-bold text-xl text-red-600">{loan.cantidad}</p>
            </div>
        </div>
        <div className="mt-4 pt-4 border-t border-gray-100 flex justify-between text-sm">
            <div>
                <p className="font-semibold text-gray-700">Fecha de Préstamo:</p>
                <p className="text-gray-600">{formatDate(loan.fechaInicio)}</p>
            </div>
            <div className="text-right">
                <p className="font-semibold text-gray-700">Fecha de Devolución:</p>
                <p className="text-gray-600 font-medium">{formatDate(loan.fechaDevolucion)}</p>
            </div>
        </div>
      </div>
    </div>
  );
};

// --- Página Principal que muestra la lista de Préstamos ---
const PrestamosPage = () => {
  const { data: session } = useSession();
  const [loans, setLoans] = useState<Loan[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (session?.user?.id) {
      const fetchLoans = async () => {
        try {
          setIsLoading(true);
          const response = await fetch(`/api/prestamos?studentUid=${session.user.id}`);
          if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || 'No se pudieron cargar los préstamos.');
          }
          const data: Loan[] = await response.json();
          setLoans(data);
        } catch (err: any) {
          setError(err.message);
        } finally {
          setIsLoading(false);
        }
      };

      fetchLoans();
    }
  }, [session]);

  return (
    <div className="p-4 sm:p-6 md:p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center gap-3 mb-6">
            <FileText className="h-8 w-8 text-red-600"/>
            <h1 className="text-3xl font-bold text-gray-800">Mis Préstamos Activos</h1>
        </div>

        {isLoading && (
          <div className="flex justify-center items-center h-64">
            <LoaderCircle className="h-12 w-12 text-red-500 animate-spin" />
            <p className="ml-4 text-gray-600">Cargando tus préstamos...</p>
          </div>
        )}

        {!isLoading && error && (
          <div className="flex flex-col items-center justify-center h-64 bg-red-50 border border-red-200 rounded-lg p-6">
            <ServerCrash className="h-12 w-12 text-red-500"/>
            <p className="mt-4 text-red-700 font-semibold">Error al cargar los datos</p>
            <p className="text-red-600 text-sm">{error}</p>
          </div>
        )}

        {!isLoading && !error && loans.length === 0 && (
          <div className="flex flex-col items-center justify-center h-64 bg-gray-50 border border-gray-200 rounded-lg p-6">
            <Archive className="h-12 w-12 text-gray-400"/>
            <p className="mt-4 text-gray-600 font-semibold">No tienes préstamos activos</p>
            <p className="text-gray-500 text-sm">Cuando solicites un material, aparecerá aquí.</p>
          </div>
        )}

        {!isLoading && !error && loans.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {loans.map(loan => <LoanCard key={loan.id} loan={loan} />)}
          </div>
        )}
      </div>
    </div>
  );
};

export default PrestamosPage;
