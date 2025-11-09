import { redirect } from 'next/navigation';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/authOptions';
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

  // Obtiene datos del estudiante
  let studentData = null;
  try {
    studentData = await firestoreOperations.getStudentData(session.user.id);
  } catch (error) {
    console.error("Error fetching student data:", error);
    // Handle the error appropriately, maybe redirect to an error page
    return <div>Error: Failed to load student data</div>;
  }

  const needsGrupo = !studentData?.grupo;

  if (needsGrupo) {
    return (
      <GrupoModal
        isOpen={needsGrupo}
        onSubmit={async (grupo) => {
          try {
            await firestoreOperations.updateStudentGrupo(session.user.id, grupo);
            // After successful update, force a re-fetch of data or reload the page
            window.location.reload(); // Simple solution to refresh and re-evaluate
          } catch (updateError) {
            console.error("Error updating student group:", updateError);
            // Handle the error appropriately, maybe show a toast
          }
        }}
      />
    );
  }

  return (
    <DashboardTemplate>
      {children}
    </DashboardTemplate>
  );
}