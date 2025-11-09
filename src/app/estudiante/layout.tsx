import { redirect } from 'next/navigation';
import DashboardTemplate from '@/components/templates/DashboardTemplate';
import { getAuth, onAuthStateChanged } from "firebase/auth";
import { useEffect, useState } from 'react';


interface EstudianteLayoutProps {
  children: React.ReactNode;
}

export default function EstudianteLayout({ children }: EstudianteLayoutProps) {
  return (
    <DashboardTemplate>
      {children}
    </DashboardTemplate>
  );
}