'use client';

import React from 'react';
import { useAuth } from '@/components/providers/NextAuthProvider';

const EstudiantePage = () => {
  const { user } = useAuth();

  return (
    <> 
      {user ? (
        <div>
          <h1>Bienvenido, {user.name}</h1>
          <p>Esta es la página del estudiante.</p>
        </div>
      ) : (
        <p>Cargando...</p>
      )}
    </>
  );
};

export default EstudiantePage;
