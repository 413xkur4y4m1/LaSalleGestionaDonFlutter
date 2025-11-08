import { redirect } from 'next/navigation';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import DashboardTemplate from '@/components/templates/DashboardTemplate';
import GrupoModal from '@/components/organisms/GrupoModal';
import getStudentData from '@/lib/firestore-operations';

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

  // Obtiene datos del estudiante
  const studentData = await getStudentData(session.user.id);
  const needsGrupo = !studentData?.grupo;

  return (
    <DashboardTemplate>
      {needsGrupo && (
        <GrupoModal
          isOpen={needsGrupo}
          onSubmit={async (grupo) => {
            // Aquí podrías actualizar el grupo en Firestore
            // await updateStudentGrupo(session.user.id, grupo);
            redirect('/estudiante');
          }}
        />
      )}
      {children}
    </DashboardTemplate>
  );
}
