import { Clock, Building2, MapPin, Calendar, Briefcase } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { formatDistanceToNow } from "date-fns";

interface Opportunity {
  id: string;
  title: string;
  company_name: string;
  description: string;
  skills_required: string[];
  duration_hours: number;
  level: "beginner" | "intermediate" | "advanced";
  is_remote: boolean;
  location: string | null;
  created_at: string;
}

interface OpportunityListCardProps {
  opportunity: Opportunity;
  onViewDetails: (id: string) => void;
}

const levelColors = {
  beginner: "bg-success/10 text-success border-success/20",
  intermediate: "bg-warning/10 text-warning border-warning/20",
  advanced: "bg-destructive/10 text-destructive border-destructive/20",
};

const levelLabels = {
  beginner: "Beginner",
  intermediate: "Intermediate",
  advanced: "Advanced",
};

// Map duration hours to readable format
function getDurationLabel(hours: number): string {
  if (hours <= 40) return "1 week";
  if (hours <= 80) return "2 weeks";
  if (hours <= 120) return "3 weeks";
  return "1 month+";
}

// Generate a consistent icon based on title
function getOpportunityIcon(title: string): string {
  const icons = ["🚀", "📊", "🎨", "☁️", "✅", "🤖", "💻", "📱", "🔧", "📈"];
  const hash = title.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0);
  return icons[hash % icons.length];
}

export function OpportunityListCard({ opportunity, onViewDetails }: OpportunityListCardProps) {
  const icon = getOpportunityIcon(opportunity.title);
  const durationLabel = getDurationLabel(opportunity.duration_hours);

  return (
    <Card className="shadow-card hover:shadow-card-hover transition-shadow">
      <CardContent className="p-5">
        <div className="flex gap-4">
          {/* Icon */}
          <div className="shrink-0 w-12 h-12 rounded-lg bg-muted flex items-center justify-center text-2xl">
            {icon}
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h3 className="font-semibold text-lg leading-tight mb-1">
                  {opportunity.title}
                </h3>
                <div className="flex items-center gap-1.5 text-muted-foreground text-sm">
                  <Building2 className="h-3.5 w-3.5" />
                  <span>{opportunity.company_name}</span>
                </div>
              </div>

              {/* Remote/On-site Badge */}
              <Badge
                variant="secondary"
                className="shrink-0"
              >
                {opportunity.is_remote ? "Remote" : "On-site"}
              </Badge>
            </div>

            {/* Description */}
            <p className="text-muted-foreground text-sm mt-2 line-clamp-2">
              {opportunity.description}
            </p>

            {/* Skills */}
            <div className="flex flex-wrap gap-1.5 mt-3">
              {opportunity.skills_required.slice(0, 4).map((skill) => (
                <Badge key={skill} variant="outline" className="text-xs font-normal">
                  {skill}
                </Badge>
              ))}
              {opportunity.skills_required.length > 4 && (
                <Badge variant="outline" className="text-xs font-normal">
                  +{opportunity.skills_required.length - 4} more
                </Badge>
              )}
            </div>

            {/* Meta info */}
            <div className="flex items-center justify-between mt-4">
              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Clock className="h-3.5 w-3.5" />
                  {durationLabel}
                </span>
                <span className="flex items-center gap-1">
                  <Briefcase className="h-3.5 w-3.5" />
                  <span className={`px-1.5 py-0.5 rounded text-xs ${levelColors[opportunity.level]}`}>
                    {levelLabels[opportunity.level]}
                  </span>
                </span>
                {opportunity.location && !opportunity.is_remote && (
                  <span className="flex items-center gap-1">
                    <MapPin className="h-3.5 w-3.5" />
                    {opportunity.location}
                  </span>
                )}
              </div>

              <Button size="sm" onClick={() => onViewDetails(opportunity.id)}>
                View Details
              </Button>
            </div>

            {/* Posted date */}
            <p className="text-xs text-muted-foreground mt-3">
              Posted {formatDistanceToNow(new Date(opportunity.created_at), { addSuffix: true })}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
