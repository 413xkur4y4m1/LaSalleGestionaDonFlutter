
'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from '@/components/ui/label';

// --- Tipos para las props ---
export type PaymentMethod = 'online' | 'presential';

interface DebtDetails {
    nombreMaterial: string;
    cantidad: number;
    precioUnitario: number;
    precioTotal: number;
}

interface PaymentDetailsCardProps {
  debtDetails: DebtDetails;
  onSubmit: (method: PaymentMethod) => void;
}

// --- Función para formatear a moneda ---
const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(value);
}

// --- Componente de la Tarjeta de Detalles de Pago ---
const PaymentDetailsCard: React.FC<PaymentDetailsCardProps> = ({ debtDetails, onSubmit }) => {
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod | null>(null);

  const handleSubmit = () => {
    if (selectedMethod) {
        onSubmit(selectedMethod);
    }
  };

  return (
    <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 my-2 max-w-md">
      <p className="text-sm text-gray-800 mb-4">
        Entendido. Como el material fue dañado o perdido, se ha generado un cargo. 
        Aquí está el detalle del pago:
      </p>

      <div className="bg-white rounded-md border border-gray-300 p-4 space-y-3">
        <h3 className="font-bold text-gray-900 mb-2">Detalle del Cargo</h3>
        
        <div className="flex justify-between text-sm"><span className="text-gray-600">Material:</span> <span className="font-medium">{debtDetails.nombreMaterial}</span></div>
        <div className="flex justify-between text-sm"><span className="text-gray-600">Cantidad:</span> <span className="font-medium">{debtDetails.cantidad}</span></div>
        <div className="flex justify-between text-sm"><span className="text-gray-600">Precio unitario:</span> <span className="font-medium">{formatCurrency(debtDetails.precioUnitario)}</span></div>
        <hr/>
        <div className="flex justify-between text-base font-bold"><span className="">Precio Total (con ajuste):</span> <span>{formatCurrency(debtDetails.precioTotal)}</span></div>

        <div className="pt-4">
            <p className="text-sm font-semibold text-gray-900 mb-3">Método de pago:</p>
            <RadioGroup onValueChange={(value) => setSelectedMethod(value as PaymentMethod)} className="space-y-3">
                <div className="flex items-center space-x-2">
                    <RadioGroupItem value="online" id="online" />
                    <Label htmlFor="online" className="text-sm text-gray-700 font-normal">En línea</Label>
                </div>
                <div className="flex items-center space-x-2">
                    <RadioGroupItem value="presential" id="presential" />
                    <Label htmlFor="presential" className="text-sm text-gray-700 font-normal">Presencial</Label>
                </div>
            </RadioGroup>
        </div>
      </div>

      <Button 
        onClick={handleSubmit}
        disabled={!selectedMethod}
        className="w-full mt-4 bg-red-600 hover:bg-red-700 text-white"
      >
        Proceder al Pago
      </Button>
    </div>
  );
};

export default PaymentDetailsCard;
