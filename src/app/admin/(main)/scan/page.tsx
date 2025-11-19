
'use client';

import { useState, useEffect, Suspense, useTransition } from 'react';
import { useSearchParams } from 'next/navigation';
import { Scanner } from '@yudiel/react-qr-scanner';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { LoaderCircle, CheckCircle, XCircle, ScanLine } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

// PASO 1: Importar AMBAS Server Actions
import { getPrestamoDetailsAction, activatePrestamoAction } from './actions';

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

// --- Componente de la Tarjeta de Información (sin cambios) ---
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


// --- Componente Principal (LÓGICA TOTALMENTE RENOVADA) ---
const ScanPageContent = () => {
    const searchParams = useSearchParams();
    // CORRECCIÓN: Añadido optional chaining (?.) para evitar el error si searchParams es null.
    const initialCodeFromUrl = searchParams?.get('codigo');

    const [scannedCode, setScannedCode] = useState<string | null>(null);
    const [prestamo, setPrestamo] = useState<PrestamoDetails | null>(null);
    const [error, setError] = useState<string | null>(null);
    
    // Transiciones para manejar estados de carga de las Server Actions
    const [isFetching, startFetching] = useTransition();
    const [isActivating, startActivating] = useTransition();

    // PASO 1C: Función para extraer el código de una URL
    const extractLoanCode = (data: string): string | null => {
        if (data.startsWith('http')) {
            try {
                const url = new URL(data);
                return url.searchParams.get('codigo');
            } catch (e) {
                return null; // URL inválida
            }
        }
        return data; // Ya es un código
    };

    const handleCodeDetection = (codigo: string) => {
        setError(null);
        setPrestamo(null);
        setScannedCode(codigo);

        startFetching(async () => {
            const result = await getPrestamoDetailsAction(codigo);
            if (result.success && result.data) {
                setPrestamo(result.data as PrestamoDetails);
                toast.success(`Préstamo ${codigo} encontrado.`);
            } else {
                const errorMessage = result.message || 'Error desconocido al buscar el préstamo.';
                setError(errorMessage);
                toast.error(errorMessage);
            }
        });
    };

    const handleActivate = () => {
        if (!scannedCode) return;

        startActivating(async () => {
            const result = await activatePrestamoAction(scannedCode);
            if (result.success) {
                toast.success(result.message);
                // Refrescamos los detalles para mostrar el nuevo estado 'activo'
                handleCodeDetection(scannedCode);
            } else {
                const errorMessage = result.message || 'Error desconocido al activar.';
                toast.error(errorMessage);
            }
        });
    };

    useEffect(() => {
        if (initialCodeFromUrl) {
            const extracted = extractLoanCode(initialCodeFromUrl);
            if (extracted) {
                handleCodeDetection(extracted);
            }
        }
    }, [initialCodeFromUrl]);

    const handleScanResult = (result: string) => {
        if (!result) return;
        const extracted = extractLoanCode(result);
        if (extracted) {
            handleCodeDetection(extracted);
        } else {
            toast.error('El código QR no contiene un código de préstamo válido.');
        }
    };

    return (
        <div className="container mx-auto p-4 md:p-8">
            <h1 className="text-3xl font-bold text-center mb-2 text-gray-800">Escanear Código de Préstamo</h1>
            <p className="text-center text-gray-500 mb-8">Apunta la cámara al código QR para ver y activar el préstamo.</p>

            {!scannedCode && (
                <Card className="w-full max-w-md mx-auto overflow-hidden">
                     <CardContent className="p-0 relative aspect-square">
                        <div className="absolute inset-0">
                             <Scanner 
                                 onScan={(result) => handleScanResult(result[0]?.rawValue || '')}
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

            {isFetching && <div className="flex justify-center items-center p-8"><LoaderCircle className="animate-spin h-10 w-10 text-gray-600" /> <p className='ml-3'>Buscando préstamo...</p></div>}
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
};

export default function ScanPage() {
    return (
        <Suspense fallback={<div className="flex justify-center items-center h-screen"><LoaderCircle className="animate-spin h-12 w-12"/></div>}>
            <ScanPageContent />
        </Suspense>
    );
}
