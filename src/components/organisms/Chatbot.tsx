
"use client";

import React, { useState, useEffect, useRef } from 'react';
import { useSession } from 'next-auth/react';
import { Send, LoaderCircle } from 'lucide-react';
import { QRCodeSVG } from "qrcode.react";
// CORREGIDO: Importación nombrada

import IconoGastrobot from '../atoms/IconoGastrobot';
import CatalogView from './CatalogView';
import { Material } from '../molecules/MaterialCard';
import QuantitySelector from '../molecules/QuantitySelector';
import ReturnDatePicker from '../molecules/ReturnDatePicker';

// --- TIPOS Y ESTRUCTURAS DE DATOS ---
interface ChatMessage {
  id: number;
  role: 'user' | 'model';
  text?: string;
  component?: React.ReactNode;
}

interface LoanState {
  material?: Material;
  quantity?: number;
  returnDate?: Date;
}

// --- COMPONENTES INTERNOS ---
const SuggestionButton: React.FC<{ text: string; onClick: (text: string) => void; }> = ({ text, onClick }) => (
  <button
    onClick={() => onClick(text)}
    className="bg-white border border-gray-300 hover:bg-gray-100 text-gray-800 text-sm font-semibold py-2 px-4 rounded-full transition-colors duration-200"
  >
    {text}
  </button>
);

const QRCodeDisplay: React.FC<{ loanCode: string }> = ({ loanCode }) => (
    <div className="bg-white p-4 rounded-lg flex flex-col items-center gap-2 border border-gray-200 shadow-md">
        <QRCodeSVG value={loanCode} size={128} />
        <p className="font-mono text-lg font-bold text-gray-800 mt-2">{loanCode}</p>
        <p className="text-xs text-center text-gray-600">Muestra este código al administrador del laboratorio.</p>
    </div>
);

