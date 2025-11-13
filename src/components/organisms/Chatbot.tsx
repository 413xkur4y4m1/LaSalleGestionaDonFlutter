
"use client";

import { useState, useEffect, useRef } from 'react';
import { useSession } from 'next-auth/react';
import { Send, LoaderCircle } from 'lucide-react';
import LogoDonFlutter from '../atoms/LogoDonFlutter';

// Tipos de mensaje para la conversación
interface ChatMessage {
  role: 'user' | 'model'; // 'model' representa a la IA
  text: string;
}

// El componente del Chatbot de IA (versión de bloque, no flotante)
const AIChatbot = () => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  const { data: session } = useSession(); // Obtenemos la sesión del usuario
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Efecto para hacer scroll hacia el último mensaje
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Mensaje de bienvenida inicial
  useEffect(() => {
    setMessages([
      {
        role: 'model',
        text: '¡Hola! Soy Don Flutter, tu asistente virtual. ¿En qué puedo ayudarte hoy? Puedes preguntarme sobre tus préstamos activos o tus adeudos pendientes.',
      },
    ]);
  }, []);

  const handleSend = async () => {
    if (!input.trim() || !session?.user.id) return;

    const userMessage: ChatMessage = { role: 'user', text: input };
    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setInput('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          history: newMessages.map(m => ({ role: m.role, parts: [{ text: m.text }] })),
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
    // El contenedor principal ahora es flexible y ocupa el espacio disponible
    <div className="bg-white dark:bg-gray-800 shadow-2xl rounded-lg w-full h-full flex flex-col border border-gray-200 dark:border-gray-700">
      {/* Header */}
      <div className="p-3 bg-gray-100 dark:bg-gray-900 rounded-t-lg flex justify-between items-center border-b dark:border-gray-700">
        <div className="flex items-center space-x-2">
          <LogoDonFlutter className="h-8 w-8" />
          <h3 className="font-semibold text-gray-800 dark:text-gray-100">Don Flutter</h3>
        </div>
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
  );
};

export default AIChatbot;
