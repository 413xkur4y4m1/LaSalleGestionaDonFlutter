// For chatbot catalog display
// Props:
//   - material: {
//       id: string
//       nombre: string
//       categoria: string
//       cantidad: number
//       precio_unitario: number
//     }
//   - onSelect: (material, cantidad) => void
//
// Layout:
// <div className="bg-white rounded-lg border p-4 hover:shadow-lg transition">
//   <div className="aspect-square bg-gray-100 rounded mb-3 flex items-center justify-center">
//     <Package className="w-12 h-12 text-gray-400" />
//   </div>
//   <h3 className="font-semibold">{nombre}</h3>
//   <p className="text-sm text-gray-500">{categoria}</p>
//   <p className="text-xs text-gray-400">Disponibles: {cantidad}</p>
//   <p className="text-lg font-bold text-[#e10022]">${precio_unitario} MXN</p>
//   <Input type="number" min="1" max={cantidad} placeholder="Cantidad" />
//   <Button onClick={() => onSelect(material, inputValue)}>
//     Seleccionar
//   </Button>
// </div>

import React, { useState } from 'react';
import { Package } from 'lucide-react';
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"

interface MaterialCardProps {
  material: {
    id: string;
    nombre: string;
    categoria: string;
    cantidad: number;
    precio_unitario: number;
  };
  onSelect: (material: any, cantidad: number) => void;
}

const MaterialCard: React.FC<MaterialCardProps> = ({ material, onSelect }) => {
  const [inputValue, setInputValue] = useState('1');

  const handleSelect = () => {
    const cantidad = parseInt(inputValue);
    if (cantidad > 0 && cantidad <= material.cantidad) {
      onSelect(material, cantidad);
    }
  };

  return (
    <div className="bg-white rounded-lg border p-4 hover:shadow-lg transition">
      <div className="aspect-square bg-gray-100 rounded mb-3 flex items-center justify-center">
        <Package className="w-12 h-12 text-gray-400" />
      </div>
      <h3 className="font-semibold">{material.nombre}</h3>
      <p className="text-sm text-gray-500">{material.categoria}</p>
      <p className="text-xs text-gray-400">Disponibles: {material.cantidad}</p>
      <p className="text-lg font-bold text-[#e10022]">${material.precio_unitario} MXN</p>
      <Input
        type="number"
        min="1"
        max={material.cantidad}
        placeholder="Cantidad"
        value={inputValue}
        onChange={(e) => setInputValue(e.target.value)}
        className="w-full mb-2"
      />
      <Button onClick={handleSelect}>
        Seleccionar
      </Button>
    </div>
  );
};

export default MaterialCard;