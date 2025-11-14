
'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { LoaderCircle, School, ArrowLeft } from 'lucide-react';

// --- Componente del Logo ---
const LogoSalle = () => (
  <div className="flex justify-center items-center mb-4">
    <School className="h-16 w-16 text-[#0a1c65]" />
  </div>
);

// --- Componente para el Paso 1: Verificación de Cuenta ---
const AdminLoginStep1 = ({ onVerify, isLoading }: { onVerify: (account: string) => void, isLoading: boolean }) => {
    const [account, setAccount] = useState('');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (account.trim()) onVerify(account.trim());
    };

    return (
        <div className="w-full max-w-md">
            <div className="text-center mb-6">
                <h1 className="text-2xl font-bold text-[#0a1c65]">Sistema de Administración</h1>
                <p className="text-lg text-gray-600">LaSalleGestiona</p>
            </div>
            <div className="bg-white p-8 rounded-xl shadow-lg border border-gray-200">
                <form onSubmit={handleSubmit}>
                    <label htmlFor="admin-account" className="text-sm font-medium text-gray-700 mb-2 block text-center">Ingrese su AdminOT Account</label>
                    <Input id="admin-account" value={account} onChange={(e) => setAccount(e.target.value)} placeholder="AdminOT Account" className="mb-6 text-center text-lg py-6" autoComplete="off" required />
                    <button type="submit" className="w-full text-white font-bold py-3 px-4 rounded-lg bg-gradient-to-r from-[#e10022] to-[#0a1c65] hover:opacity-90 transition-opacity flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed" disabled={isLoading || !account.trim()}>
                        {isLoading && <LoaderCircle className="animate-spin mr-2 h-5 w-5" />} {isLoading ? 'Verificando...' : 'Verificar cuenta'}
                    </button>
                </form>
            </div>
        </div>
    );
};

// --- Componente para el Paso 2: Verificación de AdminKey ---
const AdminLoginStep2 = ({ onConfirm, onBack, email, isLoading }: { onConfirm: (key: string) => void, onBack: () => void, email: string, isLoading: boolean }) => {
    const [key, setKey] = useState(new Array(6).fill(''));
    const [timer, setTimer] = useState(30);
    const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

    useEffect(() => {
        const interval = setInterval(() => setTimer(prev => (prev > 0 ? prev - 1 : 0)), 1000);
        return () => clearInterval(interval);
    }, []);

    const handleChange = (index: number, value: string) => {
        const newKey = [...key];
        newKey[index] = value;
        setKey(newKey);
        if (value && index < 5) inputRefs.current[index + 1]?.focus();
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const fullKey = key.join('');
        if (fullKey.length === 6) onConfirm(fullKey);
    };

    return (
        <div className="w-full max-w-md">
            <div className="text-center mb-6">
                <h1 className="text-2xl font-bold text-green-600">✅ Cuenta Verificada</h1>
                <p className="text-sm text-gray-600 mt-2">Se ha enviado un código a:<br/><span className="font-mono font-bold">{email}</span></p>
            </div>
            <div className="bg-white p-8 rounded-xl shadow-lg border border-gray-200">
                <form onSubmit={handleSubmit}>
                    <label className="text-sm font-medium text-gray-700 mb-3 block text-center">Ingrese el AdminKey:</label>
                    <div className="flex justify-center gap-2 md:gap-3 mb-4">
                        {key.map((digit, i) => (
                            <Input
                                key={i}
                                ref={el => { inputRefs.current[i] = el; }}
                                type="text"
                                maxLength={1}
                                value={digit}
                                onChange={(e) => handleChange(i, e.target.value)}
                                className="w-12 h-14 text-center text-2xl font-mono"
                                required
                            />
                        ))}
                    </div>
                    <div className={`text-center mb-6 font-mono text-sm ${timer > 10 ? 'text-gray-500' : 'text-red-500 font-bold'}`}>
                        ⏱️ Código válido por {timer} segundos
                    </div>
                    <button type="submit" className="w-full text-white font-bold py-3 px-4 rounded-lg bg-gradient-to-r from-[#e10022] to-[#0a1c65] hover:opacity-90 transition-opacity flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed" disabled={isLoading || key.join('').length !== 6 || timer === 0}>
                         {isLoading && <LoaderCircle className="animate-spin mr-2 h-5 w-5" />} {isLoading ? 'Ingresando...' : 'Ingresar'}
                    </button>
                </form>
                <Button variant="link" onClick={onBack} className="mt-4 text-gray-600 flex items-center justify-center w-full">
                    <ArrowLeft className="h-4 w-4 mr-1" /> Volver
                </Button>
            </div>
        </div>
    );
};

// --- Página de Login Principal que orquesta los pasos ---
const AdminLoginPage = () => {
  const [step, setStep] = useState(1);
  const [adminOTAccount, setAdminOTAccount] = useState('');
  const [verifiedEmail, setVerifiedEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleAccountVerification = async (account: string) => {
    setIsLoading(true);
    // TODO: Llamar a /api/admin/verify-account y enviar correo con el código
    await new Promise(resolve => setTimeout(resolve, 1500));
    const fakeEmail = `${account.toLowerCase().replace(/\s/g, '.')}@ulsaneza.edu.mx`;
    const maskedEmail = fakeEmail.replace(/^(...).*(@.*)$/, '***************$2');
    toast.success('¡Cuenta verificada! Revisa tu correo para obtener tu AdminKey.');
    setAdminOTAccount(account);
    setVerifiedEmail(maskedEmail);
    setStep(2);
    setIsLoading(false);
  };

  const handleKeyConfirmation = async (key: string) => {
    setIsLoading(true);
    // TODO: Llamar a /api/admin/verify-key y generar sesión si es correcto
    await new Promise(resolve => setTimeout(resolve, 1500));

    if (key === '123456') { // Simulación de clave correcta
        toast.success('¡Acceso concedido! Bienvenido.');
        router.push('/admin/dashboard');
    } else {
        toast.error('AdminKey incorrecto. Inténtalo de nuevo.');
        setIsLoading(false);
    }
  };

  const handleGoBack = () => {
    setStep(1);
    setAdminOTAccount('');
    setVerifiedEmail('');
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 p-4 font-sans">
      <div className="mb-6"><LogoSalle /></div>
      {step === 1 && <AdminLoginStep1 onVerify={handleAccountVerification} isLoading={isLoading} />}
      {step === 2 && <AdminLoginStep2 onConfirm={handleKeyConfirmation} onBack={handleGoBack} email={verifiedEmail} isLoading={isLoading} />}
    </div>
  );
};

export default AdminLoginPage;
