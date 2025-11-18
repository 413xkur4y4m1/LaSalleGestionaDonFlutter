
'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { LoaderCircle, UserPlus } from 'lucide-react';

const AddAdminPage = () => {
    const [email, setEmail] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!email) {
            toast.warning('Por favor, introduce el correo electrónico del usuario.');
            return;
        }
        setIsLoading(true);

        try {
            const response = await fetch('/api/admins', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || 'Ocurrió un error.');
            }

            toast.success(`¡Éxito! El usuario ${email} ahora es un administrador.`);
            setEmail('');

        } catch (error: any) {
            toast.error(error.message);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="container mx-auto p-4 md:p-8">
            <Card className="max-w-xl mx-auto">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-gray-800">
                        <UserPlus />
                        Agregar Nuevo Administrador
                    </CardTitle>
                    <CardDescription>
                        Introduce el correo electrónico del usuario que deseas promover a administrador. El usuario ya debe tener una cuenta registrada en la plataforma.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                                Correo Electrónico del Usuario
                            </label>
                            <Input
                                id="email"
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="usuario@ejemplo.com"
                                required
                                disabled={isLoading}
                            />
                        </div>
                        <Button type="submit" className="w-full bg-red-600 hover:bg-red-700" disabled={isLoading}>
                            {isLoading ? <LoaderCircle className="animate-spin" /> : 'Convertir en Administrador'}
                        </Button>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
};

export default AddAdminPage;
