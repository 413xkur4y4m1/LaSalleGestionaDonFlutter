
"use client";

import React, { useEffect, useState, useRef } from 'react';
import { Html5Qrcode, Html5QrcodeScannerState } from 'html5-qrcode';
import { QrCode, CameraOff, CheckCircle, XCircle, AlertTriangle, LoaderCircle } from 'lucide-react';
import { toast } from 'sonner';

// --- Tipos para el resultado de la validación ---
type ValidationStatus = 'success' | 'error' | 'warning' | 'loading' | 'idle';
type ValidationResult = {
    status: ValidationStatus;
    message: string;
    details?: string;
};

// --- Componente de Resultado ---
const ScanResultDisplay = ({ result, onReset }: { result: ValidationResult, onReset: () => void }) => {
    const ICONS = {
        success: <CheckCircle className="h-20 w-20 text-green-500 mx-auto mb-4" />,
        warning: <AlertTriangle className="h-20 w-20 text-yellow-400 mx-auto mb-4" />,
        error: <XCircle className="h-20 w-20 text-red-500 mx-auto mb-4" />,
        loading: <LoaderCircle className="h-20 w-20 text-gray-400 mx-auto mb-4 animate-spin" />,
        idle: null,
    };

    const TITLES = {
        success: "¡Validación Exitosa!",
        warning: "Advertencia",
        error: "Validación Fallida",
        loading: "Validando...",
        idle: "",
    }

    if (result.status === 'idle') return null;

    return (
        <div className="text-center p-8">
            {ICONS[result.status]}
            <h2 className="text-2xl font-bold mb-2">{TITLES[result.status]}</h2>
            <p className="text-gray-300 mb-4">{result.message}</p>
            {result.details && <p className="font-mono text-lg bg-gray-800 px-4 py-2 rounded-md">{result.details}</p>}
            {result.status !== 'loading' && (
                 <button onClick={onReset} className="mt-6 bg-[#0a1c65] text-white font-bold py-2 px-6 rounded-lg hover:opacity-90 transition-opacity">
                    Escanear Otro
                </button>
            )}
        </div>
    );
};

// --- Componente Principal del Escáner ---
const QRScannerPage = () => {
  const [validationResult, setValidationResult] = useState<ValidationResult>({ status: 'idle', message: '' });
  const scannerRef = useRef<Html5Qrcode | null>(null);

  const resetScanner = () => {
    setValidationResult({ status: 'idle', message: '' });
  };

  useEffect(() => {
    if (validationResult.status !== 'idle' || scannerRef.current) return;

    const scanner = new Html5Qrcode('qr-scanner-container', false);
    scannerRef.current = scanner;

    const onScanSuccess = async (decodedText: string) => {
        if (scanner.getState() !== Html5QrcodeScannerState.SCANNING) return;
        
        try {
            await scanner.pause(true);
            setValidationResult({ status: 'loading', message: 'Procesando el código QR...' });

            const response = await fetch('/api/admin/validate-qr', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ qrData: decodedText }),
            });

            const data = await response.json();

            if (response.ok) {
                setValidationResult({ status: 'success', message: data.message, details: data.details });
                toast.success(data.message);
            } else if (response.status === 409) {
                 setValidationResult({ status: 'warning', message: data.message, details: data.details });
                 toast.warning(data.message, { description: data.details });
            } else {
                 setValidationResult({ status: 'error', message: data.message });
                 toast.error(data.message);
            }
        } catch (error) {
            console.error("Fetch Error:", error);
            const errorMessage = "No se pudo conectar con el servidor de validación.";
            setValidationResult({ status: 'error', message: errorMessage });
            toast.error(errorMessage);
        }
    };

    const onScanFailure = (error: any) => {};

    scanner.start(
        { facingMode: "environment" },
        { fps: 5, qrbox: { width: 250, height: 250 }, aspectRatio: 1.0 },
        onScanSuccess,
        onScanFailure
    ).catch(err => {
        console.error("Error al iniciar la cámara:", err);
        setValidationResult({status: 'error', message: "No se pudo iniciar la cámara. Revisa los permisos."})
    });
    
    return () => {
        if (scannerRef.current && scannerRef.current.isScanning) {
            scannerRef.current.stop().catch(err => console.error("Fallo al detener el escáner", err));
        }
    };
  }, [validationResult.status]);

  return (
    <div className="container mx-auto p-4 md:p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-[#0a1c65] flex items-center gap-3"><QrCode className="h-8 w-8" /> Escáner de Códigos QR</h1>
        <p className="text-gray-600 mt-2">Apunta la cámara al QR de un estudiante para validar la operación.</p>
      </div>

      <div className="bg-white rounded-2xl shadow-xl p-6 md:p-8 border border-gray-200">
        <div className="w-full aspect-square bg-gray-900 rounded-lg flex items-center justify-center flex-col text-white max-w-lg mx-auto overflow-hidden relative">
           {validationResult.status === 'idle' ? (
                <div id="qr-scanner-container" className="w-full h-full"></div>
            ) : (
                <ScanResultDisplay result={validationResult} onReset={resetScanner} />
            )}
            {validationResult.status === 'idle' && 
                <div className="absolute top-0 left-0 w-full h-full flex items-center justify-center pointer-events-none">
                    <div className="text-center text-white">
                        <CameraOff className="h-12 w-12 text-gray-500 mx-auto mb-2"/>
                        <p className="text-gray-400">Iniciando cámara...</p>
                    </div>
                </div>
            }
        </div>
      </div>
    </div>
  );
};

export default QRScannerPage;
