
import AIChatbot from '@/components/organisms/Chatbot';
import DashboardTemplate from '@/components/templates/DashboardTemplate';

const ChatbotPage = () => {
  return (
    <DashboardTemplate>
      <div className="h-[calc(100vh-12rem)]">
        <AIChatbot />
      </div>
    </DashboardTemplate>
  );
};

export default ChatbotPage;
