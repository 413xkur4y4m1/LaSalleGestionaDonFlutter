'use client';

import React, { useState, useEffect } from 'react';
import { BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { TrendingUp, AlertTriangle, CheckCircle, Users, Package, RefreshCw, Clock } from 'lucide-react';

const COLORS = ['#10b981', '#e10022', '#2563eb', '#f59e0b', '#8b5cf6'];

interface MaterialSolicitado {
  material: string;
  cantidad: number;
}

interface MaterialPerdido {
  material: string;
  cantidad: number;
}

interface EstudianteScore {
  nombre: string;
  grupo: string;
  completados: number;
  adeudos: number;
  score: number;
}

interface DatosEstadisticos {
  topMateriales: MaterialSolicitado[];
  topPerdidos: MaterialPerdido[];
  topEstudiantes: EstudianteScore[];
  peoresEstudiantes: EstudianteScore[];
  totalPrestamos: number;
  totalAdeudos: number;
  totalCompletados: number;
  totalEstudiantes: number;
}

export default function AnalisisEstadistico() {
  const [datos, setDatos] = useState<DatosEstadisticos | null>(null);
  const [loading, setLoading] = useState(true);
  const [ultimaActualizacion, setUltimaActualizacion] = useState<Date | null>(null);

  const cargarDatos = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/estadisticas/obtener', {
        cache: 'no-store',
        headers: {
          'Cache-Control': 'no-cache',
        },
      });
      
      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`);
      }
      
      const data = await res.json();
      setDatos(data);
      setUltimaActualizacion(new Date());
    } catch (error) {
      console.error('Error cargando estadísticas:', error);
      setDatos({
        topMateriales: [],
        topPerdidos: [],
        topEstudiantes: [],
        peoresEstudiantes: [],
        totalPrestamos: 0,
        totalAdeudos: 0,
        totalCompletados: 0,
        totalEstudiantes: 0,
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    cargarDatos();
  }, []);

  if (loading || !datos) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-50">
        <div className="text-center">
          <RefreshCw className="h-12 w-12 animate-spin text-[#e10022] mx-auto mb-4" />
          <p className="text-gray-600 font-medium">Cargando estadísticas...</p>
        </div>
      </div>
    );
  }

  const { topMateriales, topPerdidos, topEstudiantes, peoresEstudiantes, totalPrestamos, totalAdeudos, totalCompletados, totalEstudiantes } = datos;

  const tasaCumplimiento = totalPrestamos > 0 ? ((totalCompletados / totalPrestamos) * 100).toFixed(1) : '0';
  const tasaAdeudos = totalPrestamos > 0 ? ((totalAdeudos / totalPrestamos) * 100).toFixed(1) : '0';
  const prestamosActivos = totalPrestamos - totalCompletados - totalAdeudos;

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      {/* Header */}
      <div className="max-w-7xl mx-auto mb-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-[#0a1c65] mb-2">📊 Análisis Estadístico</h1>
            <p className="text-gray-600">Dashboard de métricas y estadísticas del sistema</p>
          </div>
          <div className="text-right">
            <button 
              onClick={cargarDatos} 
              className="flex items-center gap-2 px-4 py-2 bg-[#e10022] text-white rounded-lg hover:opacity-90 transition-opacity"
            >
              <RefreshCw className="h-4 w-4" />
              Actualizar
            </button>
            {ultimaActualizacion && (
              <p className="text-xs text-gray-500 mt-2 flex items-center gap-1 justify-end">
                <Clock className="h-3 w-3" />
                {ultimaActualizacion.toLocaleTimeString('es-MX')}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* KPIs Principales */}
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white p-6 rounded-xl shadow-md border-l-4 border-[#0a1c65]">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Total Préstamos</p>
              <p className="text-3xl font-bold text-[#0a1c65]">{totalPrestamos}</p>
            </div>
            <Package className="h-12 w-12 text-[#0a1c65] opacity-20" />
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-md border-l-4 border-green-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Tasa de Cumplimiento</p>
              <p className="text-3xl font-bold text-green-600">{tasaCumplimiento}%</p>
              <p className="text-xs text-gray-500 mt-1">{totalCompletados} completados</p>
            </div>
            <CheckCircle className="h-12 w-12 text-green-500 opacity-20" />
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-md border-l-4 border-[#e10022]">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Tasa de Adeudos</p>
              <p className="text-3xl font-bold text-[#e10022]">{tasaAdeudos}%</p>
              <p className="text-xs text-gray-500 mt-1">{totalAdeudos} adeudos</p>
            </div>
            <AlertTriangle className="h-12 w-12 text-[#e10022] opacity-20" />
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-md border-l-4 border-blue-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Estudiantes Activos</p>
              <p className="text-3xl font-bold text-blue-600">{totalEstudiantes}</p>
            </div>
            <Users className="h-12 w-12 text-blue-500 opacity-20" />
          </div>
        </div>
      </div>

      {/* Gráficas Principales */}
      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        {/* Top Materiales Solicitados */}
        <div className="bg-white p-6 rounded-xl shadow-md">
          <h3 className="text-xl font-bold text-[#0a1c65] mb-4">📦 Top 5 Materiales Más Solicitados</h3>
          {topMateriales && topMateriales.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={topMateriales}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="material" angle={-45} textAnchor="end" height={100} />
                <YAxis />
                <Tooltip />
                <Bar dataKey="cantidad" fill="#0a1c65" />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-gray-500 text-center py-20">No hay datos disponibles</p>
          )}
        </div>

        {/* Top Materiales Perdidos */}
        <div className="bg-white p-6 rounded-xl shadow-md">
          <h3 className="text-xl font-bold text-[#e10022] mb-4">⚠️ Top 5 Materiales Más Perdidos</h3>
          {topPerdidos && topPerdidos.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={topPerdidos}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="material" angle={-45} textAnchor="end" height={100} />
                <YAxis />
                <Tooltip />
                <Bar dataKey="cantidad" fill="#e10022" />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-gray-500 text-center py-20">No hay datos disponibles</p>
          )}
        </div>
      </div>

      {/* Distribución de Transacciones */}
      <div className="max-w-7xl mx-auto mb-8">
        <div className="bg-white p-6 rounded-xl shadow-md">
          <h3 className="text-xl font-bold text-[#0a1c65] mb-4">🥧 Distribución de Transacciones</h3>
          <ResponsiveContainer width="100%" height={350}>
            <PieChart>
              <Pie
                data={[
                  { name: 'Completados', value: totalCompletados },
                  { name: 'Adeudos', value: totalAdeudos },
                  { name: 'Activos', value: prestamosActivos > 0 ? prestamosActivos : 0 },
                ]}
                cx="50%"
                cy="50%"
                labelLine={true}
                label={(entry) => `${entry.name}: ${entry.value} (${((entry.value / totalPrestamos) * 100).toFixed(1)}%)`}
                outerRadius={120}
                fill="#8884d8"
                dataKey="value"
              >
                {[0, 1, 2].map((index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Rankings de Estudiantes */}
      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Mejores Estudiantes */}
        <div className="bg-white p-6 rounded-xl shadow-md">
          <h3 className="text-xl font-bold text-green-600 mb-4 flex items-center gap-2">
            <TrendingUp className="h-6 w-6" />
            Top 5 Mejores Estudiantes
          </h3>
          {topEstudiantes && topEstudiantes.length > 0 ? (
            <div className="space-y-3">
              {topEstudiantes.map((est, idx) => (
                <div key={idx} className="flex items-center justify-between p-4 bg-green-50 rounded-lg border border-green-200">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl font-bold text-green-600">#{idx + 1}</span>
                    <div>
                      <p className="font-semibold text-gray-800">{est.nombre}</p>
                      <p className="text-sm text-gray-600">{est.grupo}</p>
                      <p className="text-xs text-green-600 mt-1">
                        ✓ {est.completados} completados • ✗ {est.adeudos} adeudos
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-gray-500">Score</p>
                    <p className="text-2xl font-bold text-green-600">{est.score}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-center py-8">No hay datos disponibles aún</p>
          )}
        </div>

        {/* Estudiantes con Más Adeudos */}
        <div className="bg-white p-6 rounded-xl shadow-md">
          <h3 className="text-xl font-bold text-[#e10022] mb-4 flex items-center gap-2">
            <AlertTriangle className="h-6 w-6" />
            Estudiantes Requieren Atención
          </h3>
          {peoresEstudiantes && peoresEstudiantes.length > 0 ? (
            <div className="space-y-3">
              {peoresEstudiantes.map((est, idx) => (
                <div key={idx} className="flex items-center justify-between p-4 bg-red-50 rounded-lg border border-red-200">
                  <div className="flex items-center gap-3">
                    <AlertTriangle className="h-6 w-6 text-[#e10022]" />
                    <div>
                      <p className="font-semibold text-gray-800">{est.nombre}</p>
                      <p className="text-sm text-gray-600">{est.grupo}</p>
                      <p className="text-xs text-red-600 mt-1">
                        ✓ {est.completados} completados • ✗ {est.adeudos} adeudos
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-gray-500">Score</p>
                    <p className="text-2xl font-bold text-[#e10022]">{est.score}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-center py-8">No hay datos disponibles aún</p>
          )}
        </div>
      </div>
    </div>
  );
}