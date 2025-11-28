'use client';

import React, { useState } from 'react';
import { Search, Filter, X, Calendar, DollarSign, AlertCircle } from 'lucide-react';

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

interface DebtFiltersProps {
  debts: Debt[];
  onFilteredDebtsChange: (filteredDebts: Debt[]) => void;
}

const DebtFilters: React.FC<DebtFiltersProps> = ({ debts, onFilteredDebtsChange }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTipo, setSelectedTipo] = useState<string>('todos');
  const [selectedEstado, setSelectedEstado] = useState<string>('todos');
  const [dateFilter, setDateFilter] = useState<string>('todos');
  const [priceRange, setPriceRange] = useState<string>('todos');
  const [showFilters, setShowFilters] = useState(false);

  // Aplicar todos los filtros
  React.useEffect(() => {
    let filtered = [...debts];

    // Filtro de búsqueda (nombre del material o código)
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(debt => 
        debt.nombreMaterial.toLowerCase().includes(term) ||
        debt.codigo.toLowerCase().includes(term)
      );
    }

    // Filtro por tipo
    if (selectedTipo !== 'todos') {
      filtered = filtered.filter(debt => debt.tipo === selectedTipo);
    }

    // Filtro por estado
    if (selectedEstado !== 'todos') {
      filtered = filtered.filter(debt => debt.estado === selectedEstado);
    }

    // Filtro por fecha de vencimiento
    if (dateFilter !== 'todos') {
      const now = new Date();
      filtered = filtered.filter(debt => {
        if (!debt.fechaVencimiento) return false;
        const vencimiento = new Date(debt.fechaVencimiento);
        const diffDays = Math.floor((now.getTime() - vencimiento.getTime()) / (1000 * 60 * 60 * 24));

        switch (dateFilter) {
          case 'reciente': // Últimos 30 días
            return diffDays <= 30;
          case 'medio': // Entre 30 y 90 días
            return diffDays > 30 && diffDays <= 90;
          case 'antiguo': // Más de 90 días
            return diffDays > 90;
          case 'muyAntiguo': // Más de 180 días (6 meses)
            return diffDays > 180;
          default:
            return true;
        }
      });
    }

    // Filtro por rango de precio
    if (priceRange !== 'todos') {
      filtered = filtered.filter(debt => {
        const precio = debt.precio_ajustado;
        switch (priceRange) {
          case 'bajo': // Menos de $100
            return precio < 100;
          case 'medio': // $100 - $500
            return precio >= 100 && precio < 500;
          case 'alto': // $500 - $1000
            return precio >= 500 && precio < 1000;
          case 'muyAlto': // Más de $1000
            return precio >= 1000;
          default:
            return true;
        }
      });
    }

    onFilteredDebtsChange(filtered);
  }, [searchTerm, selectedTipo, selectedEstado, dateFilter, priceRange, debts, onFilteredDebtsChange]);

  const clearAllFilters = () => {
    setSearchTerm('');
    setSelectedTipo('todos');
    setSelectedEstado('todos');
    setDateFilter('todos');
    setPriceRange('todos');
  };

  const activeFiltersCount = [
    selectedTipo !== 'todos',
    selectedEstado !== 'todos',
    dateFilter !== 'todos',
    priceRange !== 'todos',
    searchTerm.trim() !== ''
  ].filter(Boolean).length;

  return (
    <div className="bg-white rounded-lg shadow-md p-4 mb-6">
      {/* Barra de búsqueda principal */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
          <input
            type="text"
            placeholder="Buscar por material o código..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-10 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              <X className="h-5 w-5" />
            </button>
          )}
        </div>
        
        <button
          onClick={() => setShowFilters(!showFilters)}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
            showFilters || activeFiltersCount > 0
              ? 'bg-amber-100 text-amber-700 border-2 border-amber-300'
              : 'bg-gray-100 text-gray-700 border-2 border-gray-300'
          }`}
        >
          <Filter className="h-5 w-5" />
          <span className="font-medium">Filtros</span>
          {activeFiltersCount > 0 && (
            <span className="bg-amber-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
              {activeFiltersCount}
            </span>
          )}
        </button>
      </div>

      {/* Panel de filtros expandible */}
      {showFilters && (
        <div className="mt-4 pt-4 border-t border-gray-200 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Filtro por Tipo */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <AlertCircle className="inline h-4 w-4 mr-1" />
                Tipo de Adeudo
              </label>
              <select
                value={selectedTipo}
                onChange={(e) => setSelectedTipo(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
              >
                <option value="todos">Todos los tipos</option>
                <option value="rotura">🔨 Rotura</option>
                <option value="perdida">❌ Pérdida</option>
                <option value="vencimiento">⏰ Vencimiento</option>
              </select>
            </div>

            {/* Filtro por Estado */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Estado
              </label>
              <select
                value={selectedEstado}
                onChange={(e) => setSelectedEstado(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
              >
                <option value="todos">Todos los estados</option>
                <option value="pendiente">⏳ Pendiente</option>
                <option value="pagado">✅ Pagado</option>
                <option value="devuelto">🔄 Devuelto</option>
              </select>
            </div>

            {/* Filtro por Antigüedad */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Calendar className="inline h-4 w-4 mr-1" />
                Antigüedad
              </label>
              <select
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
              >
                <option value="todos">Todas las fechas</option>
                <option value="reciente">📅 Último mes</option>
                <option value="medio">📆 1-3 meses</option>
                <option value="antiguo">🗓️ 3-6 meses</option>
                <option value="muyAntiguo">⚠️ Más de 6 meses</option>
              </select>
            </div>

            {/* Filtro por Precio */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <DollarSign className="inline h-4 w-4 mr-1" />
                Rango de Precio
              </label>
              <select
                value={priceRange}
                onChange={(e) => setPriceRange(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
              >
                <option value="todos">Todos los precios</option>
                <option value="bajo">💵 Menos de $100</option>
                <option value="medio">💰 $100 - $500</option>
                <option value="alto">💸 $500 - $1,000</option>
                <option value="muyAlto">🔥 Más de $1,000</option>
              </select>
            </div>
          </div>

          {/* Botón para limpiar filtros */}
          {activeFiltersCount > 0 && (
            <div className="flex justify-end">
              <button
                onClick={clearAllFilters}
                className="flex items-center gap-2 px-4 py-2 text-sm text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors"
              >
                <X className="h-4 w-4" />
                Limpiar todos los filtros
              </button>
            </div>
          )}
        </div>
      )}

      {/* Indicador de resultados */}
      {activeFiltersCount > 0 && (
        <div className="mt-3 text-sm text-gray-600">
          Mostrando {debts.length} resultado{debts.length !== 1 ? 's' : ''}
          {activeFiltersCount > 0 && ` con ${activeFiltersCount} filtro${activeFiltersCount !== 1 ? 's' : ''} activo${activeFiltersCount !== 1 ? 's' : ''}`}
        </div>
      )}
    </div>
  );
};

export default DebtFilters;