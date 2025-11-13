
"use client";

import { useState, useEffect, useRef } from 'react';
import { useSession } from 'next-auth/react';
import { MessageSquare, Send, X, LoaderCircle } from 'lucide-react';
import LogoDonFlutter from '../atoms/LogoDonFlutter'; // Corregido: importación por defecto

// Tipos de mensaje para la conversación
interface ChatMessage {
  role: 'user' | 'model'; // 'model' representa a la IA
  text: string;
}

// El componente del Chatbot de IA
const AIChatbot = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  const { data: session } = useSession(); // Obtenemos la sesión del usuario
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Efecto para hacer scroll hacia el último mensaje
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Mensaje de bienvenida cuando se abre el chat
  useEffect(() => {
    if (isOpen && messages.length === 0) {
      setMessages([
        {
          role: 'model',
          text: '¡Hola! Soy Don Flutter, tu asistente virtual. ¿En qué puedo ayudarte hoy? Puedes preguntarme sobre tus préstamos activos o tus adeudos pendientes.',
        },
      ]);
    }
  }, [isOpen]);

  const handleSend = async () => {
    // Corregido: session.user.id en lugar de session.user.uid
    if (!input.trim() || !session?.user.id) return;

    const userMessage: ChatMessage = { role: 'user', text: input };
    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setInput('');
    setIsLoading(true);

    try {
      // Hacemos la llamada a nuestra API de Genkit
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          history: newMessages.map(m => ({ role: m.role, parts: [{ text: m.text }] })),
          // Corregido: session.user.id en lugar de session.user.uid
          studentUid: session.user.id,
        }),
      });

      if (!response.ok) {
        throw new Error('La respuesta de la IA no fue exitosa.');
      }
      
      const modelResponseText = await response.text();
      const modelMessage: ChatMessage = { role: 'model', text: modelResponseText };
      setMessages(prev => [...prev, modelMessage]);

    } catch (error) {
      console.error('Error al contactar la IA:', error);
      const errorMessage: ChatMessage = {
        role: 'model',
        text: 'Lo siento, estoy teniendo problemas para conectarme. Por favor, intenta de nuevo más tarde.',
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed bottom-4 right-4 z-50">
      {/* VENTANA DEL CHAT */}
      {isOpen && (
        <div className="bg-white dark:bg-gray-800 shadow-2xl rounded-lg w-80 sm:w-96 h-[500px] flex flex-col border border-gray-200 dark:border-gray-700">
          {/* Header */}
          <div className="p-3 bg-gray-100 dark:bg-gray-900 rounded-t-lg flex justify-between items-center border-b dark:border-gray-700">
            <div className="flex items-center space-x-2">
              <LogoDonFlutter className="h-8 w-8" />
              <h3 className="font-semibold text-gray-800 dark:text-gray-100">Don Flutter</h3>
            </div>
            <button onClick={() => setIsOpen(false)} className="p-1 rounded-full text-gray-500 hover:bg-gray-200 dark:hover:bg-gray-700">
              <X className="h-5 w-5" />
            </button>
          </div>
          
          {/* Área de Mensajes */}
          <div className="flex-1 p-4 overflow-y-auto bg-gray-50 dark:bg-gray-800">
            {messages.map((msg, index) => (
              <div key={index} className={`flex items-end gap-2 mb-4 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                 {msg.role === 'model' && <LogoDonFlutter className="h-6 w-6 text-blue-500" />}
                <div className={`max-w-xs md:max-w-md p-3 rounded-2xl ${msg.role === 'user' ? 'bg-blue-500 text-white rounded-br-none' : 'bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-bl-none border dark:border-gray-600'}`}>
                  <p className="text-sm">{msg.text}</p>
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="flex items-end gap-2 mb-4 justify-start">
                  <LogoDonFlutter className="h-6 w-6 text-blue-500 animate-pulse" />
                  <div className="max-w-xs p-3 rounded-2xl bg-white dark:bg-gray-700 rounded-bl-none border dark:border-gray-600">
                      <LoaderCircle className="h-5 w-5 text-gray-500 animate-spin" />
                  </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
          
          {/* Input del Chat */}
          <div className="p-3 border-t bg-white dark:bg-gray-800 rounded-b-lg">
            <div className="flex items-center bg-gray-100 dark:bg-gray-700 rounded-full">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && !isLoading && handleSend()}
                className="flex-1 bg-transparent p-3 rounded-full focus:outline-none text-sm text-gray-800 dark:text-gray-200 placeholder-gray-500"
                placeholder="Pregúntale a Don Flutter..."
                disabled={isLoading}
              />
              <button onClick={handleSend} disabled={isLoading || !input.trim()} className="p-3 text-blue-500 hover:text-blue-600 disabled:text-gray-400 disabled:cursor-not-allowed">
                <Send className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* BOTÓN FLOTANTE */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="bg-blue-600 text-white p-4 rounded-full shadow-lg hover:bg-blue-700 transition-transform duration-200 hover:scale-110"
          aria-label="Abrir Chatbot"
        >
          <MessageSquare className="h-6 w-6" />
        </button>
      )}
    </div>
  );
};

export default AIChatbot;
