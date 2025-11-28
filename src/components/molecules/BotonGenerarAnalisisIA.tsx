'use client';

import { useState } from 'react';
import { Brain, Loader2, AlertCircle, CheckCircle, Sparkles } from 'lucide-react';

interface AnalisisIAResponse {
  success: boolean;
  message: string;
  analisis?: any;
  error?: string;
}

interface BotonGenerarAnalisisIAProps {
  onAnalisisGenerado?: () => void;
}

export default function BotonGenerarAnalisisIA({ onAnalisisGenerado }: BotonGenerarAnalisisIAProps) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');

  const handleGenerar = async () => {
    if (isGenerating) return;

    setIsGenerating(true);
    setStatus('idle');
    setMessage('');

    try {
      console.log('🚀 Iniciando generación de análisis IA...');
      
      const response = await fetch('/api/admin/generar-analisis-ia', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const data: AnalisisIAResponse = await response.json();

      if (data.success) {
        setStatus('success');
        setMessage('✅ Análisis generado exitosamente');
        console.log('✅ Análisis generado:', data.analisis);
        
        // Callback opcional para recargar datos
        if (onAnalisisGenerado) {
          setTimeout(() => {
            onAnalisisGenerado();
          }, 1500);
        }
      } else {
        setStatus('error');
        setMessage(data.message || data.error || 'Error al generar análisis');
        console.error('❌ Error:', data);
      }
    } catch (error: any) {
      console.error('❌ Error de conexión:', error);
      setStatus('error');
      setMessage('Error de conexión. Verifica tu internet e intenta de nuevo.');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="space-y-3">
      <button
        onClick={handleGenerar}
        disabled={isGenerating}
        className={`
          flex items-center gap-3 px-6 py-3 rounded-xl font-semibold
          transition-all duration-300 shadow-lg transform hover:scale-105
          ${isGenerating 
            ? 'bg-gray-400 cursor-not-allowed scale-100' 
            : 'bg-gradient-to-r from-purple-600 via-pink-600 to-blue-600 hover:from-purple-700 hover:via-pink-700 hover:to-blue-700'
          }
          text-white relative overflow-hidden
        `}
      >
        {/* Efecto de brillo animado */}
        {!isGenerating && (
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white to-transparent opacity-20 animate-pulse" />
        )}
        
        {isGenerating ? (
          <>
            <Loader2 className="h-5 w-5 animate-spin" />
            <span>Generando análisis con IA...</span>
          </>
        ) : (
          <>
            <Brain className="h-5 w-5" />
            <span>Generar Análisis con IA</span>
            <Sparkles className="h-4 w-4" />
          </>
        )}
      </button>

      {/* Mensajes de estado */}
      {message && (
        <div className={`
          flex items-start gap-3 p-4 rounded-lg animate-fadeIn
          ${status === 'success' 
            ? 'bg-green-50 text-green-800 border border-green-200' 
            : 'bg-red-50 text-red-800 border border-red-200'
          }
        `}>
          {status === 'success' ? (
            <CheckCircle className="h-5 w-5 flex-shrink-0 mt-0.5" />
          ) : (
            <AlertCircle className="h-5 w-5 flex-shrink-0 mt-0.5" />
          )}
          <div className="flex-1">
            <p className="text-sm font-medium">{message}</p>
            {status === 'success' && (
              <p className="text-xs mt-1 opacity-75">Los datos se actualizarán automáticamente</p>
            )}
          </div>
        </div>
      )}

      {/* Información de uso */}
      <div className="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-lg p-4">
        <div className="flex items-start gap-2">
          <span className="text-xl">💡</span>
          <div className="flex-1">
            <p className="text-sm font-semibold text-amber-900 mb-1">
              Sobre el Análisis con IA
            </p>
            <ul className="text-xs text-amber-800 space-y-1">
              <li>• Genera insights inteligentes sobre tus estadísticas</li>
              <li>• Consume créditos de la API de Google Gemini</li>
              <li>• Úsalo cuando necesites análisis actualizados</li>
              <li>• El proceso puede tardar hasta 30 segundos</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}