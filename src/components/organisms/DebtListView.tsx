
import React from 'react';
import { AlertTriangle, Calendar, DollarSign, CreditCard } from 'lucide-react';

// --- TIPOS ---
interface Debt {
  id: string;
  motivo: string;
  monto: number;
  fechaReporte: string; // La fecha vendrá como un string ISO
}

interface DebtListViewProps {
  debts: Debt[];
}

// --- SUB-COMPONENTE: TARJETA DE ADEUDO ---
const DebtCard: React.FC<{ debt: Debt }> = ({ debt }) => {
  const formattedDate = new Date(debt.fechaReporte).toLocaleDateString('es-MX', {
    year: 'numeric', month: 'long', day: 'numeric'
  });

  return (
    <div className="bg-white border border-yellow-300 rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow duration-200">
      <div className="flex items-start gap-4">
        <div className="bg-yellow-100 p-2 rounded-full">
            <AlertTriangle className="h-6 w-6 text-yellow-600" />
        </div>
        <div className="flex-1">
            <h4 className="font-bold text-gray-800 text-md">{debt.motivo}</h4>
            <div className="text-sm text-gray-600 mt-2 space-y-2">
                <div className="flex items-center gap-2">
                    <DollarSign className="h-4 w-4 text-gray-500" />
                    <span>Monto: <strong>${debt.monto.toFixed(2)} MXN</strong></span>
                </div>
                <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-gray-500" />
                    <span>Fecha del reporte: {formattedDate}</span>
                </div>
            </div>
        </div>
      </div>
      <div className="mt-4 pt-3 border-t border-gray-100 flex justify-end">
        <button className="flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white text-sm font-semibold py-2 px-4 rounded-lg transition-colors duration-200">
            <CreditCard className="h-4 w-4" />
            <span>Pagar ahora</span>
        </button>
      </div>
    </div>
  );
};

// --- COMPONENTE PRINCIPAL ---
const DebtListView: React.FC<DebtListViewProps> = ({ debts }) => {
  if (debts.length === 0) {
    return (
      <div className="text-center p-6 bg-green-50 rounded-lg border border-green-200">
        <AlertTriangle className="h-12 w-12 text-green-500 mx-auto mb-4" />
        <h3 className="font-bold text-green-800">¡Felicidades!</h3>
        <p className="text-green-700 mt-1">No tienes ningún adeudo pendiente.</p>
      </div>
    );
  }

  return (
    <div className="w-full space-y-3 p-1">
      <h3 className="font-bold text-yellow-800 px-2 mb-2">Tienes {debts.length} adeudo(s) pendiente(s):</h3>
      {debts.map(debt => (
        <DebtCard key={debt.id} debt={debt} />
      ))}
    </div>
  );
};

export default DebtListView;
