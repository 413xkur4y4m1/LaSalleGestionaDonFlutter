'use client';

import React, { useState } from 'react';
import { useSession } from 'next-auth/react';
import { LoaderCircle, ServerCrash, AlertTriangle, ShieldAlert, TrendingUp, DollarSign, CheckCircle, Package } from 'lucide-react';
import DebtFilters from '@/components/molecules/DebtFilters';
import BackButton from '@/components/molecules/BackButton';
import { useAdeudosFiltrados } from '@/hooks/useAdeudosFiltrados';

// Tipo de dato unificado para todas las transacciones
interface Debt {
  id: string;
  codigo: string;
  nombreMaterial: string;
  cantidad: number;
  precio_unitario?: number; // Opcional para pagados/completados
  precio_ajustado: number;
  moneda: string;
  estado: string;
  tipo: string;
  fechaVencimiento: string | null;
  grupo: string;
  prestamoOriginal: string | null;
  metodo?: string; // Para pagados
  transaccionId?: string; // Para pagados
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

  const antiguedad = debt.estado === 'pendiente' ? getAntiguedad(debt.fechaVencimiento) : null;

  const getTipoIcon = (tipo: string) => {
    switch (tipo) {
      case 'rotura': return '🔨';
      case 'perdida': return '❌';
      case 'vencimiento': return '⏰';
      case 'prestamo': return '📦';
      case 'adeudo_devuelto': return '🔄';
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
                
                <span className={`inline-block mt-2 px-3 py-1 text-xs font-semibold rounded-full ${
                  debt.estado === 'pendiente' ? 'bg-red-100 text-red-700' :
                  debt.estado === 'pagado' ? 'bg-green-100 text-green-700' :
                  'bg-blue-100 text-blue-700'
                }`}>
                  {debt.estado === 'pendiente' ? '⏳ Pendiente' :
                   debt.estado === 'pagado' ? '✅ Pagado' : '🔄 Devuelto'}
                </span>

                {/* Método de pago para pagados */}
                {debt.estado === 'pagado' && debt.metodo && (
                  <span className="inline-block ml-2 mt-2 px-3 py-1 text-xs font-semibold rounded-full bg-purple-100 text-purple-700">
                    {debt.metodo === 'en línea' ? '💳 En línea' : '💵 Presencial'}
                  </span>
                )}
            </div>
            <div className="text-right">
                <p className="text-sm text-gray-600">Monto Total</p>
                <p className="font-bold text-xl text-amber-600">
                  {debt.precio_ajustado.toLocaleString('es-MX', { 
                    style: 'currency', 
                    currency: debt.moneda || 'MXN' 
                  })}
                </p>
                {debt.precio_unitario !== undefined && (
                  <p className="text-xs text-gray-500 mt-1">
                    Unitario: {debt.precio_unitario.toLocaleString('es-MX', { 
                      style: 'currency', 
                      currency: debt.moneda || 'MXN' 
                    })}
                  </p>
                )}
            </div>
        </div>
        
        <div className="mt-4 pt-4 border-t border-gray-100 space-y-2">
            <div>
              <p className="font-semibold text-gray-700 text-sm">
                {debt.estado === 'pagado' ? 'Fecha de Pago:' : 
                 debt.estado === 'devuelto' ? 'Fecha de Devolución:' : 
                 'Fecha de Vencimiento:'}
              </p>
              <p className={`font-bold ${debt.estado === 'pendiente' ? 'text-red-600' : 'text-green-600'}`}>
                {formatDate(debt.fechaVencimiento)}
              </p>
            </div>
            
            {antiguedad && (
              <div className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${antiguedad.bg} ${antiguedad.color}`}>
                {antiguedad.texto}
              </div>
            )}
            
            <p className="text-xs text-gray-500 capitalize">Tipo: {debt.tipo}</p>
            {debt.transaccionId && (
              <p className="text-xs text-gray-400 font-mono">ID: {debt.transaccionId}</p>
            )}
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
  const returnedDebts = debts.filter(d => d.estado === 'devuelto');

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      <div className="bg-gradient-to-br from-amber-50 to-amber-100 rounded-lg p-4 border border-amber-200">
        <div className="flex items-center gap-3">
          <DollarSign className="h-8 w-8 text-amber-600" />
          <div>
            <p className="text-sm text-gray-600">Total</p>
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
          <CheckCircle className="h-8 w-8 text-green-600" />
          <div>
            <p className="text-sm text-gray-600">Pagados</p>
            <p className="text-2xl font-bold text-green-700">{paidDebts.length}</p>
          </div>
        </div>
      </div>

      <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-4 border border-blue-200">
        <div className="flex items-center gap-3">
          <Package className="h-8 w-8 text-blue-600" />
          <div>
            <p className="text-sm text-gray-600">Devueltos</p>
            <p className="text-2xl font-bold text-blue-700">{returnedDebts.length}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

// --- Página Principal ---
const AdeudosPage = () => {
  const { data: session } = useSession();
  const { adeudos, pagados, completados, loading, error } = useAdeudosFiltrados(session?.user?.id || null);
  const [filteredDebts, setFilteredDebts] = useState<Debt[]>([]);

  // Convertir Firestore Timestamp a string y combinar todas las transacciones
  const allDebts: Debt[] = React.useMemo(() => {
    const adeudosConverted = adeudos.map(a => ({
      ...a,
      precio_ajustado: a.precio_ajustado || 0,
      moneda: a.moneda || 'MXN',
      fechaVencimiento: a.fechaVencimiento?.toDate().toISOString() || null,
    }));

    const pagadosConverted = pagados.map(p => ({
      id: p.id,
      codigo: p.codigoPago,
      nombreMaterial: p.nombreMaterial,
      cantidad: 1,
      precio_ajustado: p.precio,
      moneda: 'MXN',
      estado: 'pagado',
      tipo: 'pago',
      fechaVencimiento: p.fechaPago?.toDate().toISOString() || null,
      grupo: p.grupo,
      prestamoOriginal: p.adeudoOriginal || null,
      metodo: p.metodo,
      transaccionId: p.transaccionId,
    }));

    const completadosConverted = completados.map(c => ({
      id: c.id,
      codigo: c.codigo,
      nombreMaterial: c.nombreMaterial,
      cantidad: c.cantidad,
      precio_ajustado: 0,
      moneda: 'MXN',
      estado: 'devuelto',
      tipo: c.tipo,
      fechaVencimiento: c.fechaCumplido?.toDate().toISOString() || null,
      grupo: c.grupo,
      prestamoOriginal: null,
    }));

    return [...adeudosConverted, ...pagadosConverted, ...completadosConverted];
  }, [adeudos, pagados, completados]);

  React.useEffect(() => {
    setFilteredDebts(allDebts);
  }, [allDebts]);

  return (
    <div className="p-4 sm:p-6 md:p-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-6">
          <BackButton showHome homeHref="/dashboard" className="mb-4" />
          
          <div className="flex items-center gap-3">
            <ShieldAlert className="h-8 w-8 text-amber-600"/>
            <h1 className="text-3xl font-bold text-gray-800">Historial de Transacciones</h1>
          </div>
        </div>

        {loading && (
          <div className="flex justify-center items-center h-64">
            <LoaderCircle className="h-12 w-12 text-amber-500 animate-spin" />
            <p className="ml-4 text-gray-600">Cargando información...</p>
          </div>
        )}

        {!loading && error && (
          <div className="flex flex-col items-center justify-center h-64 bg-red-50 border border-red-200 rounded-lg p-6">
            <ServerCrash className="h-12 w-12 text-red-500"/>
            <p className="mt-4 text-red-700 font-semibold">Error al cargar los datos</p>
            <p className="text-red-600 text-sm">{error}</p>
          </div>
        )}

        {!loading && !error && allDebts.length === 0 && (
          <div className="flex flex-col items-center justify-center h-64 bg-gray-50 border border-gray-200 rounded-lg p-6">
            <AlertTriangle className="h-12 w-12 text-gray-400"/>
            <p className="mt-4 text-gray-600 font-semibold">Sin transacciones</p>
            <p className="text-gray-500 text-sm">No hay registros de adeudos, pagos o devoluciones.</p>
          </div>
        )}

        {!loading && !error && allDebts.length > 0 && (
          <>
            <DebtSummary debts={filteredDebts} />
            <DebtFilters debts={allDebts} onFilteredDebtsChange={setFilteredDebts} />

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