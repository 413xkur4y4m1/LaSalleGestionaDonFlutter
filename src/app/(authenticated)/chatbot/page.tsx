"use client";

import React, { useState, useEffect, useRef } from 'react';
import { useSession } from 'next-auth/react';
import { Send, LoaderCircle, ShoppingCart, List, AlertTriangle, HelpCircle, Download } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';

import IconoGastrobot from '@/components/atoms/IconoGastrobot';
import CatalogView from '@/components/organisms/CatalogView';
import LoanListView from '@/components/organisms/LoanListView';
import DebtListView from '@/components/organisms/DebtListView';
import { Material } from '@/components/molecules/MaterialCard';
import QuantitySelector from '@/components/molecules/QuantitySelector';
import ReturnDatePicker from '@/components/molecules/ReturnDatePicker';
import { Button } from '@/components/ui/button';

// --- Tipos ---
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

// --- Componente de QR (LÓGICA DE DESCARGA CORREGIDA) ---
interface QRCodeDisplayProps {
    loanCode: string;
    materialNombre: string;
    cantidad: number;
}

const QRCodeDisplay: React.FC<QRCodeDisplayProps> = ({ loanCode, materialNombre, cantidad }) => {
    const qrRef = useRef<SVGSVGElement>(null);

    const handleDownload = () => {
        if (!qrRef.current) return;

        // ✅ Serializar el SVG a un string
        const svgString = new XMLSerializer().serializeToString(qrRef.current);
        // ✅ Crear un "Data URL" que el navegador entiende como un archivo
        const dataUrl = `data:image/svg+xml;base64,${btoa(svgString)}`;

        // ✅ Crear un enlace de descarga para el archivo SVG
        const link = document.createElement("a");
        link.href = dataUrl;
        // ✅ El archivo se guardará como .svg, no como .png
        const fileName = `${materialNombre.replace(/ /g, '_')}-${cantidad}.svg`;
        link.download = fileName;

        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    return (
        <div className="bg-white p-4 rounded-lg flex flex-col items-center gap-3 border border-gray-200 shadow-md">
            <QRCodeSVG value={loanCode} size={192} ref={qrRef} />
            <p className="font-mono text-xl font-bold text-gray-800">{loanCode}</p>
            <p className="text-sm text-center text-gray-600">Muestra este código al administrador.</p>
            <Button onClick={handleDownload} variant="outline" className="w-full">
                <Download className="mr-2 h-4 w-4" />
                Descargar QR (SVG)
            </Button>
        </div>
    );
};


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
    addMessageToChat(null, 'model', <QuantitySelector material={material} onConfirm={(quantity: number) => handleQuantityConfirmed(quantity, material)} onCancel={handleFlowCancelled} />);
  };

  const handleQuantityConfirmed = (quantity: number, material: Material) => {
    removeComponentFromChat();
    const updatedLoanState = { material, quantity };
    setLoanState(updatedLoanState);
    addMessageToChat(`Necesito ${quantity} unidad(es).`, 'user');
    addMessageToChat(`Perfecto. Has seleccionado ${quantity} de ${material.nombre}.\n\n¿Cuándo lo devolverás?`, 'model');
    addMessageToChat(null, 'model', <ReturnDatePicker onConfirm={(date: Date) => handleDateConfirmed(date, updatedLoanState)} onCancel={handleFlowCancelled} />);
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
              studentName: session?.user.name,
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

          const data = await response.json();

          removeMessageFromChat(loadingId);

          if (!response.ok) {
            throw new Error(data.message || 'El servidor rechazó la solicitud.');
          }
          
          const { loanCode } = data; 
          
          if (!loanCode) {
            throw new Error('No se recibió el código del préstamo del servidor.');
          }
          
          addMessageToChat("¡Listo! Tu solicitud ha sido generada con éxito.", 'model');
          addMessageToChat(null, 'model', <QRCodeDisplay loanCode={loanCode} materialNombre={body.materialNombre} cantidad={body.cantidad} />);
          addMessageToChat("Recuerda mostrar este código en el laboratorio para recibir tu material.", 'model');
  
      } catch (error) {
          removeMessageFromChat(loadingId);
          console.error('Error al generar préstamo:', error);
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
            const loadingId = addMessageToChat("Consultando tus préstamos...", 'model');
            const res = await fetch(`/api/prestamos?studentUid=${session.user.id}`);
            const loans = await res.json();
            removeMessageFromChat(loadingId);
            if (!res.ok) throw new Error(loans.message || 'No pude consultar tus préstamos.');
            addMessageToChat("Estos son tus préstamos activos:", 'model');
            addMessageToChat(null, 'model', <LoanListView loans={loans} />);

        } else if (textToSend === '💰 Consultar adeudos') {
            // ✅ CORRECCIÓN: Ahora DebtListView maneja su propio fetching
            addMessageToChat("Aquí tienes un resumen de tus adeudos:", 'model');
            addMessageToChat(null, 'model', <DebtListView studentUid={session.user.id} />);

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

const SuggestionButton: React.FC<{ text: string; icon: React.ReactNode; onClick: (text: string) => void }> = ({ text, icon, onClick }) => (
    <button onClick={() => onClick(text)} className="bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-medium py-2 px-3 rounded-full flex items-center gap-2 transition-colors duration-150 shadow-sm border border-gray-200">
        {icon}
        {text}
    </button>
);

export default Gastrobot;