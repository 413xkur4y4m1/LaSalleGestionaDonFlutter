"use client"; // Asegúrate de que esto sea un client component si usa hooks/interactividad

import { useState, useRef } from "react";
// Importar iconos si es necesario para la UI (ej. lucide-react)
import { MessageSquare, Send, X } from 'lucide-react'; 

// ... (El resto de tus interfaces Message y Material se mantienen igual)
export interface Message {
  id: string;
  sender: "user" | "bot";
  text: string;
  timestamp?: Date; 
}

export interface Material {
  id: string;
  nombre: string;
  categoria: string;
  cantidad: number;
  precio_unitario: number;
  image: string;
}

// ... (Tu hook useChatbot se mantiene igual, pero lo movemos dentro del archivo si lo prefieres)
export const useChatbot = () => {
    // ... (toda la lógica del hook que ya tenías)
    const [isOpen, setIsOpen] = useState(false);
    // ... (resto de estados y funciones: handleSend, handleMaterialSelect, etc.)

    const [chatState, setChatState] = useState<
        "idle" | "selecting_material" | "selecting_date" | "showing_qr"
    >("idle");
    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState("");
    const [isProcessing, setIsProcessing] = useState(false);
    const [generatedCode, setGeneratedCode] = useState<string | null>(null);
    const [materials] = useState<Material[]>([
        { id: "1", nombre: "Cuchillo de Chef", categoria: "Cocina", cantidad: 5, precio_unitario: 200, image: "/knife.png" },
        { id: "2", nombre: "Batidora", categoria: "Cocina", cantidad: 2, precio_unitario: 500, image: "/mixer.png" },
    ]);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const handleSend = () => { /* ... */ };
    const handleMaterialSelect = (material: Material) => { /* ... */ };
    const handleDateSelect = (date: Date) => { /* ... */ };

    return {
        isOpen, setIsOpen, chatState, messages, input, isProcessing, materials,
        generatedCode, messagesEndRef, setInput, handleSend, handleMaterialSelect, handleDateSelect,
    };
};


// Este es el NUEVO COMPONENTE que exportaremos por defecto
const ChatbotComponent = () => {
  const { 
    isOpen, setIsOpen, messages, input, setInput, handleSend, messagesEndRef,
    // Puedes usar el resto de los valores si tu UI los necesita
  } = useChatbot();

  return (
    <div className="fixed bottom-4 right-4 z-50">
      {isOpen && (
        <div className="bg-white shadow-lg rounded-lg w-80 h-96 flex flex-col">
          {/* Header del Chatbot */}
          <div className="p-4 bg-blue-600 text-white rounded-t-lg flex justify-between items-center">
            <h3>Asistente Ulsaneza</h3>
            <button onClick={() => setIsOpen(false)} className="p-1 rounded-full hover:bg-blue-700">
              <X className="h-5 w-5" />
            </button>
          </div>
          
          {/* Área de Mensajes */}
          <div className="flex-1 p-4 overflow-y-auto">
            {messages.map((msg) => (
              <div key={msg.id} className={`mb-2 ${msg.sender === 'user' ? 'text-right' : 'text-left'}`}>
                <span className={`inline-block p-2 rounded-lg ${msg.sender === 'user' ? 'bg-blue-100' : 'bg-gray-100'}`}>
                  {msg.text}
                </span>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>
          
          {/* Input del Chat */}
          <div className="p-4 border-t">
            <div className="flex">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                className="flex-1 border p-2 rounded-l-lg focus:outline-none"
                placeholder="Escribe un mensaje..."
              />
              <button onClick={handleSend} className="bg-blue-600 text-white p-2 rounded-r-lg hover:bg-blue-700">
                <Send className="h-5 w-5" />
              </button>
            </div>
          </div>

        </div>
      )}
      
      {/* Botón Flotante para Abrir/Cerrar */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="bg-blue-600 text-white p-4 rounded-full shadow-lg hover:bg-blue-700 transition duration-300"
          aria-label="Abrir Chatbot"
        >
          <MessageSquare className="h-6 w-6" />
        </button>
      )}
    </div>
  );
};

export default ChatbotComponent; // Exportación por defecto
