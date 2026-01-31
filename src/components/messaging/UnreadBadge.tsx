import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface UnreadBadgeProps {
  count: number;
  className?: string;
}

export function UnreadBadge({ count, className }: UnreadBadgeProps) {
  if (count === 0) return null;

  return (
    <Badge
      variant="default"
      className={cn(
        "h-5 min-w-5 p-0 flex items-center justify-center text-xs",
        className
      )}
    >
      {count > 9 ? "9+" : count}
    </Badge>
  );
}
