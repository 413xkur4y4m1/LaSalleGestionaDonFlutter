
'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useSession } from 'next-auth/react';
import { v4 as uuidv4 } from 'uuid';
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Send, LoaderCircle, User, Bot, Sparkles } from 'lucide-react';
import { toast } from 'sonner';

// --- Importamos los nuevos componentes y tipos ---
import OverdueLoanForm, { OverdueReason } from '@/components/molecules/OverdueLoanForm';
import PaymentDetailsCard, { PaymentMethod } from '@/components/molecules/PaymentDetailsCard';

// --- Tipos de Datos ---
type Message = {
  id: string;
  text?: string;
  isUser: boolean;
  component?: React.ReactNode;
};

type OverdueLoan = {
    id: string;
    nombreMaterial: string;
    cantidad: number;
    precioUnitario: number;
    fechaInicio: string;
    fechaDevolucion: string;
};

// --- Componente de Mensaje Individual ---
const MessageBubble: React.FC<{ message: Message }> = ({ message }) => {
    const bubbleClasses = message.isUser
        ? "bg-blue-600 text-white self-end"
        : "bg-gray-200 text-gray-900 self-start";
    const Icon = message.isUser ? User : Bot;

    return (
        <div className={`flex items-start gap-3 w-full max-w-lg ${message.isUser ? 'self-end justify-end' : 'self-start'}`}>
            {!message.isUser && <Icon className="h-6 w-6 text-gray-500"/>}
            <div className={`rounded-lg px-4 py-3 ${bubbleClasses}`}>
                {message.component ? message.component : <p className="text-sm">{message.text}</p>}
            </div>
            {message.isUser && <Icon className="h-6 w-6 text-gray-500"/>}
        </div>
    );
};

