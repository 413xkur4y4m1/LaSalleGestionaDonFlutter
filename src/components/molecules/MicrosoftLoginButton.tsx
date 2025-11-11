import React from 'react';
import ButtonMicrosoft from '../atoms/ButtonMicrosoft';
import { useAuth } from '@/components/providers/NextAuthProvider';

const MicrosoftLoginButton: React.FC = () => {
  const { login, status } = useAuth();
  const isLoading = status === 'loading';

  return (
    <ButtonMicrosoft onClick={login} isLoading={isLoading}>
      Entrar como estudiante
    </ButtonMicrosoft>
  );
};

export default MicrosoftLoginButton;
