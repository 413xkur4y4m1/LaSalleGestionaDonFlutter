// Combines: Textarea + IconoEnviar button
// Props:
//   - value: string
//   - onChange: (value: string) => void
//   - onSend: () => void
//   - disabled: boolean
//
// Features:
//   - Auto-resize textarea (max 4 rows)
//   - Enter key sends (Shift+Enter = new line)
//   - Button: absolute right, bg-[#e10022]
//   - Disabled state while AI processing

import React from 'react';
import IconoEnviar from '../atoms/IconoEnviar';

interface ChatInputProps {
  value: string;
  onChange: (value: string) => void;
  onSend: () => void;
  disabled: boolean;
}

const ChatInput: React.FC<ChatInputProps> = ({ value, onChange, onSend, disabled }) => {
  const handleKeyDown = (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      onSend();
    }
  };

  return (
    <div className="relative">
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={handleKeyDown}
        disabled={disabled}
        placeholder="Escribe tu mensaje..."
        className="w-full h-11 px-4 py-2 rounded-full border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#e10022]/50 resize-none overflow-hidden"
        style={{ maxHeight: '110px' }}
      />
      <button
        onClick={onSend}
        disabled={disabled}
        className="absolute right-2 bottom-2 bg-[#e10022] hover:bg-[#0a1c65] text-white rounded-full p-2 transition-colors duration-200"
      >
        <IconoEnviar />
      </button>
    </div>
  );
};

export default ChatInput;