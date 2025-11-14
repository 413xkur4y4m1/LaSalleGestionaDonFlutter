
'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useSession } from 'next-auth/react';
import { v4 as uuidv4 } from 'uuid';
import { Button } from "@/components/ui/button";
import { LoaderCircle, User, Bot, Sparkles, AlertTriangle, BadgeDollarSign, HelpCircle } from 'lucide-react';
import { toast } from 'sonner';

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
  const [isLoading, setIsLoading] = useState(false);
  const [isFormActive, setIsFormActive] = useState(false);
  const [showInitialMenu, setShowInitialMenu] = useState(false);
  const { data: session } = useSession();
  const chatContainerRef = useRef<HTMLDivElement>(null);

  // Vigila proactivamente si hay préstamos vencidos al cargar
  useEffect(() => {
    const checkForOverdueLoans = async () => {
        if (session?.user?.id) {
            setIsLoading(true);
            try {
                const response = await fetch(`/api/chatbot/check-overdue?studentUid=${session.user.id}`);
                if (!response.ok) {
                    setShowInitialMenu(true);
                    return;
                }
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
                    setIsFormActive(true);
                    setShowInitialMenu(false);
                } else {
                    const welcomeMessage: Message = {
                        id: uuidv4(),
                        isUser: false,
                        text: `¡Hola ${session.user.name}! Soy Gastrobot, tu asistente virtual. ¿Cómo puedo ayudarte hoy?`
                    };
                    setMessages([welcomeMessage]);
                    setShowInitialMenu(true);
                }
            } catch (error) {
                console.error("Error al verificar préstamos vencidos:", error);
                const welcomeMessage: Message = {
                    id: uuidv4(),
                    isUser: false,
                    text: `¡Hola ${session.user.name}! No pude verificar tus préstamos, pero dime, ¿en qué te puedo ayudar?`
                };
                setMessages([welcomeMessage]);
                setShowInitialMenu(true);
            } finally {
                setIsLoading(false);
            }
        }
    };
    checkForOverdueLoans();
  }, [session]);

  // Efecto para hacer scroll hacia abajo
  useEffect(() => {
    chatContainerRef.current?.scrollTo({ top: chatContainerRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages]);

  // --- MANEJADORES DEL FLUJO GUIADO ---

  const handleOverdueFormSubmit = async (reason: OverdueReason, reasonText: string, loan: OverdueLoan) => {
    const userResponseMessage: Message = { id: uuidv4(), isUser: true, text: reasonText };
    setMessages(prev => prev.filter(m => !m.component).concat(userResponseMessage));
    setIsLoading(true);
    setIsFormActive(false);

    try {
        const response = await fetch('/api/chatbot/create-debt', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ studentUid: session!.user!.id, loanId: loan.id, reason: reason, loanDetails: loan })
        });
        const { debt } = await response.json();
        if (!response.ok) throw new Error(debt.message || 'No se pudo crear el adeudo.');

        let botResponse: Message;
        if (reason === 'broken' || reason === 'lost') {
            botResponse = {
                id: uuidv4(), isUser: false, component: (<PaymentDetailsCard debtDetails={debt} onSubmit={handlePaymentSubmit}/>)
            };
            setIsFormActive(true);
        } else {
            botResponse = { id: uuidv4(), isUser: false, text: 'Entendido. Te recordamos que debes devolver el material lo antes posible para evitar mayores inconvenientes.' };
        }
        setMessages(prev => [...prev, botResponse]);
    } catch (error: any) { toast.error(`Error: ${error.message}`); }
    finally { setIsLoading(false); }
  };

  const handlePaymentSubmit = (method: PaymentMethod) => {
    setMessages(prev => prev.filter(m => !m.component));
    setIsLoading(true);
    setIsFormActive(false);
    setTimeout(() => {
        let finalMessage: Message;
        if (method === 'online') {
            finalMessage = { id: uuidv4(), isUser: false, text: "Se ha generado tu enlace de pago. Serás redirigido en unos momentos. Gracias."};
        } else {
            finalMessage = { id: uuidv4(), isUser: false, text: `¡Excelente! Tu código de pago es PAGO-${session?.user?.name?.slice(0,3).toUpperCase()}-001. Por favor, preséntalo en la caja para completar el proceso.` };
        }
        setMessages(prev => [...prev, finalMessage]);
        setIsLoading(false);
    }, 1500);
  };
  
  const handleMenuClick = (option: 'overdue' | 'debts' | 'help') => {
      let userMessageText = '';
      let botMessageText = '';
      
      setShowInitialMenu(false);

      switch(option) {
          case 'overdue':
              userMessageText = "Tengo un problema con un préstamo";
              botMessageText = "Entendido. Para ayudarte mejor, por favor, ve al apartado de 'Mis Préstamos' y selecciona el material con el que tienes el problema. Desde allí podrás iniciar el reporte.";
              break;
          case 'debts':
              userMessageText = "Quiero consultar mis adeudos";
              botMessageText = "Claro, puedes ver todos tus adeudos pendientes, su estado y el historial de pagos en la sección 'Mis Adeudos'.";
              break;
          case 'help':
              userMessageText = "Necesito ayuda o tengo otra pregunta";
              botMessageText = "Si necesitas asistencia personalizada, puedes acercarte al mostrador del laboratorio en el horario de atención. El personal estará encantado de ayudarte.";
              break;
      }
      
      const userMessage: Message = { id: uuidv4(), isUser: true, text: userMessageText };
      const botMessage: Message = { id: uuidv4(), isUser: false, text: botMessageText };
      
      setMessages(prev => [...prev, userMessage, botMessage]);
      
      setTimeout(() => setShowInitialMenu(true), 2500);
  }

  return (
    <div className="flex flex-col h-full bg-gray-50">
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
        {showInitialMenu && !isFormActive && (
          <div className="flex flex-col sm:flex-row gap-2 justify-center">
              <Button variant="outline" className="flex-1" onClick={() => handleMenuClick('overdue')}>
                  <AlertTriangle className="h-4 w-4 mr-2"/> Problema con Préstamo
              </Button>
              <Button variant="outline" className="flex-1" onClick={() => handleMenuClick('debts')}>
                  <BadgeDollarSign className="h-4 w-4 mr-2"/> Consultar Adeudos
              </Button>
              <Button variant="outline" className="flex-1" onClick={() => handleMenuClick('help')}>
                  <HelpCircle className="h-4 w-4 mr-2"/> Otra Pregunta
              </Button>
          </div>
        )}
        {isFormActive && (
             <p className="text-center text-sm text-gray-500">Por favor, completa la acción en el formulario de arriba para continuar.</p>
        )}
      </footer>
    </div>
  );
};

export default ChatbotPage;
