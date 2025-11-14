
'use client';

import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { LoaderCircle, ServerCrash, AlertTriangle, ShieldAlert } from 'lucide-react';

// Tipo de dato para un Adeudo
interface Debt {
  id: string;
  nombreMaterial: string;
  cantidad: number;
  fechaVencimiento: string;
  codigo: string;
  precio_total: number;
}

// --- Componente de Tarjeta para mostrar un Adeudo ---
const DebtCard: React.FC<{ debt: Debt }> = ({ debt }) => {
  const formatDate = (dateString: string) => new Date(dateString).toLocaleDateString('es-MX', { day: '2-digit', month: 'long', year: 'numeric' });

  return (
    <div className="bg-white rounded-lg shadow-md border border-amber-300 hover:shadow-lg transition-shadow duration-300 overflow-hidden">
      <div className="p-5">
        <div className="flex justify-between items-start">
            <div>
                <h3 className="font-bold text-lg text-amber-900">{debt.nombreMaterial}</h3>
                <p className="text-sm text-gray-500 font-mono">{debt.codigo}</p>
            </div>
            <div className="text-right">
                <p className="text-sm text-gray-600">Monto</p>
                {/* El precio se formatea como moneda local */}
                <p className="font-bold text-xl text-amber-600">{debt.precio_total.toLocaleString('es-MX', { style: 'currency', currency: 'MXN' })}</p>
            </div>
        </div>
        <div className="mt-4 pt-4 border-t border-gray-100 flex justify-between items-center text-sm">
            <div>
                <p className="font-semibold text-gray-700">Fecha de Vencimiento:</p>
                <p className="text-red-600 font-bold">{formatDate(debt.fechaVencimiento)}</p>
            </div>
            {/* Aquí se podría añadir un botón para generar el formulario de pago */}
            <button className="bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded-lg text-xs transition-colors">
                Generar Formulario
            </button>
        </div>
      </div>
    </div>
  );
};

// --- Página Principal que muestra la lista de Adeudos ---
const AdeudosPage = () => {
  const { data: session } = useSession();
  const [debts, setDebts] = useState<Debt[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (session?.user?.id) {
      const fetchDebts = async () => {
        try {
          setIsLoading(true);
          const response = await fetch(`/api/adeudos?studentUid=${session.user.id}`);
          if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || 'No se pudieron cargar los adeudos.');
          }
          const data: Debt[] = await response.json();
          setDebts(data);
        } catch (err: any) {
          setError(err.message);
        } finally {
          setIsLoading(false);
        }
      };

      fetchDebts();
    }
  }, [session]);

  return (
    <div className="p-4 sm:p-6 md:p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center gap-3 mb-6">
            <ShieldAlert className="h-8 w-8 text-amber-600"/>
            <h1 className="text-3xl font-bold text-gray-800">Mis Adeudos</h1>
        </div>

        {isLoading && (
          <div className="flex justify-center items-center h-64">
            <LoaderCircle className="h-12 w-12 text-amber-500 animate-spin" />
            <p className="ml-4 text-gray-600">Buscando adeudos pendientes...</p>
          </div>
        )}

        {!isLoading && error && (
          <div className="flex flex-col items-center justify-center h-64 bg-red-50 border border-red-200 rounded-lg p-6">
            <ServerCrash className="h-12 w-12 text-red-500"/>
            <p className="mt-4 text-red-700 font-semibold">Error al cargar los datos</p>
            <p className="text-red-600 text-sm">{error}</p>
          </div>
        )}

        {!isLoading && !error && debts.length === 0 && (
          <div className="flex flex-col items-center justify-center h-64 bg-gray-50 border border-gray-200 rounded-lg p-6">
            <AlertTriangle className="h-12 w-12 text-gray-400"/>
            <p className="mt-4 text-gray-600 font-semibold">¡Estás al corriente!</p>
            <p className="text-gray-500 text-sm">No tienes ningún adeudo pendiente.</p>
          </div>
        )}

        {!isLoading && !error && debts.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {debts.map(debt => <DebtCard key={debt.id} debt={debt} />)}
          </div>
        )}
      </div>
    </div>
  );
};

export default AdeudosPage;
