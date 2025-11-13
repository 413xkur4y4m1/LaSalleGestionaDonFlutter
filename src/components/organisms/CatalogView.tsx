
'use client';

import React, { useState, useEffect } from 'react';
import MaterialCard, { Material } from '@/components/molecules/MaterialCard';
import { Search, LoaderCircle } from 'lucide-react';
import { rtdb } from '@/lib/firebase-config'; // Importamos la instancia de Realtime DB
import { ref, onValue } from 'firebase/database'; // Funciones de Realtime DB

interface CatalogViewProps {
  onMaterialSelect: (material: Material) => void;
}

const CatalogView: React.FC<CatalogViewProps> = ({ onMaterialSelect }) => {
  const [materials, setMaterials] = useState<Material[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const materialsRef = ref(rtdb, 'materiales');
    
    const unsubscribe = onValue(materialsRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        // Transformamos el objeto de Firebase a un array de materiales
        const materialsList: Material[] = Object.keys(data).map(key => ({
          id: key,
          nombre: data[key].nombre,
          stock: data[key].cantidad, // Mapeamos 'cantidad' a 'stock'
          imagenUrl: '📦' // Usamos un emoji genérico por ahora
        }));
        setMaterials(materialsList);
      } else {
        setMaterials([]);
      }
      setIsLoading(false);
    }, (error) => {
        console.error("Error al obtener datos de Realtime DB:", error);
        setIsLoading(false);
    });

    // Nos desuscribimos del listener cuando el componente se desmonta
    return () => unsubscribe();
  }, []);

  const filteredMaterials = materials.filter(material =>
    material.nombre.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4 w-full max-w-2xl mx-auto">
      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
        <input
          type="text"
          placeholder="🔍 Buscar material..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full bg-gray-100 border border-gray-300 rounded-full py-2 pl-10 pr-4 focus:outline-none focus:ring-2 focus:ring-red-500"
        />
      </div>

      {isLoading ? (
        <div className="flex justify-center items-center py-8">
          <LoaderCircle className="h-8 w-8 text-red-500 animate-spin" />
          <p className="ml-2 text-gray-600">Cargando materiales...</p>
        </div>
      ) : filteredMaterials.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 max-h-96 overflow-y-auto pr-2">
          {filteredMaterials.map(material => (
            <MaterialCard key={material.id} material={material} onSelect={onMaterialSelect} />
          ))}
        </div>
      ) : (
        <p className="text-center text-gray-500 py-4">No se encontraron materiales.</p>
      )}
    </div>
  );
};

export default CatalogView;
