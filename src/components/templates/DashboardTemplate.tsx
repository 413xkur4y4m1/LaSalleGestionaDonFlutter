"use client";

// Main layout wrapper
// Props: children: ReactNode
//
// Manages:
//   - Sidebar open/close state
//   - Mobile menu toggle
//   - Layout shifts for sidebar
//
// Structure:
// <div className="min-h-screen bg-gray-50">
//   <TopNavbar onMenuToggle={() => setIsSidebarOpen(!isSidebarOpen)} />
//
//   <div className="flex relative">
//     <SidebarMenu
//       isOpen={isSidebarOpen}
//       onClose={() => setIsSidebarOpen(false)}
//     />
//
//     {/* Overlay for mobile */}
//     {isSidebarOpen && (
//       <div
//         className="md:hidden fixed inset-0 bg-black/50 z-40"
//         onClick={() => setIsSidebarOpen(false)}
//       />
//     )}
//
//     <main className="flex-1 p-4 sm:p-6 md:p-8 lg:p-10
//       ml-0 md:ml-[200px] lg:ml-[220px] xl:ml-[240px]
//       min-h-[calc(100vh-4rem)]">
//       {children}
//     </main>
//   </div>
//
//   <Chatbot />
// </div>

import React, { useState } from 'react';
import TopNavbar from '../organisms/TopNavbar';
import SidebarMenu from '../organisms/SidebarMenu';
import Chatbot from '../organisms/Chatbot'; // Importación por defecto funcionando correctamente

interface DashboardTemplateProps {
  children: React.ReactNode;
}

const DashboardTemplate: React.FC<DashboardTemplateProps> = ({ children }) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

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