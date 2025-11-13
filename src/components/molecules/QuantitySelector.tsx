
'use client';

import React, { useState } from 'react';
import { Material } from './MaterialCard';

interface QuantitySelectorProps {
  material: Material;
  onConfirm: (quantity: number) => void;
  onCancel: () => void;
}

const QuantitySelector: React.FC<QuantitySelectorProps> = ({ material, onConfirm, onCancel }) => {
  const [quantity, setQuantity] = useState(1);

  const handleQuantityChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = parseInt(e.target.value, 10);
    if (isNaN(value)) {
      value = 1;
    }
    if (value > material.stock) {
      value = material.stock;
    }
    if (value < 1) {
      value = 1;
    }
    setQuantity(value);
  };

  const handleConfirmClick = () => {
    onConfirm(quantity);
  };

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4 w-full max-w-sm mx-auto shadow-lg">
      <p className="font-bold text-center mb-2">¿Cuántas unidades de {material.nombre} necesitas?</p>
      <p className="text-sm text-center text-gray-500 mb-4">Disponibles: {material.stock}</p>
      
      <div className="flex items-center justify-center gap-4">
        <input
          type="number"
          value={quantity}
          onChange={handleQuantityChange}
          min="1"
          max={material.stock}
          className="w-24 text-center font-bold text-lg p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
        />
      </div>

      <div className="flex justify-end gap-2 mt-4">
        <button
          onClick={onCancel}
          className="bg-gray-200 hover:bg-gray-300 text-gray-800 font-bold py-2 px-4 rounded-full transition-colors duration-200"
        >
          Cancelar
        </button>
        <button
          onClick={handleConfirmClick}
          className="bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded-full transition-colors duration-200"
          style={{ backgroundColor: '#e10022' }}
        >
          Confirmar
        </button>
      </div>
    </div>
  );
};

export default QuantitySelector;
