import { useEffect, useRef } from "react";
import { MessageSquare } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { MessageBubble } from "./MessageBubble";
import { MessageInput } from "./MessageInput";
import { useMessages } from "@/hooks/useMessages";
import { useAuth } from "@/hooks/useAuth";

interface ChatWindowProps {
  conversationId: string | undefined;
  otherUserName: string;
  opportunityTitle: string;
  companyName: string;
}

export function ChatWindow({
  conversationId,
  otherUserName,
  opportunityTitle,
  companyName,
}: ChatWindowProps) {
  const { user } = useAuth();
  const { messages, isLoading, sendMessage, markAsRead } = useMessages(conversationId);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Mark messages as read when viewing
  useEffect(() => {
    if (conversationId && messages.length > 0) {
      markAsRead.mutate();
    }
  }, [conversationId, messages.length]);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  if (!conversationId) {
    return (
      <div className="flex-1 flex items-center justify-center bg-muted/30">
        <div className="text-center">
          <MessageSquare className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-medium text-foreground mb-1">
            Select a Conversation
          </h3>
          <p className="text-sm text-muted-foreground">
            Choose a conversation from the list to start messaging
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col bg-background">
      {/* Header */}
      <div className="border-b p-4">
        <h2 className="font-semibold text-foreground">{otherUserName}</h2>
        <p className="text-sm text-muted-foreground">
          {opportunityTitle} • {companyName}
        </p>
      </div>

      {/* Messages */}
      <ScrollArea className="flex-1 p-4">
        {isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className={`flex ${i % 2 === 0 ? "justify-end" : "justify-start"}`}>
                <Skeleton className="h-16 w-48 rounded-lg" />
              </div>
            ))}
          </div>
        ) : messages.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground">
              No messages yet. Start the conversation!
            </p>
          </div>
        ) : (
          messages.map((message) => (
            <MessageBubble
              key={message.id}
              content={message.content}
              isOwn={message.sender_id === user?.id}
              timestamp={message.created_at}
              isRead={!!message.read_at}
            />
          ))
        )}
        <div ref={scrollRef} />
      </ScrollArea>

      {/* Input */}
      <MessageInput
        onSend={(text) => sendMessage.mutate(text)}
        isLoading={sendMessage.isPending}
      />
    </div>
  );
}
