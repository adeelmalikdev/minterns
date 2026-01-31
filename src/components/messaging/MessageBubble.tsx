import { format } from "date-fns";
import { Check, CheckCheck } from "lucide-react";
import { cn } from "@/lib/utils";

interface MessageBubbleProps {
  content: string;
  isOwn: boolean;
  timestamp: string;
  isRead: boolean;
}

export function MessageBubble({ content, isOwn, timestamp, isRead }: MessageBubbleProps) {
  return (
    <div className={cn("flex mb-3", isOwn ? "justify-end" : "justify-start")}>
      <div
        className={cn(
          "max-w-[70%] rounded-lg px-4 py-2",
          isOwn ? "bg-primary text-primary-foreground" : "bg-muted"
        )}
      >
        <p className="text-sm whitespace-pre-wrap break-words">{content}</p>
        <div className="flex items-center justify-end gap-1 mt-1">
          <span className={cn("text-xs", isOwn ? "opacity-70" : "text-muted-foreground")}>
            {format(new Date(timestamp), "HH:mm")}
          </span>
          {isOwn && (
            isRead ? (
              <CheckCheck className="h-3 w-3 text-blue-400" />
            ) : (
              <Check className="h-3 w-3 opacity-50" />
            )
          )}
        </div>
      </div>
    </div>
  );
}
