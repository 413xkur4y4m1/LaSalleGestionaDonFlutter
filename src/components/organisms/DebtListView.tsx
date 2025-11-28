'use client';

import React, { useEffect, useState } from 'react';
import { collection, query, where, getDocs, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { AlertTriangle, Calendar, DollarSign, CreditCard, Loader2 } from 'lucide-react';

// --- TIPOS ---
interface Adeudo {
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
  formularioId?: string; // ⭐ AGREGADO
}

// ⭐ CAMBIAR LA INTERFAZ DE NUEVO
interface DebtListViewProps {
  studentUid: string;
  onPayDebt?: (debtId: string, prestamoOriginal: string) => void; // ⭐ Volver a prestamoOriginal
}

// --- SUB-COMPONENTE: TARJETA DE ADEUDO ---
interface DebtCardProps {
  debt: Adeudo;
  onPayDebt?: (debtId: string, prestamoOriginal: string) => void; // ⭐ Volver a prestamoOriginal
}

const DebtCard: React.FC<DebtCardProps> = ({ debt, onPayDebt }) => {
  const totalAdeudo = debt.precio_ajustado * debt.cantidad;
  
  const formattedDate = debt.fechaVencimiento 
    ? new Date(debt.fechaVencimiento).toLocaleDateString('es-MX', {
        year: 'numeric', 
        month: 'long', 
        day: 'numeric'
      })
    : 'No especificada';

  // Iconos y textos según el tipo de adeudo
  const tipoInfo = {
    rotura: { icon: '🔨', texto: 'Material roto' },
    perdida: { icon: '❌', texto: 'Material perdido' },
    vencimiento: { icon: '⏰', texto: 'No devuelto a tiempo' }
  }[debt.tipo] || { icon: '📦', texto: 'Adeudo' };

  const handlePayClick = () => {
    // ⭐ OPCIÓN 1: Si el adeudo tiene formularioId
    if (onPayDebt && debt.formularioId) {
      onPayDebt(debt.id, debt.formularioId);
    } 
    // ⭐ OPCIÓN 2: Si no tiene formularioId, usar prestamoOriginal como fallback
    else if (onPayDebt && debt.prestamoOriginal) {
      // Construir formId basado en prestamoOriginal
      const formId = `form_${debt.prestamoOriginal}`;
      onPayDebt(debt.id, formId);
    } 
    else {
      alert(`No se encontró formulario para este adeudo: ${debt.codigo}`);
    }
  };

  return (
    <div className="bg-white border border-yellow-300 rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow duration-200">
      <div className="flex items-start gap-4">
        <div className="bg-yellow-100 p-2 rounded-full">
          <AlertTriangle className="h-6 w-6 text-yellow-600" />
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xl">{tipoInfo.icon}</span>
            <h4 className="font-bold text-gray-800 text-md">{debt.nombreMaterial}</h4>
          </div>
          
          <p className="text-xs text-gray-500 font-mono mb-2">
            Código: {debt.codigo}
          </p>
          
          <p className="text-sm text-orange-600 font-medium mb-3">
            {tipoInfo.texto}
          </p>
          
          <div className="text-sm text-gray-600 space-y-2">
            <div className="flex items-center gap-2">
              <DollarSign className="h-4 w-4 text-gray-500" />
              <span>
                Monto: <strong className="text-red-600">${totalAdeudo.toFixed(2)} {debt.moneda}</strong>
              </span>
            </div>
            
            <div className="flex items-center gap-2">
              <span className="text-gray-500">📦</span>
              <span>Cantidad: <strong>{debt.cantidad}</strong> × ${debt.precio_ajustado.toFixed(2)}</span>
            </div>
            
            {debt.fechaVencimiento && (
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-gray-500" />
                <span>Vencimiento: {formattedDate}</span>
              </div>
            )}
            
            {debt.grupo && (
              <div className="flex items-center gap-2">
                <span className="text-gray-500">👥</span>
                <span>Grupo: <strong>{debt.grupo}</strong></span>
              </div>
            )}
          </div>
        </div>
      </div>
      
      <div className="mt-4 pt-3 border-t border-gray-100 flex justify-end">
        <button 
          className="flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white text-sm font-semibold py-2 px-4 rounded-lg transition-colors duration-200"
          onClick={handlePayClick}
        >
          <CreditCard className="h-4 w-4" />
          <span>Pagar ahora</span>
        </button>
      </div>
    </div>
  );
};

// --- COMPONENTE PRINCIPAL ---
const DebtListView: React.FC<DebtListViewProps> = ({ studentUid, onPayDebt }) => {
  const [adeudos, setAdeudos] = useState<Adeudo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!studentUid) {
      setLoading(false);
      setError('No se proporcionó un ID de estudiante');
      return;
    }

    const obtenerAdeudos = async () => {
      try {
        setLoading(true);
        setError(null);

        console.log('🔍 Obteniendo adeudos para UID:', studentUid);

        // Referencia a la subcolección Adeudos
        const adeudosRef = collection(db, `Estudiantes/${studentUid}/Adeudos`);
        
        // Query para adeudos pendientes
        const q = query(adeudosRef, where('estado', '==', 'pendiente'));
        
        const querySnapshot = await getDocs(q);

        console.log('📦 Adeudos encontrados:', querySnapshot.size);

        const adeudosData: Adeudo[] = querySnapshot.docs.map(doc => {
          const data = doc.data();
          
          // Validación de datos
          const precioUnitario = Number(data.precio_unitario) || 0;
          const precioAjustado = Number(data.precio_ajustado) || precioUnitario;
          const cantidad = Number(data.cantidad) || 1;

          // Convertir Timestamp a string
          let fechaVencimiento = null;
          if (data.fechaVencimiento) {
            if (data.fechaVencimiento instanceof Timestamp) {
              fechaVencimiento = data.fechaVencimiento.toDate().toISOString();
            } else if (typeof data.fechaVencimiento === 'string') {
              fechaVencimiento = data.fechaVencimiento;
            }
          }

          return {
            id: doc.id,
            codigo: data.codigo || 'SIN-CODIGO',
            nombreMaterial: data.nombreMaterial || 'Sin nombre',
            cantidad,
            precio_unitario: precioUnitario,
            precio_ajustado: precioAjustado,
            moneda: data.moneda || 'MXN',
            estado: data.estado || 'pendiente',
            tipo: data.tipo || 'vencimiento',
            fechaVencimiento,
            grupo: data.grupo || '',
            prestamoOriginal: data.prestamoOriginal || null,
            formularioId: data.formularioId || data.formId || null, // ⭐ AGREGADO
          };
        });

        setAdeudos(adeudosData);

      } catch (err: any) {
        console.error('❌ Error al obtener adeudos:', err);
        setError(err.message || 'Error desconocido');
      } finally {
        setLoading(false);
      }
    };

    obtenerAdeudos();
  }, [studentUid]);

  // Estado de carga
  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
        <span className="ml-3 text-gray-600">Cargando adeudos...</span>
      </div>
    );
  }

  // Estado de error
  if (error) {
    return (
      <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
        <div className="flex items-center gap-2 mb-2">
          <AlertTriangle className="h-5 w-5 text-red-600" />
          <h3 className="font-bold text-red-800">Error al cargar adeudos</h3>
        </div>
        <p className="text-red-600 text-sm">{error}</p>
        <p className="text-red-500 text-xs mt-2">
          Revisa la consola del navegador para más detalles
        </p>
      </div>
    );
  }

  // Sin adeudos
  if (adeudos.length === 0) {
    return (
      <div className="text-center p-6 bg-green-50 rounded-lg border border-green-200">
        <div className="text-6xl mb-4">🎉</div>
        <h3 className="font-bold text-green-800 text-xl">¡Felicidades!</h3>
        <p className="text-green-700 mt-2">No tienes ningún adeudo pendiente.</p>
      </div>
    );
  }

  // Calcular total
  const totalGeneral = adeudos.reduce((sum, adeudo) => 
    sum + (adeudo.precio_ajustado * adeudo.cantidad), 0
  );

  return (
    <div className="w-full space-y-4 p-1">
      {/* Header con resumen */}
      <div className="bg-gradient-to-r from-yellow-50 to-orange-50 border border-yellow-300 rounded-lg p-4 shadow-sm">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-bold text-yellow-800 text-lg">
              Tienes {adeudos.length} adeudo{adeudos.length !== 1 ? 's' : ''} pendiente{adeudos.length !== 1 ? 's' : ''}
            </h3>
            <p className="text-yellow-700 text-sm mt-1">
              Por favor, realiza el pago lo antes posible
            </p>
          </div>
          <div className="text-right">
            <p className="text-2xl font-bold text-red-600">
              ${totalGeneral.toFixed(2)}
            </p>
            <p className="text-xs text-gray-600">MXN</p>
          </div>
        </div>
      </div>

      {/* Lista de adeudos */}
      {adeudos.map(debt => (
        <DebtCard key={debt.id} debt={debt} onPayDebt={onPayDebt} />
      ))}

      {/* Nota informativa 
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mt-4">
        <p className="text-sm text-blue-800">
          <strong>💡 Nota:</strong> Haz clic en "Pagar ahora" para completar el 
          formulario de pago y resolver tu adeudo.
        </p>
      </div>
      */}
    </div>
  );
};

export default DebtListView;