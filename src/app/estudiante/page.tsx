'use client'
import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import IconoIA from '@/components/atoms/IconoIA';
import IconoPrestamo from '@/components/atoms/IconoPrestamo';
import IconoAdeudo from '@/components/atoms/IconoAdeudo';
import IconoCompletado from '@/components/atoms/IconoCompletado';
import { Button } from "@/components/ui/button"
import getStudentData from '@/lib/firestore-operations'; // Importa la función que creaste
// import GrupoModal from '@/components/organisms/GrupoModal'; // Importa tu modal de grupo (debes crearlo)
// import { useChatbot } from '@/components/organisms/Chatbot'; // Importa el hook del chatbot si lo necesitas aquí

const EstudiantePage = () => {
  const { data: session, status } = useSession();
  const [studentGrupo, setStudentGrupo] = useState<string | null>(null);
  const [showGrupoModal, setShowGrupoModal] = useState(false);
  const [isLoadingData, setIsLoadingData] = useState(true);
  
  // const { setIsOpen: setIsChatbotOpen } = useChatbot(); // Para controlar el chatbot desde aquí

  // 1. Manejo de autenticación (useSession status === 'loading' lo maneja implícitamente)
  // NextAuth maneja la redirección si no estás autenticado si configuras el middleware.

  // 2. Fetch student data
  useEffect(() => {
    const fetchData = async () => {
      if (status === 'authenticated' && session?.user?.id) {
        try {
          // Asumiendo que session.user.id existe y se usa como userId
          const data = await getStudentData(session.user.id as string);
          if (data) {
            setStudentGrupo(data.grupo || null);
            // 3. Mostrar modal si el grupo está vacío
            if (!data.grupo) {
              setShowGrupoModal(true);
            }
          }
        } catch (error) {
          console.error("Error fetching student data:", error);
        } finally {
          setIsLoadingData(false);
        }
      }
      if (status === 'unauthenticated') {
          setIsLoadingData(false);
      }
    };

    fetchData();
  }, [status, session]);

  if (status === 'loading' || isLoadingData) {
    return <div className="flex items-center justify-center min-h-screen">Cargando dashboard...</div>;
  }

  // if (showGrupoModal) {
  //   // Retorna el modal si es necesario, o usa un portal para renderizarlo
  //   return <GrupoModal onClose={() => setShowGrupoModal(false)} />;
  // }
  
  // const handleOpenChatbot = () => {
  //   setIsChatbotOpen(true);
  // };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Welcome card */}
      <div className="bg-white rounded-2xl shadow-lg p-8 text-center">
        <h1 className="text-3xl font-bold text-[#0a1c65] mb-4">
          ¡Bienvenido, {session?.user?.name}!
        </h1>
        <p className="text-gray-600 mb-6">
          Usa el asistente IA para solicitar préstamos de material de cocina
        </p>
        <Button
          onClick={() => { /* handleOpenChatbot() */ }}
          className="bg-gradient-to-r from-[#e10022] to-[#0a1c65]"
        >
          <IconoIA />
          Abrir Asistente IA
        </Button>
      </div>

      {/* Stats cards (placeholder) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* ... (Las tarjetas de estadísticas siguen igual) ... */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-yellow-100 rounded-lg">
              <IconoPrestamo />
            </div>
            <div>
              <p className="text-sm text-gray-500">Préstamos activos</p>
              <p className="text-2xl font-bold">--</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-red-100 rounded-lg">
              <IconoAdeudo  />
            </div>
            <div>
              <p className="text-sm text-gray-500">Adeudos pendientes</p>
              <p className="text-2xl font-bold">--</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-green-100 rounded-lg">
              <IconoCompletado />
            </div>
            <div>
              <p className="text-sm text-gray-500">Completados este mes</p>
              <p className="text-2xl font-bold">--</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EstudiantePage;
