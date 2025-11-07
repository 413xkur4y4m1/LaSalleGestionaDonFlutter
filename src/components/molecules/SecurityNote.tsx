// Combines: Shield icon + text
// Icon: Lucide ShieldCheck, text-[#22C55E], size-6
// Text: "Autenticación segura con credenciales institucionales @Ulsaneza"
//   - text-gray-500 text-sm text-center
// Layout: flex items-center gap-2 justify-center
//   - xs: flex-col
//   - md+: flex-row

import React from 'react';
import { ShieldCheck } from 'lucide-react';

const SecurityNote = () => {
  return (
    <div className="flex items-center gap-2 justify-center text-center xs:flex-col md:flex-row">
      <ShieldCheck className="text-[#22C55E] size-6" />
      <p className="text-gray-500 text-sm">
        Autenticación segura con credenciales institucionales @Ulsaneza
      </p>
    </div>
  );
};

export default SecurityNote;