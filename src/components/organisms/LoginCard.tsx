import React from 'react';
import LoginHeader from '../molecules/LoginHeader';
import MicrosoftLoginButton from '../molecules/MicrosoftLoginButton';
import SecurityNote from '../molecules/SecurityNote';
import BackToHomeLink from '../molecules/BackToHomeLink';

// LoginCard no longer needs to manage login state, 
// as MicrosoftLoginButton handles it internally via useAuth.
const LoginCard: React.FC = () => {
  return (
    <div className="bg-white rounded-2xl shadow-2xl border border-gray-100 w-[95%] sm:w-[90%] md:w-[500px] lg:w-[550px] xl:w-[600px] p-8 sm:p-10 md:p-12 flex flex-col gap-6 sm:gap-8">
      <LoginHeader />
      <div className="border-t border-gray-200 pt-6" />
      {/* MicrosoftLoginButton now handles its own state and logic */}
      <MicrosoftLoginButton />
      <SecurityNote />
      <div className="border-t border-gray-200 pt-4">
        <BackToHomeLink />
      </div>
    </div>
  );
};

export default LoginCard;
