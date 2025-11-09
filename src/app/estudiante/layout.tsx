import { redirect } from 'next/navigation';
import { getServerSession } from 'next-auth';
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import DashboardTemplate from '@/components/templates/DashboardTemplate';
import GrupoModal from '@/components/organisms/GrupoModal';
import * as firestoreOperations from '@/lib/firestore-operations';

// Extiende los tipos de sesión para incluir `id` en user
declare module 'next-auth' {
  interface Session {
    user: {
      id: string;
      name?: string | null;
      email?: string | null;
      image?: string | null;
    };
  }
}

interface EstudianteLayoutProps {
  children: React.ReactNode;
}

export default async function EstudianteLayout({ children }: EstudianteLayoutProps) {
  const session = await getServerSession(authOptions);

  // Si no hay sesión o user.id, redirige al login
  if (!session?.user?.id) {
    redirect('/api/auth/signin');
  }

  return (
    <DashboardTemplate session={session}>
      {children}
    </DashboardTemplate>
  );
}