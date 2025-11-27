'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';

import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { toast } from 'sonner';
import { LoaderCircle, ArrowLeft } from 'lucide-react';

// --- Esquemas de Validación ---
const stepOneSchema = z.object({
    adminId: z.string().min(1, "El AdminOT Account es requerido"),
});

const stepTwoSchema = z.object({
    otp: z.string().length(6, "El código debe tener 6 dígitos."),
});

// --- Componente del Logo ---
const LogoSalle = () => (
  <div className="flex justify-center items-center mb-4">
    <img 
      src="https://res.cloudinary.com/dkqnjpfn9/image/upload/w_200,h_200/v1764224515/LabSalle_xvzavm.jpg" 
      alt="Logo La Salle" 
      className="object-contain"
    />
  </div>
);

// --- Componente para el Paso 1: Verificación de Cuenta ---
const AdminLoginStep1 = ({ form, onSubmit, isLoading }: { form: any, onSubmit: (data: z.infer<typeof stepOneSchema>) => void, isLoading: boolean }) => {
    return (
        <div className="w-full max-w-md">
            <div className="text-center mb-6">
                <h1 className="text-2xl font-bold text-[#0a1c65]">Sistema de Administración</h1>
                <p className="text-lg text-gray-600">LaSalleGestiona</p>
            </div>
            <div className="bg-white p-8 rounded-xl shadow-lg border border-gray-200">
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)}>
                        <FormField
                            control={form.control}
                            name="adminId"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel htmlFor="admin-account" className="text-sm font-medium text-gray-700 mb-2 block text-center">Ingrese su AdminOT Account</FormLabel>
                                    <FormControl>
                                        <Input {...field} id="admin-account" placeholder="AdminOT Account" className="mb-6 text-center text-lg py-6" autoComplete="off" />
                                    </FormControl>
                                    <FormMessage className="text-center" />
                                </FormItem>
                            )}
                        />
                        <Button type="submit" className="w-full text-white font-bold py-3 px-4 rounded-lg bg-gradient-to-r from-[#e10022] to-[#0a1c65] hover:opacity-90 transition-opacity flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed" disabled={isLoading}>
                            {isLoading && <LoaderCircle className="animate-spin mr-2 h-5 w-5" />} {isLoading ? 'Enviando código...' : 'Enviar código de acceso'}
                        </Button>
                    </form>
                </Form>
            </div>
        </div>
    );
};

// --- Componente para el Paso 2: Ingreso del Código OTP ---
const AdminLoginStep2 = ({ form, onConfirm, onBack, email, isLoading }: { form: any, onConfirm: (data: z.infer<typeof stepTwoSchema>) => void, onBack: () => void, email: string, isLoading: boolean }) => {
    const [timer, setTimer] = useState(15 * 60); // 15 minutos
    const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

    useEffect(() => {
        const interval = setInterval(() => setTimer(prev => (prev > 0 ? prev - 1 : 0)), 1000);
        return () => clearInterval(interval);
    }, []);

    const minutes = Math.floor(timer / 60);
    const seconds = timer % 60;

    return (
        <div className="w-full max-w-md">
            <div className="text-center mb-6">
                <h1 className="text-2xl font-bold text-green-600">✅ Correo Enviado</h1>
                <p className="text-sm text-gray-600 mt-2">Se ha enviado un código a:<br/><span className="font-mono font-bold">{email}</span></p>
            </div>
            <div className="bg-white p-8 rounded-xl shadow-lg border border-gray-200">
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onConfirm)}>
                        <FormField
                            control={form.control}
                            name="otp"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel className="text-sm font-medium text-gray-700 mb-3 block text-center">Ingrese el código de acceso:</FormLabel>
                                    <FormControl>
                                        <Controller
                                            name="otp"
                                            control={form.control}
                                            render={({ field: { onChange, value = '' } }) => {
                                                const otpArray = value.split('');

                                                const handleChange = (index: number, val: string) => {
                                                    if (!/^[0-9]?$/.test(val)) return;
                                                    const newOtp = [...otpArray];
                                                    newOtp[index] = val;
                                                    const finalOtp = newOtp.join('').slice(0, 6);
                                                    onChange(finalOtp);
                                                    if (val && index < 5) inputRefs.current[index + 1]?.focus();
                                                };

                                                return (
                                                    <div className="flex justify-center gap-2 md:gap-3 mb-4">
                                                        {[...Array(6)].map((_, i) => (
                                                            <Input
                                                                key={i}
                                                                ref={el => { inputRefs.current[i] = el; }}
                                                                type="tel"
                                                                maxLength={1}
                                                                value={otpArray[i] || ''}
                                                                onChange={(e) => handleChange(i, e.target.value)}
                                                                className="w-12 h-14 text-center text-2xl font-mono"
                                                            />
                                                        ))}
                                                    </div>
                                                );
                                            }}
                                        />
                                    </FormControl>
                                    <FormMessage className="text-center" />
                                </FormItem>
                            )}
                         />
                        <div className={`text-center mb-6 font-mono text-sm ${timer > 60 ? 'text-gray-500' : 'text-red-500 font-bold'}`}>
                            ⏱️ Código válido por {minutes}:{seconds.toString().padStart(2, '0')}
                        </div>
                        <Button type="submit" className="w-full text-white font-bold py-3 px-4 rounded-lg bg-gradient-to-r from-[#e10022] to-[#0a1c65] hover:opacity-90 transition-opacity flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed" disabled={isLoading || timer === 0}>
                            {isLoading && <LoaderCircle className="animate-spin mr-2 h-5 w-5" />} {isLoading ? 'Ingresando...' : 'Verificar y Entrar'}
                        </Button>
                    </form>
                </Form>
                <Button variant="link" onClick={onBack} className="mt-4 text-gray-600 flex items-center justify-center w-full">
                    <ArrowLeft className="h-4 w-4 mr-1" /> Usar otra cuenta
                </Button>
            </div>
        </div>
    );
};