// --- COMPONENTE PRINCIPAL: GASTROBOT ---
const Gastrobot = () => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(true);
  const [loanState, setLoanState] = useState<LoanState>({});

  const { data: session } = useSession();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  useEffect(() => {
    if (session?.user?.name && messages.length === 0) {
      addMessageToChat(`¡Hola ${session.user.name.split(' ')[0]}! 👋 Soy Gastrobot... ¿En qué te ayudo?`, 'model');
    }
  }, [session]);

  const addMessageToChat = (text: string | null, role: 'user' | 'model', component: React.ReactNode | null = null) => {
    setMessages(prev => [...prev, { id: Date.now(), role, text: text || undefined, component: component || undefined }]);
  };

  const removeComponentFromChat = () => setMessages(prev => prev.filter(msg => !msg.component));

  // --- MANEJADORES DEL FLUJO DE PRÉSTAMO ---

  const handleMaterialSelected = (material: Material) => {
    removeComponentFromChat();
    setLoanState({ material });
    addMessageToChat(`He elegido: ${material.nombre}`, 'user');
    addMessageToChat(null, 'model', <QuantitySelector material={material} onConfirm={handleQuantityConfirmed} onCancel={handleFlowCancelled} />);
  };

  const handleQuantityConfirmed = (quantity: number) => {
    removeComponentFromChat();
    const updatedLoanState = { ...loanState, quantity };
    setLoanState(updatedLoanState);
    addMessageToChat(`Necesito ${quantity} unidad(es).`, 'user');
    addMessageToChat(`Seleccionado:
• ${updatedLoanState.material?.nombre} x${quantity}

¿Cuándo lo devolverás?`, 'model');
    addMessageToChat(null, 'model', <ReturnDatePicker onConfirm={(date) => handleDateConfirmed(date, updatedLoanState)} onCancel={handleFlowCancelled} />);
  };
  
  const handleDateConfirmed = async (date: Date, finalLoanState: LoanState) => {
      removeComponentFromChat();
      setLoanState(prev => ({ ...prev, returnDate: date }));
      addMessageToChat(`Lo devolveré el ${date.toLocaleDateString()}.`, 'user');
      addMessageToChat("¡Perfecto! Generando tu solicitud...", 'model');
      setIsLoading(true);
  
      // --- LLAMADA AL BACKEND --- 
      try {
          const response = await fetch('/api/prestamos', { // Nuevo endpoint para préstamos
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                  studentUid: session?.user.id,
                  materialId: finalLoanState.material?.id,
                  materialNombre: finalLoanState.material?.nombre,
                  cantidad: finalLoanState.quantity,
                  fechaDevolucion: date.toISOString(),
                  grupo: session?.user.grupo, // Asumiendo que el grupo está en la sesión
              }),
          });
  
          if (!response.ok) throw new Error(await response.text());
  
          const { loanCode } = await response.json(); // El backend nos devuelve el código del préstamo
  
          // Flujo final exitoso
          addMessageToChat("¡Listo! Tu solicitud ha sido generada.", 'model');
          addMessageToChat(null, 'model', <QRCodeDisplay loanCode={loanCode} />);
          addMessageToChat("✅ También te envié este código a tu correo institucional.", 'model');
          setLoanState({}); // Reseteamos para el próximo préstamo
  
      } catch (error) {
          console.error("Error al crear el préstamo:", error);
          addMessageToChat(`Lo siento, hubo un error al procesar tu solicitud: ${(error as Error).message}`, 'model');
      } finally {
          setIsLoading(false);
      }
  };

  const handleFlowCancelled = () => {
    removeComponentFromChat();
    setLoanState({});
    addMessageToChat("Solicitud cancelada.", 'user');
    addMessageToChat("De acuerdo, he cancelado la solicitud. ¿Hay algo más en lo que pueda ayudarte?", 'model');
    setShowSuggestions(true);
  }

  // --- FUNCIÓN PRINCIPAL DE ENVÍO ---
  const handleSend = async (messageText?: string) => {
    const textToSend = messageText || input;
    if (!textToSend.trim() || !session?.user.id) return;

    addMessageToChat(textToSend, 'user');
    setInput('');
    setShowSuggestions(false);

    if (loanState.material) return; // Si estamos en un flujo, no hacemos nada más

    if (textToSend.toLowerCase().includes('solicitar un préstamo')) {
      addMessageToChat("¡Perfecto! Aquí tienes nuestro catálogo.", 'model', <CatalogView onMaterialSelect={handleMaterialSelected} />);
      return;
    }

    // Para otros casos, llamamos a Genkit
    setIsLoading(true);
    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ history: messages.map(m => ({ role: m.role, parts: [{ text: m.text || '' }] })), studentUid: session.user.id }),
      });
      if (!response.ok) throw new Error('Error de la IA.');
      addMessageToChat(await response.text(), 'model');
    } catch (error) { addMessageToChat('Lo siento, no puedo responder ahora.', 'model'); } finally { setIsLoading(false); }
  };

  return (
    <div className="bg-white shadow-2xl rounded-lg w-full h-full flex flex-col border border-gray-200">
        {/* Header */}
        <div className="p-3 bg-white rounded-t-lg flex items-center border-b border-gray-200">
            <IconoGastrobot className="h-8 w-8 text-red-600" />
            <h3 className="font-bold text-gray-800 ml-2 text-lg">Gastrobot</h3>
        </div>
        {/* Messages */}
        <div className="flex-1 p-4 overflow-y-auto bg-white">
            {messages.map((msg) => (
                <div key={msg.id} className={`flex items-end gap-2 mb-4 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                    {msg.role === 'model' && <IconoGastrobot className="h-6 w-6 text-red-500 flex-shrink-0" />}
                    <div className={`max-w-full md:max-w-2xl rounded-2xl ${msg.role === 'user' ? 'bg-red-600 text-white rounded-br-none shadow-sm' : (msg.component ? 'bg-transparent p-0' : 'bg-gray-100 text-gray-800 rounded-bl-none shadow-sm p-3')}`}>
                        {msg.text && <p className="text-sm whitespace-pre-wrap">{msg.text}</p>}
                        {msg.component && <div className="w-full">{msg.component}</div>}
                    </div>
                </div>
            ))}
            {showSuggestions && messages.length > 0 && (
                <div className="flex flex-wrap gap-2 justify-start mb-4 pl-10">
                    <SuggestionButton text="Solicitar un préstamo" onClick={() => handleSend("Solicitar un préstamo")} />
                    {/* Otros botones... */}
                </div>
            )}
            {isLoading && (
                <div className="flex items-end gap-2 mb-4 justify-start">
                    <IconoGastrobot className="h-6 w-6 text-red-500 animate-pulse flex-shrink-0" />
                    <div className="p-3 rounded-2xl bg-gray-100"><LoaderCircle className="h-5 w-5 text-gray-500 animate-spin" /></div>
                </div>
            )}
            <div ref={messagesEndRef} />
        </div>
        {/* Input */}
        <div className="p-3 border-t bg-white rounded-b-lg">
            <div className="flex items-center bg-gray-100 rounded-full">
                <input type="text" value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && !isLoading && handleSend()} className="flex-1 bg-transparent p-3 rounded-full focus:outline-none text-sm" placeholder="Escribe un mensaje..." disabled={isLoading || !!loanState.material} />
                <button onClick={() => handleSend()} disabled={isLoading || !input.trim() || !!loanState.material} className="p-3 text-red-500 hover:text-red-600 disabled:text-gray-400"><Send className="h-5 w-5" /></button>
            </div>
        </div>
    </div>
  );
};

export default Gastrobot;
