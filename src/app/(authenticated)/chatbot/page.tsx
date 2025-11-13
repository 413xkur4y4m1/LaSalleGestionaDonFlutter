
import AIChatbot from '@/components/organisms/Chatbot';

const ChatbotPage = () => {
  return (
    <div className="w-full h-full max-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="w-full h-full max-w-4xl mx-auto">
        <AIChatbot />
      </div>
    </div>
  );
};

export default ChatbotPage;
