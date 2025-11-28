// app/dashboard/pagados/page.tsx
'use client';

import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { LoaderCircle, ServerCrash, BadgeCent, History } from 'lucide-react';
import BackButton from '@/components/molecules/BackButton';

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
  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleDateString('es-MX', { 
        day: '2-digit', 
        month: 'long', 
        year: 'numeric' 
      });
    } catch {
      return 'Fecha no disponible';
    }
  };
  
  const formatCurrency = (amount: number) => {
    return amount.toLocaleString('es-MX', { 
      style: 'currency', 
      currency: 'MXN' 
    });
  };

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
          setError(null);
          
          console.log('🔄 Cargando historial de pagos...');
          
          const response = await fetch(`/api/pagados?studentUid=${session.user.id}`);
          
          if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || 'No se pudo cargar el historial de pagos.');
          }
          
          const data: PaidDebt[] = await response.json();
          console.log('✅ Pagos cargados:', data.length);
          
          setPaidDebts(data);
        } catch (err: any) {
          console.error('❌ Error cargando pagos:', err);
          setError(err.message);
        } finally {
          setIsLoading(false);
        }
      };

      fetchPaidDebts();
    } else {
      setIsLoading(false);
    }
  }, [session]);

  return (
    <div className="min-h-screen bg-gray-50 p-4 sm:p-6 md:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header con BackButton */}
        <div className="mb-6">
          <BackButton showHome homeHref="/dashboard" className="mb-4" />
          
          <div className="flex items-center gap-3">
            <History className="h-8 w-8 text-blue-600"/>
            <h1 className="text-3xl font-bold text-gray-800">Historial de Pagos</h1>
          </div>
          <p className="text-gray-600 mt-2">Consulta todos los adeudos que has liquidado</p>
        </div>

        {/* Loading */}
        {isLoading && (
          <div className="flex justify-center items-center h-64 bg-white rounded-lg shadow-sm">
            <LoaderCircle className="h-12 w-12 text-blue-500 animate-spin" />
            <p className="ml-4 text-gray-600">Cargando tu historial de pagos...</p>
          </div>
        )}

        {/* Error */}
        {!isLoading && error && (
          <div className="flex flex-col items-center justify-center h-64 bg-red-50 border border-red-200 rounded-lg p-6">
            <ServerCrash className="h-12 w-12 text-red-500"/>
            <p className="mt-4 text-red-700 font-semibold">Error al cargar los datos</p>
            <p className="text-red-600 text-sm">{error}</p>
            <button 
              onClick={() => window.location.reload()}
              className="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
            >
              Reintentar
            </button>
          </div>
        )}

        {/* Empty State */}
        {!isLoading && !error && paidDebts.length === 0 && (
          <div className="flex flex-col items-center justify-center h-64 bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
            <BadgeCent className="h-16 w-16 text-gray-300"/>
            <p className="mt-4 text-gray-700 font-semibold text-lg">Aún no tienes pagos registrados</p>
            <p className="text-gray-500 text-sm text-center mt-2">
              Los adeudos que liquides aparecerán aquí.<br/>
              Mantén tu historial limpio devolviendo los materiales a tiempo.
            </p>
          </div>
        )}

        {/* Lista de Pagos */}
        {!isLoading && !error && paidDebts.length > 0 && (
          <>
            <div className="mb-4 text-sm text-gray-600">
              <span className="font-semibold">{paidDebts.length}</span> {paidDebts.length === 1 ? 'pago registrado' : 'pagos registrados'}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {paidDebts.map(debt => (
                <PaidDebtCard key={debt.id} debt={debt} />
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default PagadosPage;