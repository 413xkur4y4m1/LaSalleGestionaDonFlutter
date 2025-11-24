// /app/pago-exitoso/page.tsx

'use client';

import { useSearchParams, useRouter } from 'next/navigation';
import { useEffect, Suspense } from 'react';

function PagoExitosoContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  
  const paymentId = searchParams?.get('payment') || 'N/A';
  const adeudoId = searchParams?.get('adeudo') || 'N/A';
  const monto = searchParams?.get('monto') || '0';
  const transaccionId = searchParams?.get('transaccionId') || '';

  useEffect(() => {
    // Auto-redirigir después de 10 segundos
    const timer = setTimeout(() => {
      router.push('/dashboard');
    }, 10000);

    return () => clearTimeout(timer);
  }, [router]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl p-8 max-w-2xl w-full">
        <div className="text-center">
          {/* Icono de éxito animado */}
          <div className="mb-6">
            <div className="inline-flex items-center justify-center w-24 h-24 bg-green-100 rounded-full">
              <svg className="w-16 h-16 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
          </div>

          <h1 className="text-3xl font-bold text-gray-800 mb-4">
            ¡Pago Exitoso!
          </h1>
          
          <p className="text-lg text-gray-600 mb-6">
            Tu pago ha sido procesado correctamente
          </p>

          <div className="bg-green-50 border-l-4 border-green-500 p-6 rounded-lg mb-8 text-left">
            <div className="flex items-start">
              <div className="text-3xl mr-4">✅</div>
              <div className="w-full">
                <p className="font-semibold text-gray-800 mb-2">Confirmación de Pago</p>
                <div className="space-y-2 text-sm text-gray-700">
                  {transaccionId && (
                    <p className="break-all">
                      <strong>ID de Transacción:</strong> {transaccionId}
                    </p>
                  )}
                  {paymentId !== 'N/A' && (
                    <p className="break-all">
                      <strong>ID de Pago:</strong> {paymentId}
                    </p>
                  )}
                  {adeudoId !== 'N/A' && (
                    <p className="break-all">
                      <strong>ID de Adeudo:</strong> {adeudoId}
                    </p>
                  )}
                  {monto !== '0' && (
                    <p>
                      <strong>Monto Pagado:</strong> ${parseFloat(monto).toFixed(2)} MXN
                    </p>
                  )}
                  <p className="text-green-700 font-semibold mt-4">
                    ✓ Tu adeudo ha sido marcado como pagado
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded-lg mb-6 text-left">
            <p className="text-sm text-gray-700">
              <strong>📧 Correo enviado:</strong> Hemos enviado un comprobante de pago a tu correo electrónico institucional.
            </p>
          </div>

          <div className="space-y-3">
            <button
              onClick={() => router.push('/dashboard')}
              className="w-full px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 font-semibold transition-colors"
            >
              Ir al Dashboard
            </button>
            
            <p className="text-sm text-gray-500">
              Serás redirigido automáticamente en 10 segundos...
            </p>
          </div>

          <div className="mt-8 pt-6 border-t border-gray-200">
            <p className="text-xs text-gray-500">
              Si tienes alguna duda, contacta al encargado del laboratorio
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function PagoExitosoPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-50 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 mb-4">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
          </div>
          <p className="text-gray-600">Cargando confirmación de pago...</p>
        </div>
      </div>
    }>
      <PagoExitosoContent />
    </Suspense>
  );
}