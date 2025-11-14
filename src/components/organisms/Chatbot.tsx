
"use client";

import React, { useState, useEffect, useRef } from 'react';
import { useSession } from 'next-auth/react';
import { Send, LoaderCircle, ShoppingCart, List, AlertTriangle, HelpCircle } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';

import IconoGastrobot from '../atoms/IconoGastrobot';
import CatalogView from './CatalogView';
import LoanListView from './LoanListView';
import DebtListView from './DebtListView';
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
const SuggestionButton: React.FC<{ text: string; icon: React.ReactNode; onClick: (text: string) => void; }> = ({ text, icon, onClick }) => (
  <button
    onClick={() => onClick(text)}
    className="flex items-center gap-2 bg-white border border-gray-300 hover:bg-gray-100 text-gray-700 text-sm font-medium py-2 px-3 rounded-lg transition-colors duration-200 shadow-sm"
  >
    {icon}
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
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [loanState, setLoanState] = useState<LoanState>({});

  const { data: session } = useSession();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  useEffect(() => {
    if (session?.user?.name && messages.length === 0) {
      addMessageToChat(`¡Hola ${session.user.name.split(' ')[0]}! 👋 Soy Gastrobot, tu asistente de laboratorio.`, 'model');
      setShowSuggestions(true); 
    }
  }, [session, messages.length]);

  const addMessageToChat = (text: string | null, role: 'user' | 'model', component: React.ReactNode | null = null) => {
    const id = Date.now() + Math.random();
    setMessages(prev => [...prev, { id, role, text: text || undefined, component: component || undefined }]);
    return id;
  };

  const removeMessageFromChat = (id: number) => {
    setMessages(prev => prev.filter(msg => msg.id !== id));
  };
  
  const removeComponentFromChat = () => {
    setMessages(prev => prev.filter(msg => !msg.component));
  }

  // --- MANEJADORES DE FLUJO ---

  const handleMaterialSelected = (material: Material) => {
    setShowSuggestions(false);
    removeComponentFromChat();
    setLoanState({ material }); 
    addMessageToChat(`He elegido: ${material.nombre}`, 'user');
    addMessageToChat(null, 'model', <QuantitySelector material={material} onConfirm={(quantity) => handleQuantityConfirmed(quantity, material)} onCancel={handleFlowCancelled} />);
  };

  const handleQuantityConfirmed = (quantity: number, material: Material) => {
    removeComponentFromChat();
    const updatedLoanState = { material, quantity };
    setLoanState(updatedLoanState);
    addMessageToChat(`Necesito ${quantity} unidad(es).`, 'user');
    addMessageToChat(`Perfecto. Has seleccionado ${quantity} de ${material.nombre}.

¿Cuándo lo devolverás?`, 'model');
    addMessageToChat(null, 'model', <ReturnDatePicker onConfirm={(date) => handleDateConfirmed(date, updatedLoanState)} onCancel={handleFlowCancelled} />);
  };
  
  const handleDateConfirmed = async (date: Date, finalLoanState: LoanState) => {
      removeComponentFromChat();
      setLoanState({});
      addMessageToChat(`Lo devolveré el ${date.toLocaleDateString('es-MX')}.`, 'user');
      const loadingId = addMessageToChat("Un momento, estoy generando tu solicitud...", 'model');
      setIsLoading(true);
  
      try {
          const body = {
              studentUid: session?.user.id,
              materialId: finalLoanState.material?.id,
              materialNombre: finalLoanState.material?.nombre,
              cantidad: finalLoanState.quantity,
              fechaDevolucion: date.toISOString(),
              grupo: (session?.user as any)?.grupo,
          };

          if (!body.studentUid || !body.materialId || !body.materialNombre || !body.cantidad || !body.fechaDevolucion) {
            throw new Error("Faltan detalles del material o de la fecha. No se pudo completar la solicitud.");
          }
          
          if (!body.grupo) {
            throw new Error("¡No encontré tu grupo! Asegúrate de haberlo guardado, recarga la página e inténtalo de nuevo.");
          }

          const response = await fetch('/api/prestamos', { 
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(body),
          });

          removeMessageFromChat(loadingId);

          if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || 'El servidor rechazó la solicitud.');
          }
          
          const { loanCode } = await response.json(); 
          addMessageToChat("¡Listo! Tu solicitud ha sido generada con éxito.", 'model');
          addMessageToChat(null, 'model', <QRCodeDisplay loanCode={loanCode} />);
          addMessageToChat("Recuerda mostrar este código en el laboratorio para recibir tu material.", 'model');
  
      } catch (error) {
          removeMessageFromChat(loadingId);
          addMessageToChat(`Lo siento, algo salió mal: ${(error as Error).message}`, 'model');
      } finally {
          setIsLoading(false);
          setShowSuggestions(true);
      }
  };

  const handleFlowCancelled = () => {
    removeComponentFromChat();
    setLoanState({});
    addMessageToChat("He cancelado la operación.", 'user');
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
    
    let isGenkitCall = false;

    try {
        if (textToSend === '🛒 Solicitar un préstamo') {
            addMessageToChat("Aquí tienes nuestro catálogo. Elige el material que necesitas.", 'model');
            addMessageToChat(null, 'model', <CatalogView onMaterialSelect={handleMaterialSelected} />);

        } else if (textToSend === '📋 Ver mis préstamos activos') {
            // --- FIX: Corregido el nombre de la función ---
            const loadingId = addMessageToChat("Consultando tus préstamos...", 'model');
            const res = await fetch(`/api/prestamos?studentUid=${session.user.id}`);
            const loans = await res.json();
            removeMessageFromChat(loadingId);
            if (!res.ok) throw new Error(loans.message || 'No pude consultar tus préstamos.');
            addMessageToChat("Estos son tus préstamos activos:", 'model');
            addMessageToChat(null, 'model', <LoanListView loans={loans} />);

        } else if (textToSend === '💰 Consultar adeudos') {
            const loadingId = addMessageToChat("Buscando si tienes adeudos pendientes...", 'model');
            const res = await fetch(`/api/adeudos?studentUid=${session.user.id}`);
            const debts = await res.json();
            removeMessageFromChat(loadingId);
            if (!res.ok) throw new Error(debts.message || 'No pude consultar tus adeudos.');
            addMessageToChat(null, 'model', <DebtListView debts={debts} />);

        } else { // Fallback a Genkit
            isGenkitCall = true;
            setIsLoading(true);
            const history = messages.slice(0, -1).map(m => ({ role: m.role, parts: [{ text: m.text || '' }] }));
            const res = await fetch('/api/genkit', { 
                method: 'POST',
                body: JSON.stringify({ history, prompt: textToSend, student: { id: session.user.id, name: session.user.name, email: session.user.email } })
            });
            const genkitResponse = await res.json();
            if (!res.ok) throw new Error(genkitResponse.error || 'La IA no está disponible.');
            addMessageToChat(genkitResponse.response, 'model');
        }
    } catch (error) {
        setMessages(prev => prev.filter(msg => !(msg.text && msg.text.startsWith("Consultando")))); 
        addMessageToChat(`Uhm, algo no salió bien: ${(error as Error).message}`, 'model');
    } finally {
        if(isGenkitCall) setIsLoading(false);
        if (Object.keys(loanState).length === 0) {
          setShowSuggestions(true);
        }
    }
  };

  // --- RENDERIZADO DEL COMPONENTE ---
  return (
    <div className="bg-white shadow-xl rounded-lg w-full h-full flex flex-col border border-gray-200">
        <div className="p-3 bg-white rounded-t-lg flex items-center border-b border-gray-200">
            <IconoGastrobot className="h-8 w-8 text-red-600" />
            <h3 className="font-bold text-gray-800 ml-2 text-lg">Gastrobot</h3>
        </div>
        <div className="flex-1 p-4 overflow-y-auto bg-gray-50">
            {messages.map((msg) => (
                <div key={msg.id} className={`flex items-end gap-2 mb-4 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                    {msg.role === 'model' && <IconoGastrobot className="h-6 w-6 text-red-500 flex-shrink-0 self-start mt-1" />}
                    <div className={`max-w-prose rounded-2xl ${msg.role === 'user' ? 'bg-red-600 text-white rounded-br-none shadow' : (msg.component ? 'bg-transparent p-0 w-full' : 'bg-white text-gray-800 rounded-bl-none border border-gray-200 shadow-sm p-3')}`}>
                        {msg.text && <p className="text-sm whitespace-pre-wrap px-1 py-0.5">{msg.text}</p>}
                        {msg.component && <div className="w-full">{msg.component}</div>}
                    </div>
                </div>
            ))}
            {showSuggestions && !isLoading && (
              <div className="flex flex-wrap gap-2 justify-center mb-4 px-2">
                  <SuggestionButton text="🛒 Solicitar un préstamo" icon={<ShoppingCart size={16}/>} onClick={handleSend} />
                  <SuggestionButton text="📋 Ver mis préstamos activos" icon={<List size={16}/>} onClick={handleSend} />
                  <SuggestionButton text="💰 Consultar adeudos" icon={<AlertTriangle size={16}/>} onClick={handleSend} />
                  <SuggestionButton text="❓ Ayuda general" icon={<HelpCircle size={16}/>} onClick={handleSend} />
              </div>
            )}
            {isLoading && (
                <div className="flex items-end gap-2 mb-4 justify-start">
                    <IconoGastrobot className="h-6 w-6 text-red-500 animate-pulse flex-shrink-0" />
                    <div className="p-3 rounded-2xl bg-white border border-gray-200 shadow-sm"><LoaderCircle className="h-5 w-5 text-gray-500 animate-spin" /></div>
                </div>
            )}
            <div ref={messagesEndRef} />
        </div>
        <div className="p-3 border-t bg-white rounded-b-lg">
            <div className="flex items-center bg-gray-100 rounded-full">
                <input type="text" value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && !isLoading && handleSend()} className="flex-1 bg-transparent p-3 rounded-full focus:outline-none text-sm" placeholder={loanState.material ? "Selecciona una opción..." : "Escribe un mensaje..."} disabled={isLoading || (!!loanState.material)} />
                <button onClick={() => handleSend()} disabled={isLoading || !input.trim() || (!!loanState.material)} className="p-3 text-red-500 hover:text-red-600 disabled:text-gray-400"><Send className="h-5 w-5" /></button>
            </div>
        </div>
    </div>
  );
};

export default Gastrobot;
