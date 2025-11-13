
'use client';

import React from 'react';

export interface Material {
  id: string;
  nombre: string;
  imagenUrl?: string; // O un emoji
  stock: number;
}

interface MaterialCardProps {
  material: Material;
  onSelect: (material: Material) => void;
}

const MaterialCard: React.FC<MaterialCardProps> = ({ material, onSelect }) => {
  const isAvailable = material.stock > 0;

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4 flex flex-col items-center text-center shadow-sm hover:shadow-md transition-shadow duration-200">
      <div className="text-4xl mb-2">{material.imagenUrl || '📦'}</div>
      <p className="font-bold text-gray-800">{material.nombre}</p>
      <p className={`text-sm font-semibold ${isAvailable ? 'text-green-600' : 'text-red-600'}`}>
        Disponible: {material.stock}
      </p>
      <button
        onClick={() => onSelect(material)}
        disabled={!isAvailable}
        className="mt-4 w-full bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded-full transition-colors duration-200 disabled:bg-gray-400 disabled:cursor-not-allowed"
        style={{ backgroundColor: isAvailable ? '#e10022' : undefined }}
      >
        Elegir
      </button>
    </div>
  );
};

export default MaterialCard;
