'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Scanner } from '@yudiel/react-qr-scanner';
import { useToast } from '@/hooks/use-toast';
import { getPrestamoDetailsAction, activatePrestamoAction } from './actions';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { LoaderCircle, CheckCircle, XCircle, User, Box, Calendar, Hash, ShieldCheck, ScanLine, RotateCw } from 'lucide-react';

// --- Tipos ---
type PrestamoDetails = {
  id: string;
  loanCode: string;
  studentName: string;
  materialNombre: string;
  cantidad: number;
  estado: string;
  fechaSolicitud: string;
};

type ScanResult = { success: true; data: PrestamoDetails } | { success: false; message: string };

// --- Componente Principal ---
const AdminScanPage = () => {
  const [scanResult, setScanResult] = useState<ScanResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isActivating, setIsActivating] = useState(false);
  const [isClient, setIsClient] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    setIsClient(true);
  }, []);

  const handleScanResult = async (detectedCodes: any[]) => {
    if (detectedCodes && detectedCodes.length > 0 && !isLoading) {
      const codigo = detectedCodes[0].rawValue;
      if (codigo) {
        setIsLoading(true);
        setScanResult(null); // Limpia el resultado anterior
        try {
          const details = await getPrestamoDetailsAction(codigo);
          // ✅ CORRECCIÓN: Type guard para asegurar el tipo correcto
          if (details.success && details.data) {
            setScanResult({ success: true, data: details.data });
            toast({ title: 'Código escaneado', description: `Se encontraron detalles para el código ${codigo}.` });
          } else {
            setScanResult({ success: false, message: details.message || 'Error desconocido' });
            toast({ variant: 'destructive', title: 'Error de escaneo', description: details.message || 'Error desconocido' });
          }
        } catch (e: any) {
          const errorMessage = e.message || 'Ocurrió un error desconocido.';
          setScanResult({ success: false, message: errorMessage });
          toast({ variant: 'destructive', title: 'Error del Servidor', description: errorMessage });
        } finally {
          setIsLoading(false);
        }
      }
    }
  };

  const handleActivate = async () => {
    if (scanResult && scanResult.success && scanResult.data.estado === 'pendiente') {
      setIsActivating(true);
      try {
        // ✅ CORRECCIÓN: Llamar a la acción con el código correcto
        const activationResult = await activatePrestamoAction(scanResult.data.loanCode);
        if (activationResult.success) {
          toast({ title: 'Éxito', description: activationResult.message, className: 'bg-green-100 border-green-400' });
          // Actualizar el estado local para reflejar el cambio
          setScanResult(prev => {
            if (prev && prev.success) {
              return { success: true, data: { ...prev.data, estado: 'activo' } };
            }
            return prev;
          });
        } else {
          toast({ variant: 'destructive', title: 'Error de Activación', description: activationResult.message });
        }
      } catch (e: any) {
        const errorMessage = e.message || 'Error al activar el préstamo.';
        toast({ variant: 'destructive', title: 'Error del Servidor', description: errorMessage });
      } finally {
        setIsActivating(false);
      }
    }
  };

  const handleReset = () => {
    setScanResult(null);
    setIsLoading(false);
    setIsActivating(false);
  };

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Escanear Código QR de Préstamo</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center"><ScanLine className="mr-2" /> Escáner</CardTitle>
          </CardHeader>
          <CardContent>
            {isClient ? (
              <div className="w-full aspect-square bg-gray-100 rounded-lg overflow-hidden">
                 <Scanner
                    onScan={handleScanResult}
                    onError={(error: unknown) => console.log(error)}
                    constraints={{ facingMode: 'environment' }}
                    styles={{ container: { width: '100%', height: '100%' } }}
                  />
              </div>
            ) : (
              <div className="w-full aspect-square bg-gray-100 rounded-lg flex items-center justify-center">
                <LoaderCircle className="animate-spin text-gray-400" />
              </div>
            )}
            <p className="text-sm text-center text-gray-500 mt-2">Apunta la cámara al código QR del estudiante.</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Detalles de la Solicitud</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex flex-col items-center justify-center h-64">
                <LoaderCircle className="animate-spin text-primary h-12 w-12" />
                <p className="mt-4 text-lg font-medium">Buscando...</p>
              </div>
            ) : scanResult && scanResult.success ? (
              <LoanDetailsCard details={scanResult.data} onActivate={handleActivate} isActivating={isActivating} onReset={handleReset} />
            ) : scanResult && !scanResult.success ? (
              <ErrorCard message={scanResult.message} onReset={handleReset} />
            ) : (
               <div className="flex flex-col items-center justify-center h-64">
                <p className="text-lg text-gray-500">Esperando escaneo...</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

// --- Sub-componentes ---

const LoanDetailsCard = ({ details, onActivate, isActivating, onReset }: { details: PrestamoDetails, onActivate: () => void, isActivating: boolean, onReset: () => void }) => (
  <div>
    <div className={`p-4 rounded-md mb-4 ${details.estado === 'pendiente' ? 'bg-yellow-100' : 'bg-green-100'}`}>
      <h3 className={`font-bold text-lg flex items-center ${details.estado === 'pendiente' ? 'text-yellow-800' : 'text-green-800'}`}>
        {details.estado === 'pendiente' ? <ShieldCheck className="mr-2" /> : <CheckCircle className="mr-2" />}
        Estado: <span className="ml-1 font-mono uppercase">{details.estado}</span>
      </h3>
    </div>
    <div className="space-y-3 text-sm">
        <InfoRow icon={<Hash />} label="Código" value={details.loanCode} />
        {/* ✅ CORRECCIÓN: Mostrar el studentName del estado */}
        <InfoRow icon={<User />} label="Estudiante" value={details.studentName} />
        <InfoRow icon={<Box />} label="Material" value={details.materialNombre} />
        <InfoRow icon={<Hash />} label="Cantidad" value={String(details.cantidad)} />
        <InfoRow icon={<Calendar />} label="Solicitado" value={new Date(details.fechaSolicitud).toLocaleString()} />
    </div>
    <CardFooter className="px-0 pt-6 flex flex-col sm:flex-row-reverse gap-2">
       {details.estado === 'pendiente' && (
          // ✅ CORRECCIÓN: Botón conectado a la función onActivate
          <Button onClick={onActivate} disabled={isActivating} className="w-full sm:w-auto">
            {isActivating ? <LoaderCircle className="animate-spin mr-2" /> : <CheckCircle className="mr-2"/>}
            Confirmar y Activar Préstamo
          </Button>
        )}
        <Button onClick={onReset} variant="outline" className="w-full sm:w-auto">
            <RotateCw className="mr-2" />
            Escanear Otro
        </Button>
    </CardFooter>
  </div>
);

const ErrorCard = ({ message, onReset }: { message: string, onReset: () => void }) => (
  <Alert variant="destructive">
    <XCircle className="h-4 w-4" />
    <AlertTitle>Error</AlertTitle>
    <AlertDescription>{message}</AlertDescription>
    <Button onClick={onReset} variant="secondary" className="mt-4">Volver a intentar</Button>
  </Alert>
);

const InfoRow = ({ icon, label, value }: { icon: React.ReactNode, label: string, value: string }) => (
    <div className="flex items-center">
        <div className="text-gray-500 mr-2">{icon}</div>
        <strong className="mr-2 text-gray-800">{label}:</strong>
        <span className="font-mono text-gray-600">{value}</span>
    </div>
);

export default AdminScanPage;