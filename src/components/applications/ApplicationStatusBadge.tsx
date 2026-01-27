import { Clock, CheckCircle, XCircle, AlertCircle, Play } from "lucide-react";
import { Badge } from "@/components/ui/badge";

type ApplicationStatus = "pending" | "accepted" | "rejected" | "in_progress" | "completed" | "withdrawn";

const statusConfig: Record<ApplicationStatus, { label: string; icon: React.ElementType; className: string }> = {
  pending: { label: "Pending", icon: Clock, className: "bg-warning/10 text-warning" },
  accepted: { label: "Accepted", icon: CheckCircle, className: "bg-success/10 text-success" },
  rejected: { label: "Rejected", icon: XCircle, className: "bg-destructive/10 text-destructive" },
  in_progress: { label: "In Progress", icon: Play, className: "bg-info/10 text-info" },
  completed: { label: "Completed", icon: CheckCircle, className: "bg-success/10 text-success" },
  withdrawn: { label: "Withdrawn", icon: AlertCircle, className: "bg-muted text-muted-foreground" },
};

interface ApplicationStatusBadgeProps {
  status: ApplicationStatus;
  showIcon?: boolean;
}

export function ApplicationStatusBadge({ status, showIcon = true }: ApplicationStatusBadgeProps) {
  const config = statusConfig[status];
  const Icon = config.icon;

  return (
    <Badge className={config.className}>
      {showIcon && <Icon className="h-3 w-3 mr-1" />}
      {config.label}
    </Badge>
  );
}
