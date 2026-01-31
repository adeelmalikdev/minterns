import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { MessageSquare } from "lucide-react";
import { Navbar } from "@/components/Navbar";
import { Card } from "@/components/ui/card";
import { ConversationList } from "@/components/messaging/ConversationList";
import { ChatWindow } from "@/components/messaging/ChatWindow";
import { useConversations, useConversationByApplication } from "@/hooks/useConversations";
import { useIsMobile } from "@/hooks/use-mobile";

export default function RecruiterMessages() {
  const [searchParams] = useSearchParams();
  const applicationId = searchParams.get("app");
  const isMobile = useIsMobile();

  const { data: conversations = [], isLoading } = useConversations();
  const { data: conversationByApp } = useConversationByApplication(applicationId ?? undefined);

  const [selectedId, setSelectedId] = useState<string | undefined>();
  const [showChat, setShowChat] = useState(false);

  // Auto-select conversation from URL param
  useEffect(() => {
    if (conversationByApp) {
      setSelectedId(conversationByApp.id);
      setShowChat(true);
    }
  }, [conversationByApp]);

  // Auto-select first conversation on desktop
  useEffect(() => {
    if (!isMobile && conversations.length > 0 && !selectedId) {
      setSelectedId(conversations[0].id);
    }
  }, [conversations, isMobile, selectedId]);

  const selectedConversation = conversations.find((c) => c.id === selectedId);

  const handleSelectConversation = (id: string) => {
    setSelectedId(id);
    setShowChat(true);
  };

  const handleBackToList = () => {
    setShowChat(false);
  };

  return (
    <div className="min-h-screen bg-muted/30">
      <Navbar userRole="recruiter" />

      <main className="container py-8">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-foreground mb-2 flex items-center gap-3">
            <MessageSquare className="h-8 w-8" />
            Messages
          </h1>
          <p className="text-muted-foreground">
            Communicate with interns about their projects
          </p>
        </div>

        {/* Main Content */}
        <Card className="h-[calc(100vh-220px)] overflow-hidden">
          <div className="flex h-full">
            {/* Conversation List - hidden on mobile when chat is open */}
            <div
              className={`w-full md:w-80 border-r ${isMobile && showChat ? "hidden" : "block"}`}
            >
              <div className="p-4 border-b">
                <h2 className="font-semibold text-foreground">Conversations</h2>
              </div>
              <ConversationList
                conversations={conversations}
                selectedId={selectedId}
                onSelect={handleSelectConversation}
                isLoading={isLoading}
              />
            </div>

            {/* Chat Window */}
            <div
              className={`flex-1 flex flex-col ${isMobile && !showChat ? "hidden" : "flex"}`}
            >
              {isMobile && showChat && (
                <button
                  onClick={handleBackToList}
                  className="p-3 border-b text-sm text-muted-foreground hover:text-foreground transition-colors text-left"
                >
                  ← Back to conversations
                </button>
              )}
              <ChatWindow
                conversationId={selectedId}
                otherUserName={selectedConversation?.other_user_name ?? ""}
                opportunityTitle={selectedConversation?.opportunity_title ?? ""}
                companyName={selectedConversation?.company_name ?? ""}
              />
            </div>
          </div>
        </Card>
      </main>
    </div>
  );
}
