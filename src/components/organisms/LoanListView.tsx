
import React from 'react';
import { Package, Calendar, Hash } from 'lucide-react';

// --- TIPOS ---
interface Loan {
  id: string;
  nombreMaterial: string;
  cantidad: number;
  fechaDevolucion: string; // La fecha vendrá como un string ISO
  codigo: string;
}

interface LoanListViewProps {
  loans: Loan[];
}

// --- SUB-COMPONENTE: TARJETA DE PRÉSTAMO ---
const LoanCard: React.FC<{ loan: Loan }> = ({ loan }) => {
  const formattedDate = new Date(loan.fechaDevolucion).toLocaleDateString('es-MX', {
    year: 'numeric', month: 'long', day: 'numeric' 
  });

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow duration-200">
      <div className="flex items-center gap-4 mb-3">
        <div className="bg-red-100 p-2 rounded-full">
            <Package className="h-6 w-6 text-red-600" />
        </div>
        <div>
            <h4 className="font-bold text-gray-800 text-md">{loan.nombreMaterial}</h4>
            <p className="text-sm text-gray-600">Cantidad: {loan.cantidad}</p>
        </div>
      </div>
      
      <div className="border-t border-gray-100 pt-3 space-y-2 text-sm">
        <div className="flex items-center gap-2 text-gray-700">
            <Calendar className="h-4 w-4 text-gray-500" />
            <span>Devolver antes del: <strong>{formattedDate}</strong></span>
        </div>
        <div className="flex items-center gap-2 text-gray-500">
            <Hash className="h-4 w-4" />
            <span className="font-mono text-xs">{loan.codigo}</span>
        </div>
      </div>
    </div>
  );
};


// --- COMPONENTE PRINCIPAL ---
const LoanListView: React.FC<LoanListViewProps> = ({ loans }) => {
  if (loans.length === 0) {
    return (
      <div className="text-center p-6 bg-gray-50 rounded-lg">
        <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
        <h3 className="font-bold text-gray-800">¡Todo en orden!</h3>
        <p className="text-gray-600 mt-1">No tienes ningún préstamo activo en este momento.</p>
      </div>
    );
  }

  return (
    <div className="w-full space-y-3 p-1">
      {loans.map(loan => (
        <LoanCard key={loan.id} loan={loan} />
      ))}
    </div>
  );
};

export default LoanListView;
