"use client";

import React, { useEffect, useState, useRef } from 'react';
import { Html5Qrcode, Html5QrcodeScannerState } from 'html5-qrcode';
import { QrCode, CameraOff, CheckCircle, XCircle, AlertTriangle, LoaderCircle, Camera, Pause, Play } from 'lucide-react';
import { toast } from 'sonner';

// --- Tipos ---
type ValidationStatus = 'success' | 'error' | 'warning' | 'loading' | 'idle';
type ScannerState = 'stopped' | 'scanning' | 'paused';

type ValidationResult = {
    status: ValidationStatus;
    message: string;
    details?: string;
};

// --- Componente de Resultado ---
const ScanResultDisplay = ({ result, onReset }: { result: ValidationResult, onReset: () => void }) => {
    const ICONS = {
        success: <CheckCircle className="h-16 w-16 md:h-20 md:w-20 text-green-500 mx-auto mb-4" />,
        warning: <AlertTriangle className="h-16 w-16 md:h-20 md:w-20 text-yellow-400 mx-auto mb-4" />,
        error: <XCircle className="h-16 w-16 md:h-20 md:w-20 text-red-500 mx-auto mb-4" />,
        loading: <LoaderCircle className="h-16 w-16 md:h-20 md:w-20 text-gray-400 mx-auto mb-4 animate-spin" />,
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
        <div className="text-center p-4 md:p-8">
            {ICONS[result.status]}
            <h2 className="text-xl md:text-2xl font-bold mb-2 text-white">{TITLES[result.status]}</h2>
            <p className="text-sm md:text-base text-gray-300 mb-4 px-2">{result.message}</p>
            {result.details && (
                <p className="font-mono text-sm md:text-lg bg-gray-800 px-3 py-2 rounded-md break-all">
                    {result.details}
                </p>
            )}
            {result.status !== 'loading' && (
                 <button 
                    onClick={onReset} 
                    className="mt-6 bg-[#0a1c65] text-white font-bold py-2 px-6 rounded-lg hover:opacity-90 transition-opacity text-sm md:text-base"
                >
                    Escanear Otro
                </button>
            )}
        </div>
    );
};

