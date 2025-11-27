import React, { useState, useEffect } from 'react';
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { TrendingUp, AlertTriangle, CheckCircle, Users, Package, DollarSign, RefreshCw, Brain, Clock } from 'lucide-react';

const COLORS = ['#0a1c65', '#e10022', '#2563eb', '#10b981', '#f59e0b', '#8b5cf6'];

interface MaterialSolicitado {
  material: string;
  cantidad: number;
}

interface MaterialPerdido {
  material: string;
  cantidad: number;
  tipo: string;
}

interface EstudianteScore {
  nombre: string;
  grupo: string;
  completados: number;
  adeudos: number;
  score: number;
}

interface AnalisisIA {
  resumen_ejecutivo: string;
  insights: string[];
  predicciones: string[];
  recomendaciones: string[];
  alertas: Array<{ tipo: string; mensaje: string; prioridad: string }>;
  tendencias: string[];
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
  analisisIA: AnalisisIA | null;
}

export default function AnalisisEstadistico() {
  const [datos, setDatos] = useState<DatosEstadisticos | null>(null);
  const [loading, setLoading] = useState(true);
  const [ultimaActualizacion, setUltimaActualizacion] = useState<Date | null>(null);

  const cargarDatos = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/estadisticas/obtener');
      const data = await res.json();
      setDatos(data);
      setUltimaActualizacion(new Date());
    } catch (error) {
      console.error('Error cargando estadísticas:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    cargarDatos();
    const interval = setInterval(cargarDatos, 180000); // Refrescar cada 3 min
    return () => clearInterval(interval);
  }, []);

  if (loading || !datos) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-50">
        <div className="text-center">
          <RefreshCw className="h-12 w-12 animate-spin text-[#e10022] mx-auto mb-4" />
          <p className="text-gray-600 font-medium">Cargando análisis estadístico...</p>
        </div>
      </div>
    );
  }

  const { topMateriales, topPerdidos, topEstudiantes, peoresEstudiantes, totalPrestamos, totalAdeudos, totalCompletados, totalEstudiantes, analisisIA } = datos;

  const tasaCumplimiento = totalPrestamos > 0 ? ((totalCompletados / totalPrestamos) * 100).toFixed(1) : '0';
  const tasaAdeudos = totalPrestamos > 0 ? ((totalAdeudos / totalPrestamos) * 100).toFixed(1) : '0';

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      {/* Header */}
      <div className="max-w-7xl mx-auto mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-[#0a1c65] mb-2">📊 Análisis Estadístico Inteligente</h1>
            <p className="text-gray-600">Dashboard generado automáticamente con IA cada 3 minutos</p>
          </div>
          <div className="text-right">
            <button onClick={cargarDatos} className="flex items-center gap-2 px-4 py-2 bg-[#e10022] text-white rounded-lg hover:opacity-90 transition-opacity">
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
            </div>
            <CheckCircle className="h-12 w-12 text-green-500 opacity-20" />
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-md border-l-4 border-[#e10022]">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Tasa de Adeudos</p>
              <p className="text-3xl font-bold text-[#e10022]">{tasaAdeudos}%</p>
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

      {/* Análisis IA */}
      {analisisIA && (
        <div className="max-w-7xl mx-auto mb-8">
          <div className="bg-gradient-to-r from-purple-500 to-indigo-600 p-6 rounded-xl shadow-lg text-white">
            <div className="flex items-center gap-3 mb-4">
              <Brain className="h-8 w-8" />
              <h2 className="text-2xl font-bold">Resumen Ejecutivo con IA</h2>
            </div>
            <p className="text-lg leading-relaxed">{analisisIA.resumen_ejecutivo}</p>
          </div>
        </div>
      )}

      {/* Gráficas */}
      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        {/* Top Materiales Solicitados */}
        <div className="bg-white p-6 rounded-xl shadow-md">
          <h3 className="text-xl font-bold text-[#0a1c65] mb-4">📦 Top 5 Materiales Más Solicitados</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={topMateriales}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="material" angle={-45} textAnchor="end" height={100} />
              <YAxis />
              <Tooltip />
              <Bar dataKey="cantidad" fill="#0a1c65" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Top Materiales Perdidos */}
        <div className="bg-white p-6 rounded-xl shadow-md">
          <h3 className="text-xl font-bold text-[#e10022] mb-4">⚠️ Top 5 Materiales Más Perdidos</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={topPerdidos}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="material" angle={-45} textAnchor="end" height={100} />
              <YAxis />
              <Tooltip />
              <Bar dataKey="cantidad" fill="#e10022" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Distribución */}
      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        {/* Distribución de Estados */}
        <div className="bg-white p-6 rounded-xl shadow-md">
          <h3 className="text-xl font-bold text-[#0a1c65] mb-4">🥧 Distribución de Transacciones</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={[
                  { name: 'Completados', value: totalCompletados },
                  { name: 'Adeudos', value: totalAdeudos },
                  { name: 'Activos', value: totalPrestamos - totalCompletados - totalAdeudos },
                ]}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={(entry) => `${entry.name}: ${entry.value}`}
                outerRadius={100}
                fill="#8884d8"
                dataKey="value"
              >
                {[0, 1, 2].map((index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Campana de Gauss (Simulación de Score) */}
        <div className="bg-white p-6 rounded-xl shadow-md">
          <h3 className="text-xl font-bold text-[#0a1c65] mb-4">📈 Distribución de Comportamiento</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={[
              { score: -10, estudiantes: 2 },
              { score: -5, estudiantes: 5 },
              { score: 0, estudiantes: 15 },
              { score: 5, estudiantes: 25 },
              { score: 10, estudiantes: 15 },
              { score: 15, estudiantes: 5 },
              { score: 20, estudiantes: 2 },
            ]}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="score" label={{ value: 'Score', position: 'insideBottom', offset: -5 }} />
              <YAxis label={{ value: 'Frecuencia', angle: -90, position: 'insideLeft' }} />
              <Tooltip />
              <Line type="monotone" dataKey="estudiantes" stroke="#0a1c65" strokeWidth={3} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Top Estudiantes */}
      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        {/* Mejores Estudiantes */}
        <div className="bg-white p-6 rounded-xl shadow-md">
          <h3 className="text-xl font-bold text-green-600 mb-4">🏆 Top 5 Mejores Estudiantes</h3>
          <div className="space-y-3">
            {topEstudiantes.map((est: EstudianteScore, idx: number) => (
              <div key={idx} className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                <div>
                  <p className="font-semibold text-gray-800">{est.nombre}</p>
                  <p className="text-sm text-gray-600">{est.grupo} • {est.completados} completados, {est.adeudos} adeudos</p>
                </div>
                <span className="text-2xl font-bold text-green-600">#{idx + 1}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Estudiantes con Más Adeudos */}
        <div className="bg-white p-6 rounded-xl shadow-md">
          <h3 className="text-xl font-bold text-[#e10022] mb-4">⚠️ Estudiantes Requieren Atención</h3>
          <div className="space-y-3">
            {peoresEstudiantes.map((est: EstudianteScore, idx: number) => (
              <div key={idx} className="flex items-center justify-between p-3 bg-red-50 rounded-lg">
                <div>
                  <p className="font-semibold text-gray-800">{est.nombre}</p>
                  <p className="text-sm text-gray-600">{est.grupo} • {est.completados} completados, {est.adeudos} adeudos</p>
                </div>
                <AlertTriangle className="h-6 w-6 text-[#e10022]" />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Insights y Recomendaciones IA */}
      {analisisIA && (
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Insights */}
          <div className="bg-white p-6 rounded-xl shadow-md">
            <h3 className="text-lg font-bold text-[#0a1c65] mb-3">💡 Insights Clave</h3>
            <ul className="space-y-2">
              {analisisIA.insights?.map((insight: string, idx: number) => (
                <li key={idx} className="text-sm text-gray-700 flex items-start gap-2">
                  <TrendingUp className="h-4 w-4 text-blue-500 mt-1 flex-shrink-0" />
                  <span>{insight}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Predicciones */}
          <div className="bg-white p-6 rounded-xl shadow-md">
            <h3 className="text-lg font-bold text-purple-600 mb-3">🔮 Predicciones</h3>
            <ul className="space-y-2">
              {analisisIA.predicciones?.map((pred: string, idx: number) => (
                <li key={idx} className="text-sm text-gray-700 flex items-start gap-2">
                  <Brain className="h-4 w-4 text-purple-500 mt-1 flex-shrink-0" />
                  <span>{pred}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Recomendaciones */}
          <div className="bg-white p-6 rounded-xl shadow-md">
            <h3 className="text-lg font-bold text-green-600 mb-3">✅ Recomendaciones</h3>
            <ul className="space-y-2">
              {analisisIA.recomendaciones?.map((rec: string, idx: number) => (
                <li key={idx} className="text-sm text-gray-700 flex items-start gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500 mt-1 flex-shrink-0" />
                  <span>{rec}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}