import { Calendar } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";

interface TaskCardProps {
  title: string;
  company: string;
  progress: number;
  dueDate: string;
  status: "In Progress" | "Under Review" | "Completed";
  onContinue?: () => void;
}

const statusColors = {
  "In Progress": "bg-info/10 text-info",
  "Under Review": "bg-warning/10 text-warning",
  "Completed": "bg-success/10 text-success",
};

export function TaskCard({
  title,
  company,
  progress,
  dueDate,
  status,
  onContinue,
}: TaskCardProps) {
  return (
    <Card className="shadow-card hover:shadow-card-hover transition-all">
      <CardContent className="p-5">
        <div className="flex justify-between items-start mb-3">
          <div>
            <h3 className="font-semibold text-foreground">{title}</h3>
            <p className="text-sm text-muted-foreground">{company}</p>
          </div>
          <Badge className={statusColors[status]} variant="status">
            {status}
          </Badge>
        </div>

        <div className="mb-4">
          <div className="flex justify-between text-sm mb-2">
            <span className="text-muted-foreground">Progress</span>
            <span className="font-medium text-foreground">{progress}%</span>
          </div>
          <Progress value={progress} className="h-2" />
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
            <Calendar className="h-4 w-4" />
            <span>Due: {dueDate}</span>
          </div>
          <Button variant="outline" size="sm" onClick={onContinue}>
            Continue
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
