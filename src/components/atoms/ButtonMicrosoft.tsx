import React from 'react';
import { getAuth, signInWithRedirect, OAuthProvider } from "firebase/auth";

interface ButtonMicrosoftProps {
  isLoading?: boolean;
  children?: React.ReactNode;
}

const MicrosoftIcon = () => (
  <svg
    width="20"
    height="20"
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className="h-5 w-5"
  >
    <rect x="0" y="0" width="11" height="11" fill="#F35325"/>
    <rect x="13" y="0" width="11" height="11" fill="#81BC06"/>
    <rect x="0" y="13" width="11" height="11" fill="#05A6F0"/>
    <rect x="13" y="13" width="11" height="11" fill="#FFBA08"/>
  </svg>
);

const ButtonMicrosoft: React.FC<ButtonMicrosoftProps> = ({ isLoading, children }) => {
  const handleSignIn = () => {
    const auth = getAuth();
    const provider = new OAuthProvider('microsoft.com');
    signInWithRedirect(auth, provider)
  };

  return (
    <button
      onClick={handleSignIn}
      className={`bg-[#0a1c65] text-white font-semibold hover:bg-[#0a1c65]/90 hover:scale-105 hover:shadow-xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 rounded-md
        py-3 px-6 text-sm md:py-4 md:px-10 md:text-base xl:py-5 xl:px-14 xl:text-lg`}
      disabled={isLoading}
    >
      {isLoading ? (
        <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-blue-500"></div>
      ) : (
        <>
          <MicrosoftIcon />
          {children}
        </>
      )}
    </button>
  );
};

export default ButtonMicrosoft;
