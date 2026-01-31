import { formatDistanceToNow } from "date-fns";
import { Bell, MessageSquare, CheckCircle, XCircle, FileText } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Notification } from "@/hooks/useNotifications";

interface NotificationItemProps {
  notification: Notification;
  onClick: () => void;
  showFull?: boolean;
}

const typeIcons: Record<string, React.ElementType> = {
  application_status: CheckCircle,
  new_message: MessageSquare,
  task_review: FileText,
};

const typeColors: Record<string, string> = {
  application_status: "text-success",
  new_message: "text-primary",
  task_review: "text-info",
};

export function NotificationItem({ notification, onClick, showFull = false }: NotificationItemProps) {
  const Icon = typeIcons[notification.type] || Bell;
  const iconColor = typeColors[notification.type] || "text-muted-foreground";
  const isUnread = !notification.read_at;

  return (
    <button
      onClick={onClick}
      className={cn(
        "w-full text-left p-4 border-b transition-colors hover:bg-muted/50",
        isUnread && "bg-primary/5"
      )}
    >
      <div className="flex gap-3">
        <div className={cn("mt-0.5", iconColor)}>
          <Icon className="h-5 w-5" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <p className={cn(
              "text-sm",
              isUnread ? "font-medium text-foreground" : "text-muted-foreground"
            )}>
              {notification.title}
            </p>
            {isUnread && (
              <span className="h-2 w-2 rounded-full bg-primary shrink-0 mt-1.5" />
            )}
          </div>
          <p className={cn(
            "text-sm mt-0.5",
            showFull ? "" : "line-clamp-2",
            isUnread ? "text-muted-foreground" : "text-muted-foreground/70"
          )}>
            {notification.message}
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            {formatDistanceToNow(new Date(notification.created_at), { addSuffix: true })}
          </p>
        </div>
      </div>
    </button>
  );
}
