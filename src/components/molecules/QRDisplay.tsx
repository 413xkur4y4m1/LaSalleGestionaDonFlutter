// Shows generated QR code
// Props: codigo: string (e.g., "PRST-103M-00123")
//
// Uses: qrcode.react library
// <div className="flex flex-col items-center gap-4 p-6 bg-white rounded-lg">
//   <QRCodeCanvas
//     value={codigo}
//     size={256}
//     level="H"
//   />
//   <p className="font-mono text-2xl font-bold">{codigo}</p>
//   <p className="text-sm text-gray-500">Muestra este código al administrador</p>
// </div>

import React from 'react';
import { QRCodeCanvas } from 'qrcode.react';

interface QRDisplayProps {
  codigo: string;
}

const QRDisplay: React.FC<QRDisplayProps> = ({ codigo }) => {
  return (
    <div className="flex flex-col items-center gap-4 p-6 bg-white rounded-lg">
      <QRCodeCanvas
        value={codigo}
        size={256}
        level="H"
      />
      <p className="font-mono text-2xl font-bold">{codigo}</p>
      <p className="text-sm text-gray-500">Muestra este código al administrador</p>
    </div>
  );
};

export default QRDisplay;