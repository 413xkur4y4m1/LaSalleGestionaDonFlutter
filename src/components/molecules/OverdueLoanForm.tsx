
'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from '@/components/ui/label';

// --- Tipos para las props ---
export type OverdueReason = 'not_returned' | 'broken' | 'lost';

interface OverdueLoanFormProps {
  loanName: string;
  // Función que se llamará cuando el usuario envíe su respuesta.
  onSubmit: (reason: OverdueReason, reasonText: string) => void;
}

const reasonOptions = [
    { id: 'not_returned', label: 'Lo tengo pero no lo he devuelto' },
    { id: 'broken', label: 'Lo rompí' },
    { id: 'lost', label: 'Lo perdí' },
];

// --- Componente del Formulario ---
const OverdueLoanForm: React.FC<OverdueLoanFormProps> = ({ loanName, onSubmit }) => {
  const [selectedReason, setSelectedReason] = useState<OverdueReason | null>(null);

  const handleSubmit = () => {
    if (selectedReason) {
        const selectedOption = reasonOptions.find(opt => opt.id === selectedReason);
        onSubmit(selectedReason, selectedOption?.label || 'Respuesta no especificada');
    }
  };

  return (
    <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 my-2 max-w-md">
      <p className="text-sm text-gray-800 mb-4">
        Detectamos que tu préstamo del material <span className="font-bold">{loanName}</span> está vencido. 
        Por favor, ayúdanos a entender la situación respondiendo a la siguiente pregunta:
      </p>

      <div className="bg-white rounded-md border border-gray-300 p-4">
          <p className="font-semibold text-gray-900 mb-4">¿Por qué no has devuelto el material?</p>
          
          <RadioGroup onValueChange={(value) => setSelectedReason(value as OverdueReason)} className="space-y-3">
                {reasonOptions.map((option) => (
                    <div key={option.id} className="flex items-center space-x-2">
                        <RadioGroupItem value={option.id} id={option.id} />
                        <Label htmlFor={option.id} className="text-sm text-gray-700 font-normal">{option.label}</Label>
                    </div>
                ))}
          </RadioGroup>
      </div>

      <Button 
        onClick={handleSubmit}
        disabled={!selectedReason}
        className="w-full mt-4 bg-red-600 hover:bg-red-700 text-white"
      >
        Enviar Respuesta
      </Button>
    </div>
  );
};

export default OverdueLoanForm;