// --- Componente Principal del Escáner ---
const QRScannerPage = () => {
  const [validationResult, setValidationResult] = useState<ValidationResult>({ status: 'idle', message: '' });
  const [scannerState, setScannerState] = useState<ScannerState>('stopped');
  const [cameraError, setCameraError] = useState<string | null>(null);
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const lastScanRef = useRef<string | null>(null); // Para evitar escaneos duplicados
  const scanCooldownRef = useRef<boolean>(false); // Cooldown entre escaneos

  const resetScanner = () => {
    setValidationResult({ status: 'idle', message: '' });
    lastScanRef.current = null;
    scanCooldownRef.current = false;
  };

  const startScanner = async () => {
    if (!scannerRef.current || scannerState === 'scanning') return;

    try {
      if (scannerState === 'paused') {
        await scannerRef.current.resume();
        setScannerState('scanning');
        setCameraError(null);
      } else {
        await scannerRef.current.start(
          { facingMode: "environment" },
          { fps: 5, qrbox: { width: 250, height: 250 }, aspectRatio: 1.0 },
          onScanSuccess,
          onScanFailure
        );
        setScannerState('scanning');
        setCameraError(null);
      }
    } catch (error: any) {
      console.error("Error al iniciar el escáner:", error);
      setCameraError("No se pudo iniciar la cámara. Verifica los permisos.");
      toast.error("Error al iniciar la cámara");
    }
  };

  const pauseScanner = async () => {
    if (!scannerRef.current || scannerState !== 'scanning') return;

    try {
      await scannerRef.current.pause(true);
      setScannerState('paused');
    } catch (error) {
      console.error("Error al pausar el escáner:", error);
    }
  };

  const onScanSuccess = async (decodedText: string) => {
    // Evitar procesar el mismo código múltiples veces
    if (scanCooldownRef.current || lastScanRef.current === decodedText) {
      return;
    }

    // Activar cooldown de 2 segundos
    scanCooldownRef.current = true;
    lastScanRef.current = decodedText;
    
    try {
      if (scannerRef.current?.getState() === Html5QrcodeScannerState.SCANNING) {
        await scannerRef.current.pause(true);
        setScannerState('paused');
      }
      
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
    } finally {
      // Resetear cooldown después de 2 segundos
      setTimeout(() => {
        scanCooldownRef.current = false;
      }, 2000);
    }
  };

  const onScanFailure = (error: any) => {
    // Silencioso - no mostrar errores de escaneo continuo
  };

  useEffect(() => {
    const scanner = new Html5Qrcode('qr-scanner-container', false);
    scannerRef.current = scanner;
    
    return () => {
      if (scannerRef.current && scannerRef.current.isScanning) {
        scannerRef.current.stop().catch(err => console.error("Fallo al detener el escáner", err));
      }
    };
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 py-4 px-4 md:py-8">
      <div className="container mx-auto max-w-4xl">
        {/* Header */}
        <div className="mb-6 md:mb-8">
          <h1 className="text-2xl md:text-3xl font-bold text-[#0a1c65] flex items-center gap-3">
            <QrCode className="h-6 w-6 md:h-8 md:w-8" /> 
            Escáner de Códigos QR
          </h1>
          <p className="text-sm md:text-base text-gray-600 mt-2">
            Apunta la cámara al QR de un estudiante para validar la operación.
          </p>
        </div>

        {/* Scanner Container */}
        <div className="bg-white rounded-2xl shadow-xl p-4 md:p-8 border border-gray-200">
          {/* Controls */}
          <div className="flex flex-wrap gap-2 md:gap-3 mb-4 justify-center">
            {scannerState === 'stopped' && (
              <button
                onClick={startScanner}
                className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white font-semibold py-2 px-4 md:px-6 rounded-lg transition-colors text-sm md:text-base"
              >
                <Camera className="h-4 w-4 md:h-5 md:w-5" />
                Iniciar Cámara
              </button>
            )}
            
            {scannerState === 'scanning' && (
              <button
                onClick={pauseScanner}
                className="flex items-center gap-2 bg-yellow-600 hover:bg-yellow-700 text-white font-semibold py-2 px-4 md:px-6 rounded-lg transition-colors text-sm md:text-base"
              >
                <Pause className="h-4 w-4 md:h-5 md:w-5" />
                Pausar
              </button>
            )}
            
            {scannerState === 'paused' && (
              <button
                onClick={startScanner}
                className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 md:px-6 rounded-lg transition-colors text-sm md:text-base"
              >
                <Play className="h-4 w-4 md:h-5 md:w-5" />
                Reanudar
              </button>
            )}
          </div>

          {/* Scanner Status Badge */}
          <div className="flex justify-center mb-4">
            <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs md:text-sm font-medium ${
              scannerState === 'scanning' ? 'bg-green-100 text-green-800' :
              scannerState === 'paused' ? 'bg-yellow-100 text-yellow-800' :
              'bg-gray-100 text-gray-800'
            }`}>
              <div className={`h-2 w-2 rounded-full ${
                scannerState === 'scanning' ? 'bg-green-500 animate-pulse' :
                scannerState === 'paused' ? 'bg-yellow-500' :
                'bg-gray-500'
              }`} />
              {scannerState === 'scanning' ? 'Escaneando' :
               scannerState === 'paused' ? 'En Pausa' :
               'Cámara Apagada'}
            </div>
          </div>

          {/* Scanner Area */}
          <div className="w-full aspect-square bg-gray-900 rounded-lg flex items-center justify-center flex-col text-white max-w-lg mx-auto overflow-hidden relative">
            {validationResult.status === 'idle' ? (
              <>
                <div id="qr-scanner-container" className="w-full h-full"></div>
                
                {/* Overlay cuando está detenido o hay error */}
                {(scannerState === 'stopped' || cameraError) && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-900 bg-opacity-95 p-4">
                    <CameraOff className="h-12 w-12 md:h-16 md:w-16 text-gray-500 mb-4"/>
                    <p className="text-gray-400 text-sm md:text-base text-center">
                      {cameraError || 'Presiona "Iniciar Cámara" para comenzar'}
                    </p>
                  </div>
                )}

                {/* Overlay cuando está pausado */}
                {scannerState === 'paused' && !cameraError && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-900 bg-opacity-80">
                    <Pause className="h-12 w-12 md:h-16 md:w-16 text-yellow-400 mb-4"/>
                    <p className="text-yellow-400 text-sm md:text-base font-semibold">
                      Escaneo en Pausa
                    </p>
                  </div>
                )}
              </>
            ) : (
              <ScanResultDisplay result={validationResult} onReset={resetScanner} />
            )}
          </div>

          {/* Instructions */}
          {validationResult.status === 'idle' && scannerState === 'scanning' && (
            <div className="mt-4 text-center">
              <p className="text-xs md:text-sm text-gray-500">
                Mantén el código QR dentro del recuadro para escanearlo
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default QRScannerPage;