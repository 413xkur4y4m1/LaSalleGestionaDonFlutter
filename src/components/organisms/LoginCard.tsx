// Combines:
//   - LoginHeader molecule
//   - MicrosoftLoginButton molecule
//   - SecurityNote molecule
//   - BackToHomeLink molecule
//
// Card structure:
// <div className="bg-white rounded-2xl shadow-2xl border border-gray-100
//   w-[95%] sm:w-[90%] md:w-[500px] lg:w-[550px] xl:w-[600px]
//   p-8 sm:p-10 md:p-12
//   flex flex-col gap-6 sm:gap-8">
//
//   <LoginHeader />
//
//   <div className="border-t border-gray-200 pt-6" />
//
//   <MicrosoftLoginButton
//     onClick={handleAzureLogin}
//     isLoading={isLoading}
//   />
//
//   <SecurityNote />
//
//   <div className="border-t border-gray-200 pt-4">
//     <BackToHomeLink />
//   </div>
// </div>

import React from 'react';
import LoginHeader from '../molecules/LoginHeader';
import MicrosoftLoginButton from '../molecules/MicrosoftLoginButton';
import SecurityNote from '../molecules/SecurityNote';
import BackToHomeLink from '../molecules/BackToHomeLink';

interface LoginCardProps {
  onLogin: () => Promise<void>;
  isLoading?: boolean;
}

const LoginCard: React.FC<LoginCardProps> = ({ onLogin, isLoading }) => {
  return (
    <div className="bg-white rounded-2xl shadow-2xl border border-gray-100 w-[95%] sm:w-[90%] md:w-[500px] lg:w-[550px] xl:w-[600px] p-8 sm:p-10 md:p-12 flex flex-col gap-6 sm:gap-8">
      <LoginHeader />
      <div className="border-t border-gray-200 pt-6" />
      <MicrosoftLoginButton onClick={onLogin} isLoading={isLoading} />
      <SecurityNote />
      <div className="border-t border-gray-200 pt-4">
        <BackToHomeLink />
      </div>
    </div>
  );
};

export default LoginCard;