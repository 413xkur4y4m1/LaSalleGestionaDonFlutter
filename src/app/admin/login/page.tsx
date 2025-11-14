'use client';

import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import OtpInput from 'input-otp-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2 } from 'lucide-react';

// --- Esquemas de Validación ---
const stepOneSchema = z.object({
    adminId: z.string().min(1, "El ID de administrador es requerido"),
});

const stepTwoSchema = z.object({
    pin: z.string().min(5, "El código debe tener 5 dígitos."),
});


// --- Componente del Paso 1: Ingresar ID ---
const StepOneForm = ({ onSubmit, isLoading }: { onSubmit: (data: z.infer<typeof stepOneSchema>) => void, isLoading: boolean }) => {
    const form = useForm<z.infer<typeof stepOneSchema>>({
        resolver: zodResolver(stepOneSchema),
        defaultValues: { adminId: '' },
    });

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <CardHeader>
                    <CardTitle className="text-2xl">Acceso de Administrador</CardTitle>
                    <CardDescription>Ingresa tu ID de administrador para continuar.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <FormField
                        control={form.control}
                        name="adminId"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>ID de Administrador</FormLabel>
                                <FormControl>
                                    <Input placeholder="ej: admin.lasalle" {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                    <Button type="submit" className="w-full" disabled={isLoading}>
                        {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Generar Código"}
                    </Button>
                </CardContent>
            </form>
        </Form>
    );
};

// --- Componente del Paso 2: Verificar OTP ---
const StepTwoForm = ({ onSubmit, onBack, adminEmail, isLoading }: { onSubmit: (data: z.infer<typeof stepTwoSchema>) => void, onBack: () => void, adminEmail: string, isLoading: boolean }) => {
    const form = useForm<z.infer<typeof stepTwoSchema>>({
        resolver: zodResolver(stepTwoSchema),
        defaultValues: { pin: '' },
    });

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <CardHeader>
                    <CardTitle className="text-2xl">Verifica tu Identidad</CardTitle>
                    <CardDescription>
                        Hemos enviado un código de 5 dígitos a <span className="font-semibold text-gray-900">{adminEmail}</span>.
                        Ingrésalo a continuación.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <FormField
                        control={form.control}
                        name="pin"
                        render={({ field }) => (
                            <FormItem className="flex flex-col items-center">
                                <FormLabel>Código de Acceso</FormLabel>
                                <FormControl>
                                    <OtpInput
                                        onComplete={(otp) => field.onChange(otp)}
                                        numInputs={5}
                                        containerClassName="flex gap-2 justify-center"
                                        inputClassName="flex h-10 w-10 items-center justify-center rounded-md border border-input bg-background text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 text-center"
                                    />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                    <Button type="submit" className="w-full" disabled={isLoading}>
                        {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Verificar e Iniciar Sesión"}
                    </Button>
                </CardContent>
            </form>
            <Button variant="link" onClick={onBack} className="w-full text-sm">Volver e ingresar otro ID</Button>
        </Form>
    );
};


// --- Página Principal de Login ---
export default function AdminLoginPage() {
    const [step, setStep] = useState(1);
    const [isLoading, setIsLoading] = useState(false);
    const [adminId, setAdminId] = useState('');
    const [adminEmail, setAdminEmail] = useState('');
    const router = useRouter();

    const handleStepOneSubmit = async (data: z.infer<typeof stepOneSchema>) => {
        setIsLoading(true);
        try {
            const response = await fetch('/api/admin/auth/generate-otp', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ adminId: data.adminId }),
            });

            const result = await response.json();

            if (!response.ok) {
                throw new Error(result.message || 'Error al generar el código.');
            }

            toast.success('¡Código enviado!', { description: 'Revisa tu bandeja de entrada.' });
            setAdminId(data.adminId);
            setAdminEmail(result.email);
            setStep(2);

        } catch (error: any) {
            toast.error('Error', { description: error.message });
        } finally {
            setIsLoading(false);
        }
    };

    const handleStepTwoSubmit = async (data: z.infer<typeof stepTwoSchema>) => {
        setIsLoading(true);
        try {
            const response = await fetch('/api/admin/auth/verify-otp', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ adminId, otp: data.pin }),
            });

            const result = await response.json();

            if (!response.ok) {
                throw new Error(result.message || 'Error al verificar el código.');
            }

            toast.success('¡Verificación exitosa!', { description: 'Bienvenido al panel de administración.' });
            router.push(result.redirectUrl || '/admin/dashboard');

        } catch (error: any) {
            toast.error('Error de Verificación', { description: error.message });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="flex items-center justify-center min-h-screen bg-gray-100">
            <Card className="w-full max-w-md mx-4">
                {step === 1 ? (
                    <StepOneForm onSubmit={handleStepOneSubmit} isLoading={isLoading} />
                ) : (
                    <StepTwoForm
                        onSubmit={handleStepTwoSubmit}
                        onBack={() => setStep(1)}
                        adminEmail={adminEmail}
                        isLoading={isLoading}
                    />
                )}
            </Card>
        </div>
    );
}
