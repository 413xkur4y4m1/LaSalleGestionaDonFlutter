import { useState, useRef } from "react";

export interface Message {
  id: string;
  sender: "user" | "bot";
  text: string;
  timestamp?: Date; // opcional para mostrar en ChatBubble
}

// Material ahora tiene todas las propiedades necesarias
export interface Material {
  id: string;
  nombre: string;        // nombre del material
  categoria: string;     // categoría del material
  cantidad: number;      // cantidad disponible
  precio_unitario: number; // precio unitario
  image: string;         // imagen para la UI
}

export const useChatbot = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [chatState, setChatState] = useState<
    "idle" | "selecting_material" | "selecting_date" | "showing_qr"
  >("idle");
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [generatedCode, setGeneratedCode] = useState<string | null>(null);
  const [materials] = useState<Material[]>([
    {
      id: "1",
      nombre: "Cuchillo de Chef",
      categoria: "Cocina",
      cantidad: 5,
      precio_unitario: 200,
      image: "/knife.png",
    },
    {
      id: "2",
      nombre: "Batidora",
      categoria: "Cocina",
      cantidad: 2,
      precio_unitario: 500,
      image: "/mixer.png",
    },
  ]);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const handleSend = () => {
    if (!input.trim()) return;
    setMessages((prev) => [
      ...prev,
      { id: Date.now().toString(), sender: "user", text: input, timestamp: new Date() },
    ]);
    setInput("");
    setIsProcessing(true);

    setTimeout(() => {
      setIsProcessing(false);
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now().toString(),
          sender: "bot",
          text: "Selecciona un material para continuar.",
          timestamp: new Date(),
        },
      ]);
      setChatState("selecting_material");
    }, 1000);
  };

  const handleMaterialSelect = (material: Material) => {
    setMessages((prev) => [
      ...prev,
      {
        id: Date.now().toString(),
        sender: "bot",
        text: `Has seleccionado: ${material.nombre}. Ahora elige una fecha de devolución.`,
        timestamp: new Date(),
      },
    ]);
    setChatState("selecting_date");
  };

  const handleDateSelect = (date: Date) => {
    setMessages((prev) => [
      ...prev,
      {
        id: Date.now().toString(),
        sender: "bot",
        text: `Perfecto, devolución el ${date.toLocaleDateString()}.`,
        timestamp: new Date(),
      },
    ]);
    setGeneratedCode("QR123456");
    setChatState("showing_qr");
  };

  return {
    isOpen,
    setIsOpen,
    chatState,
    messages,
    input,
    isProcessing,
    materials,
    generatedCode,
    messagesEndRef,
    setInput,
    handleSend,
    handleMaterialSelect,
    handleDateSelect,
  };
};
