import { MessageSquare } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ConversationItem } from "./ConversationItem";
import type { Conversation } from "@/hooks/useConversations";

interface ConversationListProps {
  conversations: Conversation[];
  selectedId: string | undefined;
  onSelect: (id: string) => void;
  isLoading: boolean;
}

export function ConversationList({
  conversations,
  selectedId,
  onSelect,
  isLoading,
}: ConversationListProps) {
  if (isLoading) {
    return (
      <div className="p-4 space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="space-y-2">
            <Skeleton className="h-5 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
            <Skeleton className="h-4 w-full" />
          </div>
        ))}
      </div>
    );
  }

  if (conversations.length === 0) {
    return (
      <div className="p-8 text-center">
        <MessageSquare className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
        <h3 className="font-medium text-foreground mb-1">No Conversations</h3>
        <p className="text-sm text-muted-foreground">
          Messages will appear here when you have an accepted internship.
        </p>
      </div>
    );
  }

  return (
    <ScrollArea className="h-full">
      {conversations.map((conversation) => (
        <ConversationItem
          key={conversation.id}
          conversation={conversation}
          isSelected={conversation.id === selectedId}
          onClick={() => onSelect(conversation.id)}
        />
      ))}
    </ScrollArea>
  );
}
