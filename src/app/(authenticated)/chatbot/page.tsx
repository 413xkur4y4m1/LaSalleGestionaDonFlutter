
import AIChatbot from '@/components/organisms/Chatbot';
import DashboardTemplate from '@/components/templates/DashboardTemplate';

const ChatbotPage = () => {
  return (
    <DashboardTemplate>
      {/* Aumentamos la altura para que el chatbot sea más grande */}
      <div className="h-[calc(100vh-8rem)]">
        <AIChatbot />
      </div>
    </DashboardTemplate>
  );
};

export default ChatbotPage;
