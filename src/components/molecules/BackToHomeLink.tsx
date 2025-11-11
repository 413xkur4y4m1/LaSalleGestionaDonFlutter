'use client';

import React from 'react';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';

const BackToHomeLink = () => {
  return (
    <Link href="/" className="flex items-center gap-2 text-[#e10022] hover:underline text-sm font-medium">
      <ArrowLeft className="h-4 w-4" />
      <span>Volver al inicio</span>
    </Link>
  );
};

export default BackToHomeLink;
