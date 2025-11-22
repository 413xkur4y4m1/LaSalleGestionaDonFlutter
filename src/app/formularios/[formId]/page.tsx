'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Image from 'next/image';

type FormularioData = {
  formId: string;
  prestamoId: string;
  adeudoId: string;
  tipo: string;
  pregunta: string;
  opciones: string[];
  respuesta: string;
  estado: string;
  fechaCreacion: any;
  urlFormulario: string;
  uid: string;
  nombreEstudiante: string;
  correoEstudiante: string;
  nombreMaterial: string;
  cantidad: number;
  codigoAdeudo: string;
  grupo: string;
  precio_ajustado?: number;
};

export default function FormularioPage() {
  const params = useParams();
  const router = useRouter();
  const formId = (params?.formId as string) || '';
  
  const [formulario, setFormulario] = useState<FormularioData | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [selectedOption, setSelectedOption] = useState('');
  const [showPaymentOptions, setShowPaymentOptions] = useState(false);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState('');
  const [qrUrl, setQrUrl] = useState('');
  const [showSuccess, setShowSuccess] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  useEffect(() => {
    if (formId) {
      fetchFormulario();
    } else {
      setError('ID de formulario no válido');
      setLoading(false);
    }
  }, [formId]);

  const fetchFormulario = async () => {
    try {
      const response = await fetch(`/api/formularios/${formId}`);
      const data = await response.json();
      
      if (data.success) {
        if (data.formulario.estado === 'completado') {
          setError('Este formulario ya ha sido completado.');
        } else {
          setFormulario(data.formulario);
        }
      } else {
        setError(data.message || 'Formulario no encontrado');
      }
    } catch (err) {
      setError('Error al cargar el formulario');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!selectedOption) {
      setError('Por favor selecciona una opción');
      return;
    }

    // Si seleccionó "Lo rompí" o "Lo perdí", mostrar opciones de pago
    if ((selectedOption === 'Lo rompí' || selectedOption === 'Lo perdí') && !showPaymentOptions) {
      setShowPaymentOptions(true);
      return;
    }

    // Validar método de pago si es necesario
    if (showPaymentOptions && !selectedPaymentMethod) {
      setError('Por favor selecciona un método de pago');
      return;
    }

    setSubmitting(true);
    setError('');

    try {
      const response = await fetch(`/api/formularios/${formId}/responder`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          respuesta: selectedOption,
          metodoPago: selectedPaymentMethod || null,
          adeudoId: formulario?.adeudoId,
          uid: formulario?.uid,
          correoEstudiante: formulario?.correoEstudiante,
          nombreEstudiante: formulario?.nombreEstudiante,
          nombreMaterial: formulario?.nombreMaterial,
          cantidad: formulario?.cantidad,
          codigoAdeudo: formulario?.codigoAdeudo,
          grupo: formulario?.grupo,
          precio_ajustado: formulario?.precio_ajustado || 0
        })
      });

      const data = await response.json();

      if (data.success) {
        setShowSuccess(true);
        setSuccessMessage(data.message);
        
        // Si hay QR de devolución o pago, mostrarlo
        if (data.qrUrl) {
          setQrUrl(data.qrUrl);
        }

        // Si es pago en línea, redirigir
        if (data.paymentUrl) {
          setTimeout(() => {
            window.location.href = data.paymentUrl;
          }, 2000);
        }
      } else {
        setError(data.message || 'Error al procesar la respuesta');
      }
    } catch (err) {
      setError('Error al enviar la respuesta');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-purple-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Cargando formulario...</p>
        </div>
      </div>
    );
  }

  if (error && !formulario) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 to-orange-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-xl p-8 max-w-md w-full text-center">
          <div className="text-6xl mb-4">⚠️</div>
          <h1 className="text-2xl font-bold text-gray-800 mb-2">Error</h1>
          <p className="text-gray-600">{error}</p>
        </div>
      </div>
    );
  }

  if (showSuccess) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-xl p-8 max-w-2xl w-full">
          <div className="text-center">
            <div className="text-6xl mb-4">✅</div>
            <h1 className="text-2xl font-bold text-gray-800 mb-4">¡Formulario Completado!</h1>
            <p className="text-gray-600 mb-6">{successMessage}</p>
            
            {qrUrl && (
              <div className="bg-gray-50 p-6 rounded-lg border-2 border-purple-200">
                <p className="font-semibold text-gray-800 mb-4">
                  {selectedOption === 'Lo tengo pero no lo he devuelto' 
                    ? '📱 Tu código QR de devolución:' 
                    : '💳 Tu código QR de pago:'}
                </p>
                <div className="bg-white p-4 rounded-lg inline-block">
                  <Image 
                    src={`https://quickchart.io/qr?text=${encodeURIComponent(qrUrl)}&size=300`}
                    alt="Código QR"
                    width={300}
                    height={300}
                    className="mx-auto"
                  />
                </div>
                <p className="text-sm text-gray-600 mt-4">
                  {selectedOption === 'Lo tengo pero no lo he devuelto'
                    ? 'Presenta este código en el laboratorio para devolver tu material'
                    : 'Presenta este código en caja para realizar tu pago'}
                </p>
                <p className="text-xs text-gray-500 mt-2 break-all font-mono bg-gray-100 p-2 rounded">
                  {qrUrl}
                </p>
              </div>
            )}

            <div className="mt-6 text-sm text-gray-500">
              Se ha enviado un correo electrónico con los detalles a tu correo institucional.
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 py-8 px-4">
      <div className="max-w-3xl mx-auto">
        <div className="bg-white rounded-lg shadow-xl overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-purple-600 to-blue-600 p-6 text-white">
            <h1 className="text-2xl font-bold">📋 Formulario de Seguimiento</h1>
            <p className="text-purple-100 mt-2">Código: {formulario?.formId}</p>
          </div>

          {/* Información del Adeudo */}
          <div className="p-6 bg-red-50 border-l-4 border-red-500">
            <h2 className="font-semibold text-gray-800 mb-3">📦 Información del Adeudo</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
              <div>
                <span className="text-gray-600">Material:</span>
                <span className="ml-2 font-semibold">{formulario?.nombreMaterial}</span>
              </div>
              <div>
                <span className="text-gray-600">Cantidad:</span>
                <span className="ml-2 font-semibold">{formulario?.cantidad}</span>
              </div>
              <div>
                <span className="text-gray-600">Código:</span>
                <span className="ml-2 font-semibold">{formulario?.codigoAdeudo}</span>
              </div>
              <div>
                <span className="text-gray-600">Estudiante:</span>
                <span className="ml-2 font-semibold">{formulario?.nombreEstudiante}</span>
              </div>
            </div>
          </div>

          {/* Pregunta */}
          <div className="p-6">
            <div className="bg-yellow-50 border-l-4 border-yellow-500 p-4 mb-6">
              <h3 className="font-semibold text-gray-800 mb-2">❓ Pregunta:</h3>
              <p className="text-gray-700">{formulario?.pregunta}</p>
            </div>

            {/* Opciones */}
            {!showPaymentOptions ? (
              <div className="space-y-3">
                <p className="font-semibold text-gray-800 mb-4">Selecciona una opción:</p>
                {formulario?.opciones.map((opcion, index) => (
                  <label
                    key={index}
                    className={`flex items-center p-4 border-2 rounded-lg cursor-pointer transition-all ${
                      selectedOption === opcion
                        ? 'border-purple-500 bg-purple-50'
                        : 'border-gray-200 hover:border-purple-300 hover:bg-gray-50'
                    }`}
                  >
                    <input
                      type="radio"
                      name="respuesta"
                      value={opcion}
                      checked={selectedOption === opcion}
                      onChange={(e) => setSelectedOption(e.target.value)}
                      className="w-5 h-5 text-purple-600"
                    />
                    <span className="ml-3 text-gray-700">{opcion}</span>
                  </label>
                ))}
              </div>
            ) : (
              <div className="space-y-3">
                <div className="bg-blue-50 border-l-4 border-blue-500 p-4 mb-4">
                  <p className="text-gray-800">
                    <strong>Has seleccionado:</strong> "{selectedOption}"
                  </p>
                  <p className="text-gray-600 text-sm mt-2">
                    Debido a esto, debes realizar el pago del material. Selecciona tu método de pago:
                  </p>
                </div>

                <p className="font-semibold text-gray-800 mb-4">💳 Método de Pago:</p>
                
                <label
                  className={`flex items-center p-4 border-2 rounded-lg cursor-pointer transition-all ${
                    selectedPaymentMethod === 'en línea'
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-blue-300 hover:bg-gray-50'
                  }`}
                >
                  <input
                    type="radio"
                    name="metodoPago"
                    value="en línea"
                    checked={selectedPaymentMethod === 'en línea'}
                    onChange={(e) => setSelectedPaymentMethod(e.target.value)}
                    className="w-5 h-5 text-blue-600"
                  />
                  <div className="ml-3">
                    <span className="text-gray-700 font-semibold">💻 Pago en línea</span>
                    <p className="text-sm text-gray-500">Paga ahora con tarjeta de crédito/débito</p>
                  </div>
                </label>

                <label
                  className={`flex items-center p-4 border-2 rounded-lg cursor-pointer transition-all ${
                    selectedPaymentMethod === 'presencial'
                      ? 'border-green-500 bg-green-50'
                      : 'border-gray-200 hover:border-green-300 hover:bg-gray-50'
                  }`}
                >
                  <input
                    type="radio"
                    name="metodoPago"
                    value="presencial"
                    checked={selectedPaymentMethod === 'presencial'}
                    onChange={(e) => setSelectedPaymentMethod(e.target.value)}
                    className="w-5 h-5 text-green-600"
                  />
                  <div className="ml-3">
                    <span className="text-gray-700 font-semibold">🏪 Pago presencial</span>
                    <p className="text-sm text-gray-500">Recibirás un código QR para pagar en caja</p>
                  </div>
                </label>
              </div>
            )}

            {error && (
              <div className="mt-4 p-4 bg-red-50 border-l-4 border-red-500 text-red-700">
                {error}
              </div>
            )}

            {/* Botones */}
            <div className="mt-6 flex gap-3">
              {showPaymentOptions && (
                <button
                  onClick={() => {
                    setShowPaymentOptions(false);
                    setSelectedPaymentMethod('');
                    setError('');
                  }}
                  className="px-6 py-3 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
                  disabled={submitting}
                >
                  ← Volver
                </button>
              )}
              
              <button
                onClick={handleSubmit}
                disabled={submitting || !selectedOption}
                className={`flex-1 px-6 py-3 rounded-lg font-semibold transition-colors ${
                  submitting || !selectedOption
                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    : 'bg-purple-600 text-white hover:bg-purple-700'
                }`}
              >
                {submitting ? (
                  <span className="flex items-center justify-center">
                    <svg className="animate-spin h-5 w-5 mr-3" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    Procesando...
                  </span>
                ) : showPaymentOptions ? (
                  'Confirmar Método de Pago'
                ) : (
                  'Enviar Respuesta'
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Información adicional */}
        <div className="mt-4 text-center text-sm text-gray-600">
          <p>Si tienes alguna duda, contacta al encargado del laboratorio</p>
        </div>
      </div>
    </div>
  );
}