// --- Página Principal del Chatbot ---
const ChatbotPage = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isFormActive, setIsFormActive] = useState(false);
  const { data: session } = useSession();
  const chatContainerRef = useRef<HTMLDivElement>(null);

  // --- EFECTO PARA EL VIGILANTE PROACTIVO ---
  useEffect(() => {
    const checkForOverdueLoans = async () => {
        if (session?.user?.id) {
            setIsLoading(true);
            try {
                const response = await fetch(`/api/chatbot/check-overdue?studentUid=${session.user.id}`);
                if (!response.ok) return;
                const { overdueLoan } = await response.json() as { overdueLoan: OverdueLoan | null };

                if (overdueLoan) {
                    const formMessage: Message = {
                        id: uuidv4(),
                        isUser: false,
                        component: (
                            <OverdueLoanForm 
                                loanName={overdueLoan.nombreMaterial}
                                onSubmit={(reason, reasonText) => handleOverdueFormSubmit(reason, reasonText, overdueLoan)}
                            />
                        )
                    };
                    setMessages([formMessage]);
                    setIsFormActive(true); // Activamos el formulario
                }

            } catch (error) {
                console.error("Error al verificar préstamos vencidos:", error);
            } finally {
                setIsLoading(false);
            }
        }
    };
    checkForOverdueLoans();
  }, [session]);

  useEffect(() => {
    chatContainerRef.current?.scrollTo({ top: chatContainerRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages]);

  // --- MANEJO DEL ENVÍO DEL FORMULARIO DE ADEUDO ---
  const handleOverdueFormSubmit = async (reason: OverdueReason, reasonText: string, loan: OverdueLoan) => {
    // 1. Añade la respuesta del usuario al chat y desactiva el formulario inicial.
    const userResponseMessage: Message = { id: uuidv4(), isUser: true, text: reasonText };
    setMessages(prev => prev.filter(m => !m.component).concat(userResponseMessage));
    setIsLoading(true);
    setIsFormActive(false);

    try {
        // 2. Llama a la API para crear el adeudo
        const response = await fetch('/api/chatbot/create-debt', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ studentUid: session!.user!.id, loanId: loan.id, reason: reason, loanDetails: loan })
        });
        
        const { debt } = await response.json();

        if (!response.ok) throw new Error(debt.message || 'No se pudo crear el adeudo.');

        let botResponse: Message;
        
        // 3. Decide qué mostrar basado en la razón
        if (reason === 'broken' || reason === 'lost') {
            // Muestra la tarjeta de pago
            botResponse = {
                id: uuidv4(),
                isUser: false,
                component: (
                    <PaymentDetailsCard 
                        debtDetails={debt} 
                        onSubmit={handlePaymentSubmit}
                    />
                )
            };
            setIsFormActive(true); // El nuevo formulario de pago está activo
        } else {
            // Solo un recordatorio
            botResponse = {
                id: uuidv4(),
                isUser: false,
                text: 'Entendido. Te recordamos que debes devolver el material lo antes posible para evitar mayores inconvenientes.'
            };
        }
        setMessages(prev => [...prev, botResponse]);

    } catch (error: any) {
        toast.error(`Error: ${error.message}`);
    } finally {
        setIsLoading(false);
    }
  };

  // --- MANEJO DEL ENVÍO DEL PAGO ---
  const handlePaymentSubmit = (method: PaymentMethod) => {
    // Simulación de la Fase 4
    setMessages(prev => prev.filter(m => !m.component));
    setIsLoading(true);
    setIsFormActive(false);

    setTimeout(() => {
        let finalMessage: Message;
        if (method === 'online') {
            finalMessage = {
                id: uuidv4(),
                isUser: false,
                text: "Se ha generado tu enlace de pago. Serás redirigido en unos momentos. Gracias.",
                // Aquí se podría añadir un botón que redirija a Stripe/MercadoPago
            };
        } else {
            finalMessage = {
                id: uuidv4(),
                isUser: false,
                text: `¡Excelente! Tu código de pago es PAGO-${session?.user?.name?.slice(0,3).toUpperCase()}-001. Por favor, preséntalo en la caja para completar el proceso.`
            };
        }
        setMessages(prev => [...prev, finalMessage]);
        setIsLoading(false);
    }, 1500);
  };

  // --- MANEJO DE MENSAJE NORMAL ---
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading || isFormActive) return;

    const userMessage: Message = { id: uuidv4(), text: input, isUser: true };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/genkit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: input, history: messages.slice(-10) })
      });

      if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Error en la API');
      }

      const { response: botText } = await response.json();
      const botMessage: Message = { id: uuidv4(), text: botText, isUser: false };
      setMessages(prev => [...prev, botMessage]);

    } catch (error: any) {
        toast.error(`Error: ${error.message}`);
    } finally {
        setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-gray-50">
      {/* ... El resto del JSX (header, chat container, footer) permanece igual ... */}
      <header className="p-4 border-b bg-white flex justify-between items-center">
        <div>
            <h1 className="text-xl font-bold text-gray-800">Gastrobot IA</h1>
            <p className="text-sm text-gray-500">Tu asistente de laboratorio virtual</p>
        </div>
        <Sparkles className="h-6 w-6 text-red-600" />
      </header>

      <div ref={chatContainerRef} className="flex-1 p-4 space-y-6 overflow-y-auto">
        {messages.map(msg => <MessageBubble key={msg.id} message={msg} />)}
        {isLoading && (
            <div className="flex items-start gap-3 w-full max-w-lg self-start">
                <Bot className="h-6 w-6 text-gray-500"/>
                <div className="rounded-lg px-4 py-3 bg-gray-200 text-gray-900">
                    <LoaderCircle className="h-5 w-5 animate-spin"/>
                </div>
            </div>
        )}
      </div>

      <footer className="p-4 border-t bg-white">
        <form onSubmit={handleSendMessage} className="flex items-center gap-3">
          <Input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={isFormActive ? "Por favor, responde al formulario." : "Escribe tu pregunta aquí..."}
            className="flex-1"
            disabled={isFormActive || isLoading}
          />
          <Button type="submit" disabled={!input.trim() || isLoading || isFormActive}>
            <Send className="h-5 w-5" />
          </Button>
        </form>
      </footer>
    </div>
  );
};

export default ChatbotPage;
