import { Building2, Clock, GraduationCap } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { SkillTag } from "./SkillTag";

interface OpportunityCardProps {
  title: string;
  company: string;
  skills: string[];
  duration: string;
  level: "Beginner" | "Intermediate" | "Advanced";
  isRemote?: boolean;
  onViewDetails?: () => void;
}

export function OpportunityCard({
  title,
  company,
  skills,
  duration,
  level,
  isRemote = true,
  onViewDetails,
}: OpportunityCardProps) {
  return (
    <Card className="shadow-card hover:shadow-card-hover transition-all">
      <CardContent className="p-5">
        <div className="flex justify-between items-start mb-3">
          <div>
            <h3 className="font-semibold text-foreground">{title}</h3>
            <div className="flex items-center gap-1.5 text-sm text-muted-foreground mt-1">
              <Building2 className="h-4 w-4" />
              <span>{company}</span>
            </div>
          </div>
          {isRemote && <Badge variant="remote">Remote</Badge>}
        </div>

        <div className="flex flex-wrap gap-2 mb-4">
          {skills.map((skill) => (
            <SkillTag key={skill} skill={skill} />
          ))}
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <span className="flex items-center gap-1">
              <Clock className="h-4 w-4" />
              {duration}
            </span>
            <span className="flex items-center gap-1">
              <GraduationCap className="h-4 w-4" />
              {level}
            </span>
          </div>
          <Button size="sm" onClick={onViewDetails}>
            View Details
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
