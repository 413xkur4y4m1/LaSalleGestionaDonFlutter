// Combines: ButtonMicrosoft + LoadingSpinner (conditional)
// Text: "Iniciar sesión con Microsoft"
// Icon left: Microsoft logo placeholder
// Props: onClick, isLoading
// Displays spinner when isLoading=true

import React from 'react';
import ButtonMicrosoft from '../atoms/ButtonMicrosoft';
// import { MicrosoftIcon } from './MicrosoftIcon'; // Replace with actual Microsoft Icon component

interface MicrosoftLoginButtonProps {
  onClick: () => void;
  isLoading?: boolean;
}

const MicrosoftLoginButton: React.FC<MicrosoftLoginButtonProps> = ({ onClick, isLoading }) => {
  return (
    <ButtonMicrosoft onClick={onClick} isLoading={isLoading}>
      {/* <MicrosoftIcon className="h-5 w-5" /> */} {/* Replace with actual Microsoft Icon component */}
      Iniciar sesión con Microsoft
    </ButtonMicrosoft>
  );
};

export default MicrosoftLoginButton;