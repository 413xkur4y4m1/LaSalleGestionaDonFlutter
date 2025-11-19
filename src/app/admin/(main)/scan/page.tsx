
'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { Scanner } from '@yudiel/react-qr-scanner';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { LoaderCircle, CheckCircle, XCircle, ScanLine } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
// Paso 1: Importar la nueva Server Action
import { activatePrestamoAction } from './actions';

// --- Tipos de Datos (sin cambios) ---
interface PrestamoDetails {
    id: string;
    loanCode: string;
    studentName: string;
    materialNombre: string;
    cantidad: number;
    estado: 'pendiente' | 'activo' | 'devuelto' | 'con adeudo';
    fechaSolicitud: string;
}

// --- Componente de Detalles (sin cambios) ---
const PrestamoInfoCard = ({ details, onActivate, isLoading }: { details: PrestamoDetails, onActivate: () => void, isLoading: boolean }) => {
    const estadoMap = {
        pendiente: { text: 'Pendiente de Entrega', color: 'bg-yellow-500' },
        activo: { text: 'Activo', color: 'bg-green-500' },
        devuelto: { text: 'Devuelto', color: 'bg-blue-500' },
        'con adeudo': { text: 'Con Adeudo', color: 'bg-red-500' },
    };
    const { text, color } = estadoMap[details.estado] || { text: 'Desconocido', color: 'bg-gray-500' };
    return (
        <Card className="w-full max-w-lg mx-auto">
            <CardHeader>
                <CardTitle className="text-center text-2xl">Detalles del Préstamo</CardTitle>
                <CardDescription className="text-center font-mono text-lg">{details.loanCode}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="flex justify-between items-center"><span>Estudiante:</span> <span className="font-semibold">{details.studentName}</span></div>
                <div className="flex justify-between items-center"><span>Material:</span> <span className="font-semibold">{details.materialNombre}</span></div>
                <div className="flex justify-between items-center"><span>Cantidad:</span> <span className="font-semibold">{details.cantidad}</span></div>
                <div className="flex justify-between items-center"><span>Solicitado:</span> <span className="font-semibold">{new Date(details.fechaSolicitud).toLocaleString('es-MX')}</span></div>
                <div className="flex justify-between items-center"><span>Estado:</span> <Badge className={`${color} text-white`}>{text}</Badge></div>
                {details.estado === 'pendiente' && (
                    <Button onClick={onActivate} disabled={isLoading} className="w-full mt-4 bg-green-600 hover:bg-green-700 text-white font-bold py-3">
                        {isLoading ? <LoaderCircle className="animate-spin" /> : <CheckCircle className="mr-2" />} 
                        Confirmar y Activar Préstamo
                    </Button>
                )}
                {details.estado !== 'pendiente' && (
                     <div className="text-center mt-6 p-4 bg-blue-50 border-l-4 border-blue-500 rounded-r-lg">
                        <p className="font-medium text-blue-800">Este préstamo ya fue procesado y no requiere más acciones.</p>
                    </div>
                )}
            </CardContent>
        </Card>
    );
};

// --- Componente Principal (lógica actualizada) ---
const ScanPageContent = () => {
    const searchParams = useSearchParams();
    const initialCode = searchParams ? searchParams.get('codigo') : null; 

    const [scannedCode, setScannedCode] = useState<string | null>(initialCode);
    const [prestamo, setPrestamo] = useState<PrestamoDetails | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [isActivating, setIsActivating] = useState(false);

    const fetchPrestamoDetails = async (codigo: string) => {
        setIsLoading(true);
        setError(null);
        setPrestamo(null);
        try {
            const response = await fetch(`/api/prestamos/details?codigo=${codigo}`);
            const data = await response.json();
            if (!response.ok) throw new Error(data.message || 'Error al buscar el préstamo.');
            setPrestamo(data);
            toast.success(`Préstamo ${codigo} encontrado.`);
        } catch (err: any) {
            setError(err.message);
            toast.error(err.message);
        } finally {
            setIsLoading(false);
        }
    };

    // Paso 2: Usar la Server Action en lugar de fetch
    const handleActivate = async () => {
        if (!scannedCode) return;
        setIsActivating(true);
        try {
            const result = await activatePrestamoAction(scannedCode);
            if (result.success) {
                toast.success(result.message);
                // Refrescamos los detalles para mostrar el nuevo estado "activo"
                fetchPrestamoDetails(scannedCode);
            } else {
                throw new Error(result.message);
            }
        } catch (err: any) {
            toast.error(err.message);
        } finally {
            setIsActivating(false);
        }
    };

    useEffect(() => {
        if (initialCode) {
            fetchPrestamoDetails(initialCode);
        }
    }, [initialCode]);

    const handleScanResult = (result: string) => {
        if (!result) return; // Evitar procesar resultados vacíos
        toast.info(`Código QR detectado: ${result}`);
        setScannedCode(result);
        fetchPrestamoDetails(result);
    }

    const handleScanError = (error: unknown) => {
        toast.error(error instanceof Error ? `Error de escaneo: ${error.message}` : "Ocurrió un error de escaneo desconocido.");
    }

    // --- Renderizado (sin cambios) ---
    return (
        <div className="container mx-auto p-4 md:p-8">
            <h1 className="text-3xl font-bold text-center mb-2 text-gray-800">Escanear Código de Préstamo</h1>
            <p className="text-center text-gray-500 mb-8">Apunta la cámara al código QR del estudiante para ver y activar el préstamo.</p>
            {!scannedCode && (
                 <Card className="w-full max-w-md mx-auto overflow-hidden">
                     <CardContent className="p-0 relative aspect-square">
                         <div className="absolute inset-0">
                             <Scanner 
                                 onScan={(result) => handleScanResult(result[0]?.rawValue || '')}
                                 onError={handleScanError}
                                 constraints={{ facingMode: 'environment' }}
                             />
                         </div>
                         <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                             <ScanLine className="text-white h-2/3 w-2/3 animate-pulse" strokeWidth={1} />
                             <div className="absolute inset-0 border-4 border-white/50 rounded-lg"/>
                         </div>
                     </CardContent>
                 </Card>
            )}
            {isLoading && <div className="flex justify-center items-center p-8"><LoaderCircle className="animate-spin h-10 w-10 text-gray-600" /> <p className='ml-3'>Buscando préstamo...</p></div>}
            {error && <div className="text-center text-red-500 font-bold p-8"><XCircle className="mx-auto h-8 w-8 mb-2"/> {error}</div>}
            {prestamo && <PrestamoInfoCard details={prestamo} onActivate={handleActivate} isLoading={isActivating} />}
            {(scannedCode || error) && (
                <div className="text-center mt-8">
                    <Button variant="outline" onClick={() => { setScannedCode(null); setPrestamo(null); setError(null); }}>
                        Escanear Otro Código
                    </Button>
                </div>
            )}
        </div>
    );
}

export default function ScanPage() {
    return (
        <Suspense fallback={<div className="flex justify-center items-center h-screen"><LoaderCircle className="animate-spin h-12 w-12"/></div>}>
            <ScanPageContent />
        </Suspense>
    );
}
