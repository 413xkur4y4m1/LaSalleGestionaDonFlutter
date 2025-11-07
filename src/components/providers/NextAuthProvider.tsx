"use client";

import { SessionProvider } from 'next-auth/react';
import React from 'react';

// This component is a client component that wraps its children with the SessionProvider
const NextAuthProvider = ({ children }: { children: React.ReactNode }) => {
  return (
    <SessionProvider>
      {children}
    </SessionProvider>
  );
};

export default NextAuthProvider;