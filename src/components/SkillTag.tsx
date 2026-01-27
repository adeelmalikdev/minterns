import { Badge } from "@/components/ui/badge";

interface SkillTagProps {
  skill: string;
  className?: string;
}

export function SkillTag({ skill, className }: SkillTagProps) {
  return (
    <Badge variant="skill" className={className}>
      {skill}
    </Badge>
  );
}