// --- Página de Login Principal que orquesta los pasos ---
const AdminLoginPage = () => {
  const [step, setStep] = useState(1);
  const [adminId, setAdminId] = useState('');
  const [verifiedEmail, setVerifiedEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const formStep1 = useForm<z.infer<typeof stepOneSchema>>({
      resolver: zodResolver(stepOneSchema),
      defaultValues: { adminId: '' },
  });

  const formStep2 = useForm<z.infer<typeof stepTwoSchema>>({
      resolver: zodResolver(stepTwoSchema),
      defaultValues: { otp: '' },
  });

  const handleAccountVerification = async (data: z.infer<typeof stepOneSchema>) => {
    setIsLoading(true);
    try {
        const response = await fetch('/api/admin/auth/generate-otp', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ adminId: data.adminId }),
        });

        const result = await response.json();

        if (!response.ok) {
            throw new Error(result.message || 'Ocurrió un error al verificar la cuenta.');
        }

        toast.success(result.message || `¡Se ha enviado un código a tu correo!`);
        setAdminId(data.adminId);
        setVerifiedEmail(result.email); // Usamos el email real de la API
        setStep(2);

    } catch (error: any) {
        toast.error(error.message);
    } finally {
        setIsLoading(false);
    }
  };

  const handleKeyConfirmation = async (data: z.infer<typeof stepTwoSchema>) => {
    setIsLoading(true);
    try {
        const response = await fetch('/api/admin/auth/verify-otp', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ adminId: adminId, otp: data.otp }),
        });

        const result = await response.json();

        if (!response.ok) {
            throw new Error(result.message || 'Error al verificar el código.');
        }

        toast.success(result.message || '¡Acceso concedido!');
        router.push(result.redirectUrl || '/admin/dashboard');

    } catch (error: any) {
        toast.error(error.message);
    } finally {
        // En caso de error, el botón se reactiva. En caso de éxito, la página redirige.
        setIsLoading(false);
    }
  };

  const handleGoBack = () => {
    setStep(1);
    setAdminId('');
    setVerifiedEmail('');
    formStep1.reset();
    formStep2.reset();
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 p-4 font-sans">
      <div className="mb-6"><LogoSalle /></div>
      {step === 1 && <AdminLoginStep1 form={formStep1} onSubmit={handleAccountVerification} isLoading={isLoading} />}
      {step === 2 && <AdminLoginStep2 form={formStep2} onConfirm={handleKeyConfirmation} onBack={handleGoBack} email={verifiedEmail} isLoading={isLoading} />}
    </div>
  );
};

export default AdminLoginPage;