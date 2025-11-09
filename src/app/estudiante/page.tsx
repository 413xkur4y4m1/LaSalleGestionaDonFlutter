 "use client";

import React from 'react';
import { useAuth } from '@/hooks/useAuth';
import { GrupoModal } from '@/components/organisms/GrupoModal';


const EstudiantePage = () => {
  const { user } = useAuth();

  if (!user) {
    return <p>Cargando...</p>;
  }

  return (
    <div>
      <h1>Bienvenido, {user.displayName}</h1>
      <p>Esta es la página del estudiante.</p>
    </div>
  );
};

export default EstudiantePage;