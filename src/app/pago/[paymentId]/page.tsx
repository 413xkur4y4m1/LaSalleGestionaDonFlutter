// /app/pago/[paymentId]/page.tsx

'use client';

import { useState, useEffect } from 'react';
import { useParams, useSearchParams, useRouter } from 'next/navigation';

type AdeudoData = {
  nombreMaterial: string;
  cantidad: number;
  precio_ajustado: number;
  codigo: string;
  tipo: string;
};

export default function PagoPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  
  const paymentId = (params?.paymentId as string) || '';
  const adeudoId = searchParams?.get('adeudo') || '';
  const uid = searchParams?.get('uid') || '';
  const monto = parseFloat(searchParams?.get('monto') || '0');
  
  const [adeudo, setAdeudo] = useState<AdeudoData | null>(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'card' | 'oxxo' | 'spei'>('card');
  const [cardData, setCardData] = useState({
    number: '',
    name: '',
    expiry: '',
    cvv: ''
  });

  useEffect(() => {
    if (adeudoId && uid && paymentId) {
      fetchAdeudo();
    } else {
      setError('Parámetros inválidos');
      setLoading(false);
    }
  }, [adeudoId, uid, paymentId]);

  const fetchAdeudo = async () => {
    try {
      const response = await fetch(`/api/adeudos/${adeudoId}?uid=${uid}`);
      const data = await response.json();
      
      if (data.success) {
        setAdeudo(data.adeudo);
      } else {
        setError(data.message || 'No se pudo cargar el adeudo');
      }
    } catch (err) {
      setError('Error al cargar la información del adeudo');
    } finally {
      setLoading(false);
    }
  };

  const handleCardInputChange = (field: string, value: string) => {
    let formattedValue = value;
    
    // Formatear número de tarjeta (XXXX XXXX XXXX XXXX)
    if (field === 'number') {
      formattedValue = value.replace(/\s/g, '').replace(/(\d{4})/g, '$1 ').trim();
      if (formattedValue.length > 19) return;
    }
    
    // Formatear fecha de expiración (MM/YY)
    if (field === 'expiry') {
      formattedValue = value.replace(/\D/g, '');
      if (formattedValue.length >= 2) {
        formattedValue = formattedValue.slice(0, 2) + '/' + formattedValue.slice(2, 4);
      }
      if (formattedValue.length > 5) return;
    }
    
    // Limitar CVV a 4 dígitos
    if (field === 'cvv') {
      formattedValue = value.replace(/\D/g, '').slice(0, 4);
    }
    
    setCardData(prev => ({ ...prev, [field]: formattedValue }));
  };

  const handlePayment = async () => {
    setError('');
    
    // Validaciones básicas
    if (paymentMethod === 'card') {
      if (!cardData.number || !cardData.name || !cardData.expiry || !cardData.cvv) {
        setError('Por favor completa todos los campos de la tarjeta');
        return;
      }
      
      const cardNumber = cardData.number.replace(/\s/g, '');
      if (cardNumber.length < 15 || cardNumber.length > 16) {
        setError('Número de tarjeta inválido');
        return;
      }
      
      if (cardData.cvv.length < 3) {
        setError('CVV inválido');
        return;
      }
    }

    setProcessing(true);

    try {
      const response = await fetch('/api/procesar-pago', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          paymentId,
          adeudoId,
          uid,
          monto,
          metodoPago: paymentMethod,
          cardData: paymentMethod === 'card' ? {
            lastFour: cardData.number.slice(-4),
            name: cardData.name
          } : null
        })
      });

      const data = await response.json();

      if (data.success) {
        // Redirigir a página de éxito
        router.push(`/pago-exitoso?payment=${paymentId}&adeudo=${adeudoId}`);
      } else {
        setError(data.message || 'Error al procesar el pago');
      }
    } catch (err) {
      setError('Error al procesar el pago. Por favor intenta nuevamente.');
    } finally {
      setProcessing(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Cargando información de pago...</p>
        </div>
      </div>
    );
  }

  if (error && !adeudo) {
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-block bg-blue-600 text-white px-6 py-3 rounded-full font-semibold mb-4">
            💳 Pago en Línea
          </div>
          <h1 className="text-3xl font-bold text-gray-800">Realizar Pago</h1>
          <p className="text-gray-600 mt-2">ID de Transacción: {paymentId}</p>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {/* Resumen del Adeudo */}
          <div className="md:col-span-1">
            <div className="bg-white rounded-lg shadow-lg p-6 sticky top-6">
              <h2 className="text-xl font-bold text-gray-800 mb-4">📦 Resumen</h2>
              
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Material:</span>
                  <span className="font-semibold text-right">{adeudo?.nombreMaterial}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Cantidad:</span>
                  <span className="font-semibold">{adeudo?.cantidad}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Código:</span>
                  <span className="font-semibold">{adeudo?.codigo}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Tipo:</span>
                  <span className="font-semibold capitalize">{adeudo?.tipo}</span>
                </div>
              </div>

              <div className="border-t border-gray-200 mt-4 pt-4">
                <div className="flex justify-between items-center">
                  <span className="text-lg font-semibold text-gray-800">Total:</span>
                  <span className="text-2xl font-bold text-blue-600">${monto.toFixed(2)} MXN</span>
                </div>
              </div>

              <div className="mt-6 bg-blue-50 border-l-4 border-blue-500 p-3 rounded">
                <p className="text-xs text-gray-700">
                  <strong>💡 Nota:</strong> Una vez completado el pago, tu adeudo será marcado como pagado automáticamente.
                </p>
              </div>
            </div>
          </div>

          {/* Formulario de Pago */}
          <div className="md:col-span-2">
            <div className="bg-white rounded-lg shadow-lg p-6">
              <h2 className="text-xl font-bold text-gray-800 mb-6">💳 Método de Pago</h2>

              {/* Selector de Método */}
              <div className="grid grid-cols-3 gap-3 mb-6">
                <button
                  onClick={() => setPaymentMethod('card')}
                  className={`p-4 rounded-lg border-2 transition-all ${
                    paymentMethod === 'card'
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-blue-300'
                  }`}
                >
                  <div className="text-2xl mb-2">💳</div>
                  <div className="text-sm font-semibold">Tarjeta</div>
                </button>
                
                <button
                  onClick={() => setPaymentMethod('oxxo')}
                  className={`p-4 rounded-lg border-2 transition-all ${
                    paymentMethod === 'oxxo'
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-blue-300'
                  }`}
                >
                  <div className="text-2xl mb-2">🏪</div>
                  <div className="text-sm font-semibold">OXXO</div>
                </button>
                
                <button
                  onClick={() => setPaymentMethod('spei')}
                  className={`p-4 rounded-lg border-2 transition-all ${
                    paymentMethod === 'spei'
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-blue-300'
                  }`}
                >
                  <div className="text-2xl mb-2">🏦</div>
                  <div className="text-sm font-semibold">SPEI</div>
                </button>
              </div>

              {/* Formulario de Tarjeta */}
              {paymentMethod === 'card' && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Número de Tarjeta
                    </label>
                    <input
                      type="text"
                      placeholder="1234 5678 9012 3456"
                      value={cardData.number}
                      onChange={(e) => handleCardInputChange('number', e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Nombre del Titular
                    </label>
                    <input
                      type="text"
                      placeholder="JUAN PÉREZ"
                      value={cardData.name}
                      onChange={(e) => handleCardInputChange('name', e.target.value.toUpperCase())}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Fecha de Expiración
                      </label>
                      <input
                        type="text"
                        placeholder="MM/YY"
                        value={cardData.expiry}
                        onChange={(e) => handleCardInputChange('expiry', e.target.value)}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        CVV
                      </label>
                      <input
                        type="text"
                        placeholder="123"
                        value={cardData.cvv}
                        onChange={(e) => handleCardInputChange('cvv', e.target.value)}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                  </div>

                  <div className="bg-gray-50 p-4 rounded-lg flex items-start gap-3">
                    <div className="text-2xl">🔒</div>
                    <div className="text-xs text-gray-600">
                      <strong>Seguridad garantizada:</strong> Tus datos están protegidos con encriptación de nivel bancario. No almacenamos información de tarjetas.
                    </div>
                  </div>
                </div>
              )}

              {/* OXXO */}
              {paymentMethod === 'oxxo' && (
                <div className="bg-yellow-50 border-l-4 border-yellow-500 p-4 rounded">
                  <p className="text-sm text-gray-700 mb-3">
                    <strong>📋 Instrucciones para OXXO:</strong>
                  </p>
                  <ol className="text-sm text-gray-600 space-y-2 ml-4 list-decimal">
                    <li>Genera tu ficha de pago</li>
                    <li>Acude a cualquier tienda OXXO</li>
                    <li>Presenta el código de barras en caja</li>
                    <li>Realiza tu pago en efectivo</li>
                    <li>Guarda tu comprobante</li>
                  </ol>
                </div>
              )}

              {/* SPEI */}
              {paymentMethod === 'spei' && (
                <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded">
                  <p className="text-sm text-gray-700 mb-3">
                    <strong>🏦 Instrucciones para SPEI:</strong>
                  </p>
                  <ol className="text-sm text-gray-600 space-y-2 ml-4 list-decimal">
                    <li>Recibirás una CLABE interbancaria</li>
                    <li>Ingresa a tu banca en línea</li>
                    <li>Realiza una transferencia SPEI</li>
                    <li>El pago se acreditará automáticamente</li>
                  </ol>
                </div>
              )}

              {/* Error Message */}
              {error && (
                <div className="mt-4 bg-red-50 border-l-4 border-red-500 p-4 rounded">
                  <p className="text-sm text-red-700">{error}</p>
                </div>
              )}

              {/* Botón de Pago */}
              <button
                onClick={handlePayment}
                disabled={processing}
                className={`w-full mt-6 py-4 rounded-lg font-bold text-lg transition-all ${
                  processing
                    ? 'bg-gray-400 cursor-not-allowed'
                    : 'bg-blue-600 hover:bg-blue-700 text-white shadow-lg hover:shadow-xl'
                }`}
              >
                {processing ? (
                  <span className="flex items-center justify-center">
                    <svg className="animate-spin h-6 w-6 mr-3" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    Procesando...
                  </span>
                ) : (
                  `Pagar $${monto.toFixed(2)} MXN`
                )}
              </button>

              <p className="text-xs text-gray-500 text-center mt-4">
                Al realizar el pago, aceptas nuestros términos y condiciones
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}