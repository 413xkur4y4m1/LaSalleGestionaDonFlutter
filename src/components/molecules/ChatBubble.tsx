// Single message bubble
// Props:
//   - message: string
//   - sender: "user" | "bot"
//   - timestamp: Date
//
// Styles:
//   - User: bg-[#e10022] text-white, self-end, rounded-l-2xl rounded-tr-2xl
//   - Bot: bg-gray-100 text-gray-800, self-start, rounded-r-2xl rounded-tl-2xl
//   - Max width: responsive (see table)
//   - Timestamp: text-xs text-gray-400, below bubble

import React from 'react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

interface ChatBubbleProps {
  message: string;
  sender: 'user' | 'bot';
  timestamp: Date;
}

const ChatBubble: React.FC<ChatBubbleProps> = ({ message, sender, timestamp }) => {
  return (
    <div className={`flex flex-col max-w-[90%] sm:max-w-[85%] md:max-w-[70%] lg:max-w-[60%] xl:max-w-[50%] ${sender === 'user' ? 'self-end items-end' : 'self-start items-start'}`}>
      <div
        className={`
          rounded-2xl
          px-4 py-2
          text-sm
          ${sender === 'user'
            ? 'bg-[#e10022] text-white rounded-l-2xl rounded-tr-2xl'
            : 'bg-gray-100 text-gray-800 rounded-r-2xl rounded-tl-2xl'
          }
        `}
      >
        {message}
      </div>
      <span className="text-xs text-gray-400 self-end">
        {format(timestamp, 'MMM d, yyyy, h:mm a', { locale: es })}
      </span>
    </div>
  );
};

export default ChatBubble;