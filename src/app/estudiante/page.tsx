 "use client";

import React from 'react';
import { useAuth } from '@/hooks/useAuth';
import DashboardTemplate from '@/components/templates/DashboardTemplate';

const EstudiantePage = () => {
  const { user } = useAuth();

  return (
    <DashboardTemplate>
      {user ? (
        <div>
          <h1>Bienvenido, {user.displayName}</h1>
          <p>Esta es la página del estudiante.</p>
        </div>
      ) : (
        <p>Cargando...</p>
      )}
    </DashboardTemplate>
  );
};

export default EstudiantePage;