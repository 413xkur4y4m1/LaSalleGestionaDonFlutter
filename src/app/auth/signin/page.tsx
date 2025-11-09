'use client';

import React, { useState } from 'react';
import { useSession, signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import LoginTemplate from '@/components/templates/LoginTemplate';
import LoginCard from '@/components/organisms/LoginCard';
import { useEffect } from 'react';

const SignInPage = () => {
  const router = useRouter();
  const { status } = useSession();
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (status === 'authenticated') {
      router.push('/estudiante');
    }
  }, [status, router]);

  const handleAzureLogin = async () => {
    setIsLoading(true);
    try {
      await signIn('azure-ad', {
        callbackUrl: '/estudiante',
      });
    } catch (error) {
      console.error('Login error:', error);
      setIsLoading(false);
    }
  };

  if (status === 'loading') {
    return <div>Cargando sesión...</div>;
  }

  return (
    <LoginTemplate>
      <LoginCard
        onLogin={handleAzureLogin}
        isLoading={isLoading}
      />
    </LoginTemplate>
  );
};

export default SignInPage;
