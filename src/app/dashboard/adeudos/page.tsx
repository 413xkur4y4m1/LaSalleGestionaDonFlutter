'use client';

import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { LoaderCircle, ServerCrash, AlertTriangle, ShieldAlert, TrendingUp, DollarSign } from 'lucide-react';
import DebtFilters from '@/components/molecules/DebtFilters'; // Ajusta la ruta según tu estructura

// Tipo de dato para un Adeudo
interface Debt {
  id: string;
  codigo: string;
  nombreMaterial: string;
  cantidad: number;
  precio_unitario: number;
  precio_ajustado: number;
  moneda: string;
  estado: string;
  tipo: string;
  fechaVencimiento: string | null;
  grupo: string;
  prestamoOriginal: string | null;
}

// --- Componente de Tarjeta para mostrar un Adeudo ---
const DebtCard: React.FC<{ debt: Debt }> = ({ debt }) => {
  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('es-MX', { 
      day: '2-digit', 
      month: 'long', 
      year: 'numeric' 
    });
  };

  // Calcular antigüedad del adeudo
  const getAntiguedad = (fechaVencimiento: string | null) => {
    if (!fechaVencimiento) return null;
    const vencimiento = new Date(fechaVencimiento);
    const now = new Date();
    const diffDays = Math.floor((now.getTime() - vencimiento.getTime()) / (1000 * 60 * 60 * 24));
    
    if (diffDays <= 30) return { texto: 'Reciente', color: 'text-yellow-600', bg: 'bg-yellow-50' };
    if (diffDays <= 90) return { texto: `${diffDays} días`, color: 'text-orange-600', bg: 'bg-orange-50' };
    if (diffDays <= 180) return { texto: `${Math.floor(diffDays / 30)} meses`, color: 'text-red-600', bg: 'bg-red-50' };
    return { texto: 'Muy antiguo', color: 'text-red-800', bg: 'bg-red-100' };
  };

  const antiguedad = getAntiguedad(debt.fechaVencimiento);

  // Iconos según tipo
  const getTipoIcon = (tipo: string) => {
    switch (tipo) {
      case 'rotura': return '🔨';
      case 'perdida': return '❌';
      case 'vencimiento': return '⏰';
      default: return '📦';
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md border border-amber-300 hover:shadow-lg transition-all duration-300 overflow-hidden">
      <div className="p-5">
        <div className="flex justify-between items-start">
            <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-2xl">{getTipoIcon(debt.tipo)}</span>
                  <h3 className="font-bold text-lg text-amber-900">{debt.nombreMaterial}</h3>
                </div>
                <p className="text-sm text-gray-500 font-mono">{debt.codigo}</p>
                <p className="text-sm text-gray-600 mt-1">Cantidad: {debt.cantidad}</p>
                
                {/* Badge de estado */}
                <span className={`inline-block mt-2 px-3 py-1 text-xs font-semibold rounded-full ${
                  debt.estado === 'pendiente' ? 'bg-red-100 text-red-700' :
                  debt.estado === 'pagado' ? 'bg-green-100 text-green-700' :
                  'bg-blue-100 text-blue-700'
                }`}>
                  {debt.estado === 'pendiente' ? '⏳ Pendiente' :
                   debt.estado === 'pagado' ? '✅ Pagado' : '🔄 Devuelto'}
                </span>
            </div>
            <div className="text-right">
                <p className="text-sm text-gray-600">Monto Total</p>
                <p className="font-bold text-xl text-amber-600">
                  {debt.precio_ajustado.toLocaleString('es-MX', { 
                    style: 'currency', 
                    currency: debt.moneda || 'MXN' 
                  })}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  Unitario: {debt.precio_unitario.toLocaleString('es-MX', { 
                    style: 'currency', 
                    currency: debt.moneda || 'MXN' 
                  })}
                </p>
            </div>
        </div>
        
        <div className="mt-4 pt-4 border-t border-gray-100 space-y-2">
            <div>
              <p className="font-semibold text-gray-700 text-sm">Fecha de Vencimiento:</p>
              <p className="text-red-600 font-bold">{formatDate(debt.fechaVencimiento)}</p>
            </div>
            
            {/* Indicador de antigüedad */}
            {antiguedad && (
              <div className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${antiguedad.bg} ${antiguedad.color}`}>
                {antiguedad.texto}
              </div>
            )}
            
            <p className="text-xs text-gray-500 capitalize">Tipo: {debt.tipo}</p>
        </div>
      </div>
    </div>
  );
};

// --- Componente de Resumen Estadístico ---
const DebtSummary: React.FC<{ debts: Debt[] }> = ({ debts }) => {
  const totalDebt = debts.reduce((sum, debt) => sum + debt.precio_ajustado, 0);
  const pendingDebts = debts.filter(d => d.estado === 'pendiente');
  const paidDebts = debts.filter(d => d.estado === 'pagado');

  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
      <div className="bg-gradient-to-br from-amber-50 to-amber-100 rounded-lg p-4 border border-amber-200">
        <div className="flex items-center gap-3">
          <DollarSign className="h-8 w-8 text-amber-600" />
          <div>
            <p className="text-sm text-gray-600">Total Adeudado</p>
            <p className="text-2xl font-bold text-amber-700">
              {totalDebt.toLocaleString('es-MX', { style: 'currency', currency: 'MXN' })}
            </p>
          </div>
        </div>
      </div>

      <div className="bg-gradient-to-br from-red-50 to-red-100 rounded-lg p-4 border border-red-200">
        <div className="flex items-center gap-3">
          <AlertTriangle className="h-8 w-8 text-red-600" />
          <div>
            <p className="text-sm text-gray-600">Pendientes</p>
            <p className="text-2xl font-bold text-red-700">{pendingDebts.length}</p>
          </div>
        </div>
      </div>

      <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-lg p-4 border border-green-200">
        <div className="flex items-center gap-3">
          <TrendingUp className="h-8 w-8 text-green-600" />
          <div>
            <p className="text-sm text-gray-600">Pagados</p>
            <p className="text-2xl font-bold text-green-700">{paidDebts.length}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

// --- Página Principal que muestra la lista de Adeudos ---
const AdeudosPage = () => {
  const { data: session } = useSession();
  const [allDebts, setAllDebts] = useState<Debt[]>([]);
  const [filteredDebts, setFilteredDebts] = useState<Debt[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (session?.user?.id) {
      const fetchDebts = async () => {
        try {
          setIsLoading(true);
          console.log('Fetching debts for user:', session.user.id);
          
          const response = await fetch(`/api/adeudos?studentUid=${session.user.id}`);
          
          console.log('Response status:', response.status);
          
          if (!response.ok) {
            const errorData = await response.json().catch(() => ({ message: 'Error desconocido' }));
            throw new Error(errorData.message || 'No se pudieron cargar los adeudos.');
          }
          
          const data: Debt[] = await response.json();
          console.log('Adeudos recibidos:', data);
          setAllDebts(data);
          setFilteredDebts(data);
        } catch (err: any) {
          console.error('Error fetching debts:', err);
          setError(err.message);
        } finally {
          setIsLoading(false);
        }
      };

      fetchDebts();
    } else {
      console.log('No session or user ID available');
      setIsLoading(false);
      setError('No hay sesión activa');
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

        {!isLoading && !error && allDebts.length === 0 && (
          <div className="flex flex-col items-center justify-center h-64 bg-gray-50 border border-gray-200 rounded-lg p-6">
            <AlertTriangle className="h-12 w-12 text-gray-400"/>
            <p className="mt-4 text-gray-600 font-semibold">¡Estás al corriente!</p>
            <p className="text-gray-500 text-sm">No tienes ningún adeudo pendiente.</p>
          </div>
        )}

        {!isLoading && !error && allDebts.length > 0 && (
          <>
            {/* Resumen estadístico */}
            <DebtSummary debts={filteredDebts} />

            {/* Filtros y búsqueda */}
            <DebtFilters 
              debts={allDebts} 
              onFilteredDebtsChange={setFilteredDebts}
            />

            {/* Grid de adeudos */}
            {filteredDebts.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredDebts.map(debt => <DebtCard key={debt.id} debt={debt} />)}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-64 bg-gray-50 border border-gray-200 rounded-lg p-6">
                <AlertTriangle className="h-12 w-12 text-gray-400"/>
                <p className="mt-4 text-gray-600 font-semibold">No se encontraron resultados</p>
                <p className="text-gray-500 text-sm">Intenta ajustar los filtros de búsqueda</p>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default AdeudosPage;