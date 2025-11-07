// Combines: ArrowLeft icon + Link text
// Icon: Lucide ArrowLeft, text-[#e10022]
// Text: "Volver al inicio"
//   - text-[#e10022] hover:underline
//   - text-sm font-medium
// Layout: flex items-center gap-2
// Action: router.push('/')

import React from 'react';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

const BackToHomeLink = () => {
    const router = useRouter();

  return (
    <div className="flex items-center gap-2">
      <ArrowLeft className="text-[#e10022]" />
      <Link href="/" className="text-[#e10022] hover:underline text-sm font-medium"  onClick={() => router.push('/')}>
        Volver al inicio
      </Link>
    </div>
  );
};

export default BackToHomeLink;