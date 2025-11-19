"use client";

import { useBackgroundWorker } from '../../hooks/useBackgroundWorker';
import AdminMenu from "@/components/organisms/AdminMenu";
import AdminTopNavbar from "@/components/organisms/AdminTopNavbar";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  // 🔥 HOOK DEL WORKER AGREGADO
  useBackgroundWorker({ enabled: true, intervalMinutes: 5 });

    return (
        <div className="h-screen w-full flex bg-gray-50">
            <AdminMenu />
            <div className="flex-1 flex flex-col">
                <AdminTopNavbar />
                <main className="flex-1 p-4 md:p-8 overflow-y-auto">
                    {children}
                </main>
            </div>
        </div>
    );
}
