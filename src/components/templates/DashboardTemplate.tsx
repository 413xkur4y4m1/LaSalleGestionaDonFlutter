"use client";

import React, { useState, useEffect } from 'react';
import TopNavbar from '../organisms/TopNavbar';
import SidebarMenu from '../organisms/SidebarMenu';
import Chatbot from '../organisms/Chatbot'; // Importación por defecto funcionando correctamente
import GrupoModal from '../organisms/GrupoModal';
import * as firestoreOperations from '@/lib/firestore-operations';
import { Session } from 'next-auth';

interface DashboardTemplateProps {
  children: React.ReactNode;
  session: Session
}

const DashboardTemplate: React.FC<DashboardTemplateProps> = ({ children, session }) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [needsGrupo, setNeedsGrupo] = useState(false)
  useEffect(() => {
    async function fetchStudentData() {
      if (session?.user?.id) {
        try {
          const studentData = await firestoreOperations.getStudentData(session.user.id);
          setNeedsGrupo(!studentData?.grupo);
        } catch (error) {
          console.error("Error fetching student data:", error);
        }
      }
    }

    fetchStudentData();
  }, [session?.user?.id]);
  
  if (needsGrupo) return (<GrupoModal
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
  />)

  return (
    <div className="min-h-screen bg-gray-50">
      <TopNavbar onMenuToggle={() => setIsSidebarOpen(!isSidebarOpen)} />

      <div className="flex relative">
        <SidebarMenu isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />

        {/* Overlay for mobile */}
        {isSidebarOpen && (
          <div className="md:hidden fixed inset-0 bg-black/50 z-40" onClick={() => setIsSidebarOpen(false)} />
        )}

        <main className="flex-1 p-4 sm:p-6 md:p-8 lg:p-10 ml-0 md:ml-[200px] lg:ml-[220px] xl:ml-[240px] min-h-[calc(100vh-4rem)]">
          {children}
        </main>
      </div>

      <Chatbot />
    </div>
  );
};

export default DashboardTemplate;