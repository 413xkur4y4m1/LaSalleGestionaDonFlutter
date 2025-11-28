// components/BackButton.tsx
'use client';

import { useRouter } from 'next/navigation';
import { ArrowLeft, Home } from 'lucide-react';

interface BackButtonProps {
  /** Ruta a la que redirigir. Si no se especifica, usa router.back() */
  href?: string;
  /** Texto del botón. Default: "Regresar" */
  label?: string;
  /** Mostrar también botón de inicio */
  showHome?: boolean;
  /** Ruta del inicio. Default: "/estudiante/dashboard" */
  homeHref?: string;
  /** Clase CSS adicional */
  className?: string;
}

export default function BackButton({
  href,
  label = 'Regresar',
  showHome = false,
  homeHref = '/estudiante/dashboard',
  className = '',
}: BackButtonProps) {
  const router = useRouter();

  const handleBack = () => {
    if (href) {
      router.push(href);
    } else {
      router.back();
    }
  };

  return (
    <div className={`flex items-center gap-3 ${className}`}>
      {/* Botón de Regresar */}
      <button
        onClick={handleBack}
        className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 hover:border-gray-400 transition-all duration-200 shadow-sm"
      >
        <ArrowLeft className="h-4 w-4" />
        <span className="font-medium">{label}</span>
      </button>

      {/* Botón de Inicio (opcional) - ahora usa la misma función handleBack */}
      {showHome && (
        <button
          onClick={handleBack}
          className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-[#e10022] to-[#0a1c65] text-white rounded-lg hover:opacity-90 transition-opacity shadow-sm"
        >
          <Home className="h-4 w-4" />
          <span className="font-medium">Inicio</span>
        </button>
      )}
    </div>
  );
}

// Versión compacta para móviles
export function BackButtonMobile({
  href,
  showHome = false,
  homeHref = '/estudiante',
  className = '',
}: Omit<BackButtonProps, 'label'>) {
  const router = useRouter();

  const handleBack = () => {
    if (href) {
      router.push(href);
    } else {
      router.back();
    }
  };

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <button
        onClick={handleBack}
        className="p-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-all"
        aria-label="Regresar"
      >
        <ArrowLeft className="h-5 w-5" />
      </button>

      {showHome && (
        <button
          onClick={handleBack}
          className="p-2 bg-gradient-to-r from-[#e10022] to-[#0a1c65] text-white rounded-lg hover:opacity-90 transition-opacity"
          aria-label="Ir al inicio"
        >
          <Home className="h-5 w-5" />
        </button>
      )}
    </div>
  );
}