
'use client';

import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { LoaderCircle, ServerCrash, BadgeCent, History } from 'lucide-react';

// Tipo de dato para un Adeudo Pagado
interface PaidDebt {
  id: string;
  nombreMaterial: string;
  precio_total: number;
  fechaVencimiento: string;
  fechaPago: string; 
}

// --- Componente de Tarjeta para un Adeudo Pagado ---
const PaidDebtCard: React.FC<{ debt: PaidDebt }> = ({ debt }) => {
  const formatDate = (dateString: string) => new Date(dateString).toLocaleDateString('es-MX', { day: '2-digit', month: 'long', year: 'numeric' });
  const formatCurrency = (amount: number) => amount.toLocaleString('es-MX', { style: 'currency', currency: 'MXN' });

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 opacity-80 hover:opacity-100 transition-opacity duration-300">
      <div className="p-5">
        <div className="flex justify-between items-start">
            <div>
                <h3 className="font-semibold text-lg text-gray-700">{debt.nombreMaterial}</h3>
                <p className="text-sm text-gray-500">Monto liquidado</p>
                <p className="font-bold text-lg text-blue-700">{formatCurrency(debt.precio_total)}</p>
            </div>
            <div className="text-right flex items-center gap-2 text-blue-600">
                <BadgeCent size={20} />
                <span className="font-bold text-sm">Liquidado</span>
            </div>
        </div>
        <div className="mt-4 pt-4 border-t border-gray-100 flex justify-between text-sm">
            <div>
                <p className="font-semibold text-gray-600">Venció el:</p>
                <p className="text-gray-500">{formatDate(debt.fechaVencimiento)}</p>
            </div>
            <div className="text-right">
                <p className="font-semibold text-gray-600">Se pagó el:</p>
                <p className="text-gray-500 font-medium">{formatDate(debt.fechaPago)}</p>
            </div>
        </div>
      </div>
    </div>
  );
};

// --- Página Principal que muestra la lista de Adeudos Pagados ---
const PagadosPage = () => {
  const { data: session } = useSession();
  const [paidDebts, setPaidDebts] = useState<PaidDebt[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (session?.user?.id) {
      const fetchPaidDebts = async () => {
        try {
          setIsLoading(true);
          const response = await fetch(`/api/pagados?studentUid=${session.user.id}`);
          if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || 'No se pudo cargar el historial de pagos.');
          }
          const data: PaidDebt[] = await response.json();
          setPaidDebts(data);
        } catch (err: any) {
          setError(err.message);
        } finally {
          setIsLoading(false);
        }
      };

      fetchPaidDebts();
    }
  }, [session]);

  return (
    <div className="p-4 sm:p-6 md:p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center gap-3 mb-6">
            <History className="h-8 w-8 text-blue-600"/>
            <h1 className="text-3xl font-bold text-gray-800">Historial de Pagos</h1>
        </div>

        {isLoading && (
          <div className="flex justify-center items-center h-64">
            <LoaderCircle className="h-12 w-12 text-blue-500 animate-spin" />
            <p className="ml-4 text-gray-600">Cargando tu historial de pagos...</p>
          </div>
        )}

        {!isLoading && error && (
          <div className="flex flex-col items-center justify-center h-64 bg-red-50 border border-red-200 rounded-lg p-6">
            <ServerCrash className="h-12 w-12 text-red-500"/>
            <p className="mt-4 text-red-700 font-semibold">Error al cargar los datos</p>
            <p className="text-red-600 text-sm">{error}</p>
          </div>
        )}

        {!isLoading && !error && paidDebts.length === 0 && (
          <div className="flex flex-col items-center justify-center h-64 bg-gray-50 border border-gray-200 rounded-lg p-6">
            <BadgeCent className="h-12 w-12 text-gray-400"/>
            <p className="mt-4 text-gray-600 font-semibold">Aún no tienes pagos registrados</p>
            <p className="text-gray-500 text-sm">Los adeudos que liquides aparecerán aquí.</p>
          </div>
        )}

        {!isLoading && !error && paidDebts.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {paidDebts.map(debt => <PaidDebtCard key={debt.id} debt={debt} />)}
          </div>
        )}
      </div>
    </div>
  );
};

export default PagadosPage;
