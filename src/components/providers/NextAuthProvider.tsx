"use client";

import { SessionProvider, signIn, signOut, useSession } from 'next-auth/react';
import React, { createContext, useContext } from 'react';

interface AuthContextProps {
  user: any | null;
  status: "loading" | "authenticated" | "unauthenticated";
  login: () => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextProps>({
  user: null,
  status: "loading",
  login: () => {},
  logout: () => {},
});

export const useAuth = () => useContext(AuthContext);

const AuthProviderContent = ({ children }: { children: React.ReactNode }) => {
  const { data: session, status } = useSession();

  const login = () => {
    signIn("azure-ad", {
      callbackUrl: "/estudiante",
    });
  };

  const logout = () => {
    signOut({
      callbackUrl: "/",
    });
  };

  return (
    <AuthContext.Provider
      value={{
        user: session?.user || null,
        status,
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

const NextAuthProvider = ({ children }: { children: React.ReactNode }) => {
  return (
    <SessionProvider>
      <AuthProviderContent>
        {children}
      </AuthProviderContent>
    </SessionProvider>
  );
};

export default NextAuthProvider;
