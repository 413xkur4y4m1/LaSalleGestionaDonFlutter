'use client';

import { useRouter } from 'next/navigation';
import { ArrowLeft, Home } from 'lucide-react';

interface AdminBackButtonProps {
  /** Ruta a la que redirigir. Default: "/admin/dashboard" */
  href?: string;
  /** Texto del botón. Default: "Regresar" */
  label?: string;
  /** Mostrar también botón de inicio */
  showHome?: boolean;
  /** Ruta del inicio. Default: "/admin/dashboard" */
  homeHref?: string;
  /** Clase CSS adicional */
  className?: string;
}

const AdminBackButton: React.FC<AdminBackButtonProps> = ({
  href = '/admin/dashboard',
  label = 'Regresar',
  showHome = false,
  homeHref = '/admin/dashboard',
  className = '',
}) => {
  const router = useRouter();

  const handleBack = () => {
    router.push(href);
  };

  const handleHome = () => {
    router.push(homeHref);
  };

  return (
    <div className={`flex items-center gap-3 ${className}`}>
      {/* Botón de Regresar */}
      <button
        onClick={handleBack}
        className="inline-flex items-center gap-2 px-4 py-2 text-gray-700 hover:text-[#e10022] bg-white hover:bg-gray-50 border border-gray-300 rounded-lg transition-all duration-200 shadow-sm hover:shadow-md font-medium"
        aria-label="Regresar"
      >
        <ArrowLeft className="h-5 w-5" />
        <span>{label}</span>
      </button>

      {/* Botón de Inicio (opcional) */}
      {showHome && (
        <button
          onClick={handleHome}
          className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-[#e10022] to-[#0a1c65] text-white rounded-lg hover:opacity-90 transition-opacity shadow-sm hover:shadow-md font-medium"
          aria-label="Ir al inicio"
        >
          <Home className="h-5 w-5" />
          <span>Inicio</span>
        </button>
      )}
    </div>
  );
};

export default AdminBackButton;

// Versión compacta para móviles
export function AdminBackButtonMobile({
  href = '/admin/dashboard',
  showHome = false,
  homeHref = '/admin/dashboard',
  className = '',
}: Omit<AdminBackButtonProps, 'label'>) {
  const router = useRouter();

  const handleBack = () => {
    router.push(href);
  };

  const handleHome = () => {
    router.push(homeHref);
  };

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <button
        onClick={handleBack}
        className="p-2 bg-white border border-gray-300 text-gray-700 hover:text-[#e10022] rounded-lg hover:bg-gray-50 transition-all shadow-sm"
        aria-label="Regresar"
      >
        <ArrowLeft className="h-5 w-5" />
      </button>

      {showHome && (
        <button
          onClick={handleHome}
          className="p-2 bg-gradient-to-r from-[#e10022] to-[#0a1c65] text-white rounded-lg hover:opacity-90 transition-opacity shadow-sm"
          aria-label="Ir al inicio"
        >
          <Home className="h-5 w-5" />
        </button>
      )}
    </div>
  );
}