'use client';

import React, { useState, useEffect } from 'react';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import AdminBackButton from '@/components/molecules/AdminBackButton';
import { 
  Users, 
  Search, 
  Filter, 
  TrendingUp, 
  AlertCircle,
  CheckCircle,
  Clock,
  DollarSign,
  ChevronDown,
  ChevronRight,
  LoaderCircle
} from 'lucide-react';

interface Student {
  uid: string;
  nombre: string;
  correo: string;
  grupo: string;
  carrera: string;
  fotoPerfil?: string;
  prestamosActivos: number;
  adeudosPendientes: number;
  totalAdeudado: number;
  estado: 'limpio' | 'prestamo' | 'adeudo' | 'critico';
}

interface GroupedStudents {
  [grupo: string]: Student[];
}

const AdminStudentsPage = () => {
  const [students, setStudents] = useState<Student[]>([]);
  const [groupedStudents, setGroupedStudents] = useState<GroupedStudents>({});
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedEstado, setSelectedEstado] = useState<string>('todos');
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());

  useEffect(() => {
    fetchStudents();
  }, []);

  useEffect(() => {
    groupStudents();
  }, [students, searchTerm, selectedEstado]);

  const fetchStudents = async () => {
    try {
      setLoading(true);
      const estudiantesRef = collection(db, 'Estudiantes');
      const snapshot = await getDocs(estudiantesRef);
      
      const studentsData: Student[] = await Promise.all(
        snapshot.docs.map(async (doc) => {
          const data = doc.data();
          const uid = doc.id;

          // Obtener préstamos activos
          const prestamosSnap = await getDocs(
            collection(db, `Estudiantes/${uid}/Prestamos`)
          );
          const prestamosActivos = prestamosSnap.docs.filter(
            d => d.data().estado === 'activo'
          ).length;

          // Obtener adeudos pendientes
          const adeudosSnap = await getDocs(
            collection(db, `Estudiantes/${uid}/Adeudos`)
          );
          const adeudosPendientes = adeudosSnap.docs.filter(
            d => d.data().estado === 'pendiente'
          ).length;

          // Calcular total adeudado
          const totalAdeudado = adeudosSnap.docs
            .filter(d => d.data().estado === 'pendiente')
            .reduce((sum, d) => sum + (d.data().precio_ajustado || 0), 0);

          // Determinar estado
          let estado: Student['estado'] = 'limpio';
          if (adeudosPendientes > 0 && totalAdeudado > 1000) {
            estado = 'critico';
          } else if (adeudosPendientes > 0) {
            estado = 'adeudo';
          } else if (prestamosActivos > 0) {
            estado = 'prestamo';
          }

          return {
            uid,
            nombre: data.nombre || 'Sin nombre',
            correo: data.correo || '',
            grupo: data.grupo || 'Sin grupo',
            carrera: data.carrera || 'turismo',
            fotoPerfil: data.fotoPerfil,
            prestamosActivos,
            adeudosPendientes,
            totalAdeudado,
            estado,
          };
        })
      );

      setStudents(studentsData);
    } catch (error) {
      console.error('Error fetching students:', error);
    } finally {
      setLoading(false);
    }
  };

  const groupStudents = () => {
    let filtered = students;

    // Filtrar por búsqueda
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(s => 
        s.nombre.toLowerCase().includes(term) ||
        s.correo.toLowerCase().includes(term) ||
        s.grupo.toLowerCase().includes(term)
      );
    }

    // Filtrar por estado
    if (selectedEstado !== 'todos') {
      filtered = filtered.filter(s => s.estado === selectedEstado);
    }

    // Agrupar por grupo
    const grouped: GroupedStudents = {};
    filtered.forEach(student => {
      if (!grouped[student.grupo]) {
        grouped[student.grupo] = [];
      }
      grouped[student.grupo].push(student);
    });

    // Ordenar estudiantes dentro de cada grupo por estado (crítico primero)
    Object.keys(grouped).forEach(grupo => {
      grouped[grupo].sort((a, b) => {
        const estadoOrder = { critico: 0, adeudo: 1, prestamo: 2, limpio: 3 };
        return estadoOrder[a.estado] - estadoOrder[b.estado];
      });
    });

    setGroupedStudents(grouped);
  };

  const toggleGroup = (grupo: string) => {
    const newExpanded = new Set(expandedGroups);
    if (newExpanded.has(grupo)) {
      newExpanded.delete(grupo);
    } else {
      newExpanded.add(grupo);
    }
    setExpandedGroups(newExpanded);
  };

  const expandAll = () => {
    setExpandedGroups(new Set(Object.keys(groupedStudents)));
  };

  const collapseAll = () => {
    setExpandedGroups(new Set());
  };

  const getEstadoColor = (estado: Student['estado']) => {
    switch (estado) {
      case 'limpio':
        return 'bg-green-500';
      case 'prestamo':
        return 'bg-blue-500';
      case 'adeudo':
        return 'bg-yellow-500';
      case 'critico':
        return 'bg-red-500';
    }
  };

  const getEstadoIcon = (estado: Student['estado']) => {
    switch (estado) {
      case 'limpio':
        return <CheckCircle className="h-4 w-4" />;
      case 'prestamo':
        return <Clock className="h-4 w-4" />;
      case 'adeudo':
        return <AlertCircle className="h-4 w-4" />;
      case 'critico':
        return <DollarSign className="h-4 w-4" />;
    }
  };

  const getEstadoText = (estado: Student['estado']) => {
    switch (estado) {
      case 'limpio':
        return 'Al corriente';
      case 'prestamo':
        return 'Con préstamo';
      case 'adeudo':
        return 'Con adeudo';
      case 'critico':
        return 'Crítico (+$1,000)';
    }
  };

  // Estadísticas generales
  const stats = {
    total: students.length,
    limpios: students.filter(s => s.estado === 'limpio').length,
    conPrestamo: students.filter(s => s.estado === 'prestamo').length,
    conAdeudo: students.filter(s => s.estado === 'adeudo').length,
    criticos: students.filter(s => s.estado === 'critico').length,
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        
        <div className="flex justify-center items-center h-64">
          <LoaderCircle className="h-12 w-12 text-blue-500 animate-spin" />
          <p className="ml-4 text-gray-600">Cargando estudiantes...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4 sm:p-6 md:p-8">
        <AdminBackButton href="/admin" />
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <Users className="h-8 w-8 text-blue-600" />
          <h1 className="text-3xl font-bold text-gray-800">Gestión de Estudiantes</h1>
        </div>

        {/* Estadísticas */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-4 mb-6">
          <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200">
            <p className="text-sm text-gray-600">Total</p>
            <p className="text-2xl font-bold text-gray-800">{stats.total}</p>
          </div>
          <div className="bg-green-50 rounded-lg p-4 shadow-sm border border-green-200">
            <p className="text-sm text-green-600">Al corriente</p>
            <p className="text-2xl font-bold text-green-700">{stats.limpios}</p>
          </div>
          <div className="bg-blue-50 rounded-lg p-4 shadow-sm border border-blue-200">
            <p className="text-sm text-blue-600">Con préstamo</p>
            <p className="text-2xl font-bold text-blue-700">{stats.conPrestamo}</p>
          </div>
          <div className="bg-yellow-50 rounded-lg p-4 shadow-sm border border-yellow-200">
            <p className="text-sm text-yellow-600">Con adeudo</p>
            <p className="text-2xl font-bold text-yellow-700">{stats.conAdeudo}</p>
          </div>
          <div className="bg-red-50 rounded-lg p-4 shadow-sm border border-red-200">
            <p className="text-sm text-red-600">Críticos</p>
            <p className="text-2xl font-bold text-red-700">{stats.criticos}</p>
          </div>
        </div>

        {/* Filtros */}
        <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
          <div className="flex flex-col sm:flex-row gap-4">
            {/* Búsqueda */}
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="Buscar por nombre, correo o grupo..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* Filtro por estado */}
            <select
              value={selectedEstado}
              onChange={(e) => setSelectedEstado(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="todos">Todos los estados</option>
              <option value="limpio">✅ Al corriente</option>
              <option value="prestamo">🔵 Con préstamo</option>
              <option value="adeudo">⚠️ Con adeudo</option>
              <option value="critico">🔴 Críticos</option>
            </select>

            {/* Botones expandir/colapsar */}
            <div className="flex gap-2">
              <button
                onClick={expandAll}
                className="px-4 py-2 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
              >
                Expandir todo
              </button>
              <button
                onClick={collapseAll}
                className="px-4 py-2 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
              >
                Colapsar todo
              </button>
            </div>
          </div>
        </div>

        {/* Lista de grupos */}
        <div className="space-y-4">
          {Object.keys(groupedStudents).sort().map(grupo => (
            <div key={grupo} className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
              {/* Header del grupo */}
              <button
                onClick={() => toggleGroup(grupo)}
                className="w-full px-6 py-4 flex items-center justify-between bg-gradient-to-r from-blue-50 to-blue-100 hover:from-blue-100 hover:to-blue-200 transition-colors"
              >
                <div className="flex items-center gap-3">
                  {expandedGroups.has(grupo) ? (
                    <ChevronDown className="h-5 w-5 text-blue-600" />
                  ) : (
                    <ChevronRight className="h-5 w-5 text-blue-600" />
                  )}
                  <h2 className="text-xl font-bold text-gray-800">Grupo {grupo}</h2>
                  <span className="px-3 py-1 bg-blue-200 text-blue-800 rounded-full text-sm font-semibold">
                    {groupedStudents[grupo].length} estudiantes
                  </span>
                </div>
                
                {/* Mini estadísticas del grupo */}
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1 text-sm">
                    <div className="w-3 h-3 rounded-full bg-green-500"></div>
                    <span className="text-gray-600">{groupedStudents[grupo].filter(s => s.estado === 'limpio').length}</span>
                  </div>
                  <div className="flex items-center gap-1 text-sm">
                    <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                    <span className="text-gray-600">{groupedStudents[grupo].filter(s => s.estado === 'prestamo').length}</span>
                  </div>
                  <div className="flex items-center gap-1 text-sm">
                    <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                    <span className="text-gray-600">{groupedStudents[grupo].filter(s => s.estado === 'adeudo').length}</span>
                  </div>
                  <div className="flex items-center gap-1 text-sm">
                    <div className="w-3 h-3 rounded-full bg-red-500"></div>
                    <span className="text-gray-600">{groupedStudents[grupo].filter(s => s.estado === 'critico').length}</span>
                  </div>
                </div>
              </button>

              {/* Lista de estudiantes */}
              {expandedGroups.has(grupo) && (
                <div className="divide-y divide-gray-100">
                  {groupedStudents[grupo].map(student => (
                    <div
                      key={student.uid}
                      className="px-6 py-4 hover:bg-gray-50 transition-colors"
                    >
                      <div className="flex items-center justify-between">
                        {/* Info del estudiante */}
                        <div className="flex items-center gap-4 flex-1">
                          {/* Indicador de estado */}
                          <div className={`w-4 h-4 rounded-full ${getEstadoColor(student.estado)} flex items-center justify-center`}>
                            <div className="w-2 h-2 bg-white rounded-full"></div>
                          </div>

                          {/* Foto de perfil */}
                          {student.fotoPerfil ? (
                            <img
                              src={student.fotoPerfil}
                              alt={student.nombre}
                              className="w-10 h-10 rounded-full object-cover border-2 border-gray-200"
                            />
                          ) : (
                            <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center text-gray-500 font-semibold">
                              {student.nombre.charAt(0).toUpperCase()}
                            </div>
                          )}

                          {/* Nombre y correo */}
                          <div className="flex-1">
                            <p className="font-semibold text-gray-800">{student.nombre}</p>
                            <p className="text-sm text-gray-500">{student.correo}</p>
                          </div>
                        </div>

                        {/* Métricas */}
                        <div className="flex items-center gap-6">
                          {student.prestamosActivos > 0 && (
                            <div className="text-center">
                              <p className="text-xs text-gray-500">Préstamos</p>
                              <p className="text-lg font-bold text-blue-600">{student.prestamosActivos}</p>
                            </div>
                          )}
                          {student.adeudosPendientes > 0 && (
                            <div className="text-center">
                              <p className="text-xs text-gray-500">Adeudos</p>
                              <p className="text-lg font-bold text-yellow-600">{student.adeudosPendientes}</p>
                            </div>
                          )}
                          {student.totalAdeudado > 0 && (
                            <div className="text-center">
                              <p className="text-xs text-gray-500">Total</p>
                              <p className="text-lg font-bold text-red-600">
                                ${student.totalAdeudado.toFixed(0)}
                              </p>
                            </div>
                          )}

                          {/* Badge de estado */}
                          <div className={`px-3 py-1 rounded-full flex items-center gap-2 ${
                            student.estado === 'limpio' ? 'bg-green-100 text-green-700' :
                            student.estado === 'prestamo' ? 'bg-blue-100 text-blue-700' :
                            student.estado === 'adeudo' ? 'bg-yellow-100 text-yellow-700' :
                            'bg-red-100 text-red-700'
                          }`}>
                            {getEstadoIcon(student.estado)}
                            <span className="text-sm font-medium">{getEstadoText(student.estado)}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Empty state */}
        {Object.keys(groupedStudents).length === 0 && (
          <div className="bg-white rounded-lg shadow-sm p-12 text-center">
            <Users className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-600 font-semibold">No se encontraron estudiantes</p>
            <p className="text-sm text-gray-500 mt-2">Intenta ajustar los filtros de búsqueda</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminStudentsPage;