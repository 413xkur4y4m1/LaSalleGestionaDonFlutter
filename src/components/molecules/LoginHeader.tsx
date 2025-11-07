// Combines: LogoSALLE centered
// Layout: flex flex-col items-center gap-4
// Title below logo: "Sistema de Gestión de Laboratorios"
//   - text-[#0a1c65]
//   - Responsive: text-2xl (xs) → text-5xl (xl)
//   - font-bold text-center
// Subtitle: "Acceso para Estudiantes"
//   - text-gray-600
//   - text-base (xs) → text-xl (xl)
//   - font-medium

import React from 'react';
import LogoSALLE from '../atoms/LogoSALLE';

const LoginHeader = () => {
  return (
    <div className="flex flex-col items-center gap-4">
      <LogoSALLE />
      <h1 className="text-[#0a1c65] text-2xl md:text-4xl xl:text-5xl font-bold text-center">
        Sistema de Gestión de Laboratorios
      </h1>
      <h2 className="text-gray-600 text-base md:text-xl font-medium">
        Acceso para Estudiantes
      </h2>
    </div>
  );
};

export default LoginHeader;