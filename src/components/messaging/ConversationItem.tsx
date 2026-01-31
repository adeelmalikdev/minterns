import { formatDistanceToNow } from "date-fns";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import type { Conversation } from "@/hooks/useConversations";

interface ConversationItemProps {
  conversation: Conversation;
  isSelected: boolean;
  onClick: () => void;
}

export function ConversationItem({ conversation, isSelected, onClick }: ConversationItemProps) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "w-full text-left p-4 border-b transition-colors hover:bg-muted/50",
        isSelected && "bg-muted"
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="font-medium text-foreground truncate">
              {conversation.other_user_name}
            </span>
            {conversation.unread_count > 0 && (
              <Badge variant="default" className="h-5 min-w-5 p-0 flex items-center justify-center text-xs">
                {conversation.unread_count}
              </Badge>
            )}
          </div>
          <p className="text-sm text-muted-foreground truncate">
            {conversation.opportunity_title}
          </p>
          {conversation.last_message && (
            <p className="text-sm text-muted-foreground truncate mt-1">
              {conversation.last_message}
            </p>
          )}
        </div>
        {conversation.last_message_at && (
          <span className="text-xs text-muted-foreground shrink-0">
            {formatDistanceToNow(new Date(conversation.last_message_at), { addSuffix: true })}
          </span>
        )}
      </div>
    </button>
  );
}
