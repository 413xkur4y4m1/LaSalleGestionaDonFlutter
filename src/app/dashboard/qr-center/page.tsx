
'use client';

import React from 'react';
import { useSession } from 'next-auth/react';
import QRCenterView from '@/components/organisms/QRCenterView';
import { Loader2 } from 'lucide-react';

export default function QRCenterPage() {
  const { data: session, status } = useSession();

  if (status === 'loading') {
    return (
      <div className="flex items-center justify-center min-h-screen">
        
        <Loader2 className="h-8 w-8 animate-spin text-red-600" />
      </div>
    );
  }

  if (!session?.user?.email) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-gray-600">No autorizado</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* ⭐ Pasamos el email en lugar del ID */}
      <QRCenterView studentEmail={session.user.email} />
    </div>
  );
}