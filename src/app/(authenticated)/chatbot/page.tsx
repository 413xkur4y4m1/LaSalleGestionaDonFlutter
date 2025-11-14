
import AIChatbot from '@/components/organisms/Chatbot';
import DashboardTemplate from '@/components/templates/DashboardTemplate';

const ChatbotPage = () => {
  return (
    <DashboardTemplate>
      {/* Contenedor que mantiene la altura del chatbot fija y permite scroll interno */}
      <div className="h-[calc(100vh-10rem)] w-full max-w-4xl mx-auto">
        <AIChatbot />
      </div>
    </DashboardTemplate>
  );
};

export default ChatbotPage;
