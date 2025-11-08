'use client';

import React, { useState, useEffect } from 'react';
import { useSession, signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import LoginTemplate from '@/components/templates/LoginTemplate';
import LoginCard from '@/components/organisms/LoginCard';

const SignInPage = () => {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [isLoading, setIsLoading] = useState(false);

  // Redirigir si ya está autenticado y cumple la condición del email
  useEffect(() => {
    if (status === 'authenticated') {
      if (session?.user?.email?.endsWith('@ulsaneza.edu.mx')) {
        // Redirigir a /estudiante si es un usuario válido
        router.push('/estudiante');
      } else {
        // Opcional: Manejar usuarios no autorizados, por ejemplo, cerrando sesión
        // signOut({ callbackUrl: '/' });
        console.warn('Usuario autenticado pero no autorizado por dominio.');
      }
    }
    // Nota: El 'loading' (status === 'loading') es manejado implícitamente por el hook useSession
  }, [status, session, router]);

  const handleAzureLogin = async () => {
    setIsLoading(true);
    try {
      // Iniciar sesión y manejar la redirección a través de NextAuth
      await signIn('azure-ad', {
        callbackUrl: '/estudiante',
        redirect: true,
      });
    } catch (error) {
      console.error('Login error:', error);
      setIsLoading(false);
    }
  };

  // Si el estado de la sesión es 'loading', puedes mostrar un spinner o un mensaje
  if (status === 'loading') {
    return <div>Cargando sesión...</div>;
  }

  // Si no está autenticado, muestra el formulario de login
  if (status === 'unauthenticated') {
    return (
      <LoginTemplate>
        <LoginCard
          onLogin={handleAzureLogin}
          isLoading={isLoading}
        />
      </LoginTemplate>
    );
  }

  // Si está autenticado pero no ha sido redirigido aún (ej. validando dominio), no renderiza nada más
  return null;
};

export default SignInPage;
