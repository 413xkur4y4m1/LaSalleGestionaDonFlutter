'use client';

import { useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';

interface AdminBackButtonProps {
  href?: string; // URL personalizada a donde regresar
  className?: string; // Clases adicionales
}

const AdminBackButton: React.FC<AdminBackButtonProps> = ({ href, className = '' }) => {
  const router = useRouter();

  const handleBack = () => {
    if (href) {
      // Si se proporciona una URL específica, navegar ahí
      router.push(href);
    } else {
      // Si no, usar el historial del navegador
      router.back();
    }
  };

  return (
    <button
      onClick={handleBack}
      className={`
        inline-flex items-center gap-2 px-4 py-2 
        text-gray-700 hover:text-[#e10022] 
        bg-white hover:bg-gray-50 
        border border-gray-300 rounded-lg 
        transition-all duration-200 
        shadow-sm hover:shadow-md
        font-medium
        ${className}
      `}
      aria-label="Regresar"
    >
      <ArrowLeft className="h-5 w-5" />
      <span>Regresar</span>
    </button>
  );
};

export default AdminBackButton;