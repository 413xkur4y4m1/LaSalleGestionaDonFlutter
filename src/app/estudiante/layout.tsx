import { redirect } from 'next/navigation';
import DashboardTemplate from '@/components/templates/DashboardTemplate';
import { getAuth, onAuthStateChanged } from "firebase/auth";
import { useEffect, useState } from 'react';

export interface StudentData {
  uid: string;
  nombre: string;
  correo: string;
  rol: string;
  grupo?: string;
  carrera: string;
  fotoPerfil: string;
  createdAt: any;
  lastLogin: any;
}

